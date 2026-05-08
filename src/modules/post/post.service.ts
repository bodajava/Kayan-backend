import mongoose, { HydratedDocument, Types } from "mongoose";
import { IUser } from "../../common/interface/user.interface.js";
import { cretePostBodyDTO, reactPostParamsDTO, reactPostQueryDTO, UpdatePostParamsDTO, UpdatePostQueryDTO } from "./post.dto.js";
import { UserRepository } from "../../DB/repository/user.repository.js";
import { S3Service, s3Service } from "../../common/services/s3.service.js";
import { RedisService, redisService } from "../../common/services/redis.service.js";
import { BadRequestException, NotFoundException } from "../../common/exception/domain.exception.js";
import { randomUUID } from "node:crypto";
import { NotificationService, notificationService } from '../../common/services/notification.service.js';
import { Ipost } from "../../common/interface/post.interface.js";
import { getAvalibalityQuery } from "../../common/utils/post.js";
import { PaginatDTO } from "../../common/validation/validation.faild.js";
import { Ipagination } from "../../common/interface/pagination.interface.js";
import { toObjectId } from "../../common/utils/objectId.js";
import { PostRepository } from "../../DB/repository/post.repository.js";


export class PostService {
    private readonly redis: RedisService;
    private readonly s3: S3Service;
    private readonly userRepository: UserRepository;
    private readonly postRepository: PostRepository;
    private readonly notificationService: NotificationService;

    constructor() {
        this.redis = redisService;
        this.s3 = s3Service;
        this.userRepository = new UserRepository();
        this.postRepository = new PostRepository();
        this.notificationService = notificationService;
    }

    async createPost({ avalibality, content, files, tags }: cretePostBodyDTO, user: HydratedDocument<IUser>): Promise<Ipost> {

        const mentions: mongoose.Types.ObjectId[] = []
        const FCM_TOKENS: string[] = []

        if (tags?.length) {
            const mentionsAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            })
            if (mentionsAccount.length !== tags.length) {
                throw new NotFoundException("Faild to find some for all mention account")
            }

            for (const tag of tags) {
                mentions.push(Types.ObjectId.createFromHexString(tag));
                (await this.redis.getFCMs(tag) || []).map(token => FCM_TOKENS.push(token))
            }
        }

        const folderId = randomUUID()

        let attachments: string[] = []
        if (files?.length) {
            attachments = await this.s3.uploadFiles({
                files: files as Express.Multer.File[],
                path: `post/${folderId}`
            })
        }

        const postData: Partial<Ipost> = {
            createdBy: user._id,
            attachments,
            folderId,
            tags: mentions
        };

        if (avalibality !== undefined) {
            postData.availability = avalibality as any;
        }

        if (content !== undefined) {
            postData.content = content;
        }

        const post = await this.postRepository.createOne({
            data: postData
        })

        if (!post) {
            if (attachments?.length) {
                await this.s3.deleteImages({
                    Keys: attachments.map(ele => { return { Key: ele } })
                })
            }
            throw new BadRequestException("Faild")
        }

        if (FCM_TOKENS.length) {
            await this.notificationService.sendNotificatios({
                tokens: FCM_TOKENS, data: {
                    title: "post mention",
                    body: JSON.stringify({
                        message: `${user.userName} mentioned you in this post`,
                        postId: post._id
                    })
                }
            })
        }

        return post.toJSON() as Ipost
    }

    async postList({ page, size, search }: PaginatDTO, user: HydratedDocument<IUser>): Promise<Ipagination<Ipost>> {

        const posts = await this.postRepository.paginate({
            filter: {
                ...getAvalibalityQuery(user),
                ...(search?.length ? { content: { $regex: search, $options: "i" } } : {})
            },
            page,
            size,
            options: {
                populate: [{ path: "comment", populate: [{ path: "replay", populate: [{ path: "replay" }] }] }]
            }
        })
        return posts
    }

    async reactPost({ postId }: reactPostParamsDTO, { react }: reactPostQueryDTO, user: HydratedDocument<IUser>): Promise<Ipost> {
        const post = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                ...getAvalibalityQuery(user)
            },
            update: {
                ...(Number(react) > 0 ? { $addToSet: { likes: user._id } } : { $pull: { likes: user._id } })
            }
        })

        if (!post) {
            throw new NotFoundException("Failed to find the post or access denied")
        }

        return post.toJSON() as Ipost
    }


    async updatePosts({ postId }: UpdatePostParamsDTO, { avalibality, content, files = [], tags = [], removeFiles = [], removeTags = [] }: UpdatePostQueryDTO, user: HydratedDocument<IUser>): Promise<Ipost> {
        const updatePost = await this.postRepository.findOne({
            filter: {
                _id: postId,
                createdBy: user._id
            }
        })

        if (!updatePost) {
            throw new NotFoundException("invalid matching post")
        }



        if (!updatePost.content && !content && !files?.length && updatePost.attachments?.length == removeFiles?.length) {
            throw new BadRequestException("we can't leve empty post")
        }



        const mentions: mongoose.Types.ObjectId[] = []
        const FCM_TOKENS: string[] = []

        if (tags?.length) {
            const mentionsAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            })
            if (mentionsAccount.length !== tags.length) {
                throw new NotFoundException("Faild to find some for all mention account")
            }

            for (const tag of tags) {
                mentions.push(Types.ObjectId.createFromHexString(tag));
                (await this.redis.getFCMs(tag) || []).map(token => FCM_TOKENS.push(token))
            }
        }

        const folderId = updatePost.folderId

        let attachments: string[] = []
        if (files?.length) {
            attachments = await this.s3.uploadFiles({
                files: files as Express.Multer.File[],
                path: `post/${folderId}`
            })
        }

        const postData: Partial<Ipost> = {
            createdBy: user._id,
            attachments,
            folderId,
            tags: mentions
        };

        if (avalibality !== undefined) {
            postData.availability = avalibality as any;
        }

        if (content !== undefined) {
            postData.content = content;
        }

        const post = await this.postRepository.findOneAndUpdate({
            filter: {
                _id: postId,
                createdBy: user._id
            },
            update: [{
                $set: {
                    content: content || updatePost.content,
                    availability: Number(avalibality || updatePost.availability),
                    updatedBy: user._id,
                    attachments: {
                        $setUnion: [
                            { $setDifference: ["$attachments", removeFiles || []] },
                            attachments
                        ]
                    },
                    tags: {
                        $setUnion: [
                            { $setDifference: ["$tags", (removeTags || []).map(ele => { return toObjectId(ele) })] },
                            mentions
                        ]
                    }
                }
            }]
        })

        if (!post) {
            if (attachments?.length) {
                await this.s3.deleteImages({
                    Keys: attachments.map(ele => { return { Key: ele } })
                })
            }
            throw new BadRequestException("Faild")
        }
        if (removeFiles?.length) {
            await this.s3.deleteImages({
                Keys: removeFiles.map(ele => { return { Key: ele } })
            })
        }

        if (FCM_TOKENS.length) {
            await this.notificationService.sendNotificatios({
                tokens: FCM_TOKENS, data: {
                    title: "post mention",
                    body: JSON.stringify({
                        message: `${user.userName} mentioned you in this post`,
                        postId: post._id
                    })
                }
            })
        }

        return post.toJSON()
    }

}

export const postService = new PostService();
export default postService;