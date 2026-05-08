import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../../common/interface/user.interface.js";
import { UserRepository } from "../../DB/repository/user.repository.js";
import { S3Service, s3Service } from "../../common/services/s3.service.js";
import { RedisService, redisService } from "../../common/services/redis.service.js";
import { BadRequestException, NotFoundException } from "../../common/exception/domain.exception.js";
import { NotificationService, notificationService } from '../../common/services/notification.service.js';
import { CommentRepository } from "../../DB/repository/comment.repository.js";
import { PostRepository } from "../../DB/repository/post.repository.js";
import { createCommentBodyDTO, createCommentParamsDTO, createReplatCommentDTO } from "./comment.dto.js";
import { IComment } from "../../common/interface/comment.interface.js";
import { getAvalibalityQuery } from "../../common/utils/post.js";
import { Ipost } from "../../common/interface/post.interface.js";


export class CommentService {
    private readonly redis: RedisService;
    private readonly s3: S3Service;
    private readonly userRepository: UserRepository;
    private readonly commentRepository: CommentRepository;
    private readonly postRepository: PostRepository;
    private readonly notificationService: NotificationService;

    constructor() {
        this.redis = redisService;
        this.s3 = s3Service;
        this.userRepository = new UserRepository();
        this.commentRepository = new CommentRepository();
        this.postRepository = new PostRepository();
        this.notificationService = notificationService;
    }

    async createComment({ postId }: createCommentParamsDTO, { content, files, tags }: createCommentBodyDTO, user: HydratedDocument<IUser>): Promise<IComment> {

        const post = await this.postRepository.findOne({
            filter: {
                _id: postId,
                $or: [
                    getAvalibalityQuery(user)
                ]
            }
        })

        if (!post) {
            throw new NotFoundException("failed to find post")
        }

        const mentions: Types.ObjectId[] = []
        const FCM_TOKENS: string[] = []

        if (tags?.length) {
            const mentionsAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            })
            if (mentionsAccount.length !== tags.length) {
                throw new NotFoundException("Failed to find some or all mentioned accounts")
            }

            for (const tag of tags) {
                mentions.push(Types.ObjectId.createFromHexString(tag));
                (await this.redis.getFCMs(tag) || []).map(token => FCM_TOKENS.push(token))
            }
        }

        const folderId = post.folderId

        let attachments: string[] = []
        if (files?.length) {
            attachments = await this.s3.uploadFiles({
                files: files as Express.Multer.File[],
                path: `post/${folderId}`
            })
        }





        const comment = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                attachments,
                tags: mentions,
                postId: post._id,
                content: content as string
            }
        })



        if (!comment) {
            if (attachments?.length) {
                await this.s3.deleteImages({
                    Keys: attachments.map(ele => { return { Key: ele } })
                })
            }
            throw new BadRequestException("Failed to create comment")
        }

        if (FCM_TOKENS.length) {
            await this.notificationService.sendNotificatios({
                tokens: FCM_TOKENS, data: {
                    title: "post mention",
                    body: JSON.stringify({
                        message: `${user.userName} mentioned you in this post`,
                        postId: post._id,
                        commentId: comment._id
                    })
                }
            })
        }


        return comment.toJSON()
    }

    async replayComment({ postId, commentId }: createReplatCommentDTO, { content, files, tags }: createCommentBodyDTO, user: HydratedDocument<IUser>): Promise<IComment> {

        const comment = await this.commentRepository.findOne({
            filter: {
                _id: commentId,
                postId,
            },
            options: {
                populate: [
                    {
                        path: "postId",
                        match: {
                            $or: [getAvalibalityQuery(user)]
                        }
                    }
                ]
            }
        })

        if (!comment?.postId) {
            throw new NotFoundException("failed to find post")
        }



        const mentions: Types.ObjectId[] = []
        const FCM_TOKENS: string[] = []

        if (tags?.length) {
            const mentionsAccount = await this.userRepository.find({
                filter: {
                    _id: { $in: tags }
                }
            })
            if (mentionsAccount.length !== tags.length) {
                throw new NotFoundException("Failed to find some or all mentioned accounts")
            }

            for (const tag of tags) {
                mentions.push(Types.ObjectId.createFromHexString(tag));
                (await this.redis.getFCMs(tag) || []).map(token => FCM_TOKENS.push(token))
            }
        }

        const post = comment.postId as HydratedDocument<Ipost>

        const folderId = post.folderId

        let attachments: string[] = []
        if (files?.length) {
            attachments = await this.s3.uploadFiles({
                files: files as Express.Multer.File[],
                path: `post/${folderId}`
            })
        }





        const replay = await this.commentRepository.createOne({
            data: {
                createdBy: user._id,
                attachments,
                tags: mentions,
                postId: post._id,
                commentId: comment._id,
                content: content as string
            }
        })



        if (!replay) {
            if (attachments?.length) {
                await this.s3.deleteImages({
                    Keys: attachments.map(ele => { return { Key: ele } })
                })
            }
            throw new BadRequestException("Failed to create replay")
        }

        if (FCM_TOKENS.length) {
            await this.notificationService.sendNotificatios({
                tokens: FCM_TOKENS, data: {
                    title: "post mention",
                    body: JSON.stringify({
                        message: `${user.userName} mentioned you in this post`,
                        postId: post._id,
                        commentId: comment._id,
                        replayId: replay._id
                    })
                }
            })
        }


        return replay.toJSON()
    }



}

export const commentService = new CommentService();
export default commentService;