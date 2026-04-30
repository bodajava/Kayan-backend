import { HydratedDocument } from "mongoose";
import { redisService, RedisService, baseRevokeTokenKey } from "../../common/services/redis.service.js";
import { tokenService, TokenService } from "../../common/services/token.service.js";
import { logoutEnum } from "../../common/enums/user.enum.js";
import { ConflictException, NotFoundException } from "../../common/exception/domain.exception.js";
import { IUser } from "../../common/interface/user.interface.js";
import { s3Service, S3Service } from "../../common/services/s3.service.js";
import { storageEnum } from "../../common/enums/multer.enum.js";
import { UserRepository } from "../../DB/repository/user.repository.js";

export class UserService {
    private readonly redis: RedisService;
    private readonly tokenService: TokenService;
    private readonly s3: S3Service;
    private readonly userRepository: UserRepository;

    constructor() {
        this.redis = redisService;
        this.tokenService = tokenService;
        this.s3 = s3Service;
        this.userRepository = new UserRepository();
    }

    async profile(user: HydratedDocument<IUser>) {
        return user.toJSON();
    }

    async profileImgae({ ContentType, originalname }: { ContentType: string, originalname: string }, user: HydratedDocument<IUser>): Promise<{ user: IUser, url: string }> {
        // const oldpic = user.profilePicture
        const { url } = await this.s3.createPresignedUploadLink({
            path: `users/${user._id.toString()}/profile`,
            ContentType,
            originalname,
        })
        // // user.profilePicture = Key as string
        // // await user.save()
        // if (oldpic) {
        //     await this.s3.deleteImage({
        //         Key: oldpic
        //     })
        // }

        return { user, url }
    }

    async profileCoverImages(files: Express.Multer.File[], user: HydratedDocument<IUser>): Promise<IUser> {
        const oldUrls = user.profileCoverPictures
        const urls = await this.s3.uploadFiles({
            files,
            path: `users/${user._id.toString()}/profile/cover`,
            storageAprotch: storageEnum.DISK
        })
        user.profileCoverPictures = urls

        if (oldUrls?.length) {
            await this.s3.deleteImages({
                Keys: oldUrls.map(ele => ({
                    Key: ele
                }))
            })
        }
        await user.save()
        return user.toJSON()
    }

    async rotateToken(user: HydratedDocument<IUser>, { sub, jti, iat }: { jti: string, iat: number, sub: string }, issuer: string) {
        if ((iat + (parseInt(process.env.ACCESS_EXPIRE_IN_DEV as string))) * 1000 >= Date.now() + (30000)) {
            throw new ConflictException("Current access token is still valid. Refresh is not required yet.");
        }

        await this.tokenService.createRevokeTokenKey({
            userId: sub,
            jti,
            ttl: parseInt(process.env.REFRESH_EXPIRE_IN_DEV as string) || 31536000
        });

        return await this.tokenService.createTokenLogin(user, issuer);
    }

    async logout(flag: logoutEnum, user: HydratedDocument<IUser>, { jti, iat, sub }: { jti: string, iat: number, sub: string }): Promise<number> {
        let status = 200;
        switch (flag) {
            case logoutEnum.all:
                user.changeCredatielTime = new Date();
                await user.save();
                const prefix = baseRevokeTokenKey(user._id.toString());
                const keys = await this.redis.findKeysByPrefix(prefix);
                console.log("🔍 logout:all → prefix:", prefix, "→ keys found:", keys);
                await this.redis.deleteKeys(keys);
                break;
            default:
                await this.tokenService.createRevokeTokenKey({
                    userId: user._id,
                    jti,
                    ttl: parseInt(process.env.REFRESH_EXPIRE_IN_DEV as string) || 31536000
                });
                status = 201;
                break;
        }
        return status;
    }

    async deleteProfile(user: HydratedDocument<IUser>) {
        const account = await this.userRepository.deleteOne({
            filter: {
                _id: user._id,
            }
        })

        if (!account) {
            throw new NotFoundException("This user isn't deleted.");
        }

        await this.s3.deleteFolderByPrefix({
            prefix: `users/${user._id.toString()}`
        })


        return account
    }


}

export const userService = new UserService();
export default userService;