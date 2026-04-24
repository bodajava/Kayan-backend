import { HydratedDocument } from "mongoose";
import { redisService, RedisService, baseRevokeTokenKey } from "../../common/services/redis.service.js";
import { tokenService, TokenService } from "../../common/services/token.service.js";
import { logoutEnum } from "../../common/enums/user.enum.js";
import { ConflictException } from "../../common/exception/domain.exception.js";
import { IUser } from "../../common/interface/user.interface.js";
import { s3Service, S3Service } from "../../common/services/s3.service.js";
import { storageEnum } from "../../common/enums/multer.enum.js";
import { configService } from "../../common/services/config.service.js";

export class UserService {
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly s3: S3Service;

  constructor() {
    this.redis = redisService;
    this.tokenService = tokenService;
    this.s3 = s3Service;
  }

  async profile(user: HydratedDocument<IUser>) {
    return user.toJSON();
  }

  async profileImgae({ ContentType, originalname }: { ContentType: string; originalname: string }, user: HydratedDocument<IUser>): Promise<{ user: IUser; url: string }> {
    const { url, Key } = await this.s3.createPresignedUploadLink({
      path: `users/${user._id.toString()}/profile`,
      ContentType,
      originalname,
    });
    user.profilePicture = Key as string;
    await user.save();
    return { user, url };
  }

  async profileCoverImages(files: Express.Multer.File[], user: HydratedDocument<IUser>): Promise<IUser> {
    const urls = await this.s3.uploadFiles({
      files,
      path: `users/${user._id.toString()}/profile/cover`,
      storageAprotch: storageEnum.DISK
    });
    user.profileCoverPictures = urls;
    await user.save();
    return user.toJSON();
  }

  async rotateToken(user: HydratedDocument<IUser>, { sub, jti, iat }: { jti: string; iat: number; sub: string }, issuer: string) {
    const accessExpireIn = configService.get('ACCESS_EXPIRE_IN_DEV');
    if ((iat + accessExpireIn) * 1000 >= Date.now() + (30000)) {
      throw new ConflictException("Current access token is still valid. Refresh is not required yet.");
    }

    await this.tokenService.createRevokeTokenKey({
      userId: sub,
      jti,
      ttl: configService.get('REFRESH_EXPIRE_IN_DEV')
    });

    return await this.tokenService.createTokenLogin(user, issuer);
  }

  async logout(flag: logoutEnum, user: HydratedDocument<IUser>, { jti, iat, sub }: { jti: string; iat: number; sub: string }): Promise<number> {
    let status = 200;
    switch (flag) {
      case logoutEnum.all:
        user.changeCredatielTime = new Date();
        await user.save();
        const prefix = baseRevokeTokenKey(user._id.toString());
        const keys = await this.redis.findKeysByPrefix(prefix);
        await this.redis.deleteKeys(keys);
        break;
      default:
        await this.tokenService.createRevokeTokenKey({
          userId: user._id,
          jti,
          ttl: configService.get('REFRESH_EXPIRE_IN_DEV')
        });
        status = 201;
        break;
    }
    return status;
  }
}

export default new UserService();