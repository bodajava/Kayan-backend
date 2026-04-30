import { HydratedDocument, Types } from "mongoose";
import { IUser } from "../../common/interface/user.interface.js";
import { cretePostBodyDTO } from "./post.dto.js";
import { UserRepository } from "../../DB/repository/user.repository.js";
import { S3Service, s3Service } from "../../common/services/s3.service.js";
import { RedisService, redisService } from "../../common/services/redis.service.js";
import { PostRepository } from "../../DB/repository/post.repository.js";
import { BadRequestException, NotFoundException } from "../../common/exception/domain.exception.js";
import { randomUUID } from "node:crypto";
import { NotificationService, notificationService } from '../../common/services/notification.service.js';
import { Ipost } from "../../common/interface/post.interface.js";

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

        const mentions: Types.ObjectId[] = []
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
            availability: avalibality,
            tags: mentions
        };

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

        return post.toJSON()
    }

}

export const postService = new PostService();
export default postService;