import jwt, { JwtPayload, SignOptions, Secret } from "jsonwebtoken";
import { tokenTypeEnum } from '../enums/token.enum.js';
import { RoleEnum } from "../enums/user.enum.js";
import { redisService, RedisService, revokeTokenKey } from "./redis.service.js";
import { UnauthorizedException } from "../exception/domain.exception.js";
import { UserRepository } from "../../DB/repository/user.repository.js";
import { randomUUID } from "node:crypto";
import { configService } from "./config.service.js";

export type SignatureType = {
  accessSignature: string;
  refreshAccessSignature: string;
  audience: string;
};

export class TokenService {
  private readonly redis: RedisService;
  private readonly userRepository: UserRepository;

  constructor() {
    this.redis = redisService;
    this.userRepository = new UserRepository();
  }

  public sign = async ({
    payload,
    secret = configService.get('USER_ACCESS_TOKE_SIGNATURE') as Secret,
    options = {}
  }: {
    payload: object;
    secret?: Secret;
    options?: SignOptions;
  }): Promise<string> => {
    return jwt.sign(payload, secret, options);
  };

  public verify = async ({
    token,
    secret = configService.get('USER_ACCESS_TOKE_SIGNATURE') as Secret
  }: {
    token: string;
    secret?: Secret;
  }): Promise<JwtPayload | string> => {
    return jwt.verify(token, secret) as JwtPayload | string;
  };

  private async generateToken({ payload, secretKey, options }: { payload: object; secretKey: string; options: SignOptions }): Promise<string> {
    return jwt.sign(payload, secretKey, options);
  }

  private async verifyToken({ token, secretKey }: { token: string; secretKey: string }): Promise<JwtPayload | string> {
    return jwt.verify(token, secretKey, { clockTolerance: 60 }) as JwtPayload | string;
  }

  private errorExecution({ message, statusCode }: { message: string; statusCode: number }) {
    return new UnauthorizedException(message);
  }

  public getTokenSignature = async (role: RoleEnum): Promise<SignatureType> => {
    let accessSignature: string;
    let refreshAccessSignature: string;
    let audience = 'User';

    switch (role) {
      case RoleEnum.ADMIN:
        accessSignature = configService.get('SYSTEM_ACCESS_TOKE_SIGNATURE');
        refreshAccessSignature = configService.get('SYSTEM_REFRISH_TOKE_SIGNATURE');
        audience = 'System';
        break;

      case RoleEnum.USER:
      default:
        accessSignature = configService.get('USER_ACCESS_TOKE_SIGNATURE');
        refreshAccessSignature = configService.get('USER_REFRISH_TOKE_SIGNATURE');
        audience = 'User';
        break;
    }

    return { accessSignature, refreshAccessSignature, audience };
  };

  public createTokenLogin = async (user: any, issuer?: string) => {
    const { accessSignature, refreshAccessSignature, audience } = await this.getTokenSignature(user.role);
    const jwtid = randomUUID();

    const accessExpireIn = configService.isProd
      ? configService.get('ACCESS_EXPIRE_IN_PROD')
      : configService.get('ACCESS_EXPIRE_IN_DEV');

    const refreshExpireIn = configService.isProd
      ? configService.get('REFRESH_EXPIRE_IN_PROD')
      : configService.get('REFRESH_EXPIRE_IN_DEV');

    const accessToken = await this.generateToken({
      payload: { sub: user._id },
      secretKey: accessSignature,
      options: {
        ...(issuer ? { issuer } : {}),
        audience: [tokenTypeEnum.Access, audience],
        expiresIn: accessExpireIn,
        jwtid
      }
    });

    const refreshToken = await this.generateToken({
      payload: { sub: user._id },
      secretKey: refreshAccessSignature,
      options: {
        ...(issuer ? { issuer } : {}),
        audience: [tokenTypeEnum.Refresh, audience],
        expiresIn: refreshExpireIn,
        jwtid
      }
    });

    return { accessToken, refreshToken };
  };

  public getSignatureLevel = async (audienceType: string): Promise<RoleEnum> => {
    switch (audienceType) {
      case 'System':
        return RoleEnum.ADMIN;
      default:
        return RoleEnum.USER;
    }
  };

  public decodedToken = async ({ token, tokenType = tokenTypeEnum.Access }: { token?: string; tokenType?: string } = {}) => {
    let rawToken = token?.trim();
    while (rawToken && /^Bearer\s+/i.test(rawToken)) {
      rawToken = rawToken.replace(/^Bearer\s+/i, '').trim();
    }

    if (!rawToken) {
      throw this.errorExecution({ message: "Authentication required. Please login.", statusCode: 401 });
    }

    const decoded = jwt.decode(rawToken) as any;

    if (!decoded) {
      throw this.errorExecution({ message: "Invalid session format. Please login again.", statusCode: 401 });
    }

    const aud = decoded.aud
      ? (Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud])
      : [tokenType, 'User'];

    const decodedTokenType = aud.length > 1 ? aud[0] : null;
    const audienceType = aud.length > 1 ? aud[1] : aud[0];

    if (decodedTokenType && decodedTokenType !== tokenType) {
      throw this.errorExecution({
        message: "Authentication error. Please use the correct credentials.",
        statusCode: 401
      });
    }

    const signatureLevel = await this.getSignatureLevel(audienceType);
    const { accessSignature, refreshAccessSignature } = await this.getTokenSignature(signatureLevel);
    const secretKey = tokenType === tokenTypeEnum.Refresh ? refreshAccessSignature : accessSignature;

    try {
      const verifiedData = await this.verifyToken({ token: rawToken, secretKey }) as any;

      const user = await this.userRepository.findOne({
        filter: { _id: verifiedData.sub }
      });

      if (!user) {
        throw new UnauthorizedException("Account not found. Please register to continue.");
      }

      if (decoded.jti && await this.redis.get(revokeTokenKey({ userId: decoded.sub, jti: decoded.jti }))) {
        throw new UnauthorizedException("Session expired. Please login again.");
      }

      if (user.changeCredatielTime && Math.floor(user.changeCredatielTime.getTime() / 1000) >= decoded.iat) {
        throw new UnauthorizedException("Session invalid due to security changes. Please login again.");
      }

      return { user, decoded };

    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException("Your session has expired. Please login again to continue.");
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException("Invalid session. Please login again.");
      }
      throw error;
    }
  };

  createRevokeTokenKey = async ({ userId, jti, ttl }: { userId: import("mongoose").Types.ObjectId | string; jti: string; ttl: number }) => {
    await this.redis.set({
      key: revokeTokenKey({ userId, jti }),
      value: jti,
      ttl: ttl || configService.get('REFRESH_EXPIRE_IN_DEV')
    });
  }
}

export const tokenService = new TokenService();
