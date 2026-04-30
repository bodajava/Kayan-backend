import { createClient, RedisClientType } from "redis";
import { EmailEnumType } from "../enums/emailenum.js";
import { Types } from "mongoose";
import { configService } from "./config.service.js";

type RedisKeyType = {
  email: string;
  subject: EmailEnumType;
};

export class RedisService {
  private client: RedisClientType | null = null;

  constructor() { }

  public async connect() {
    try {
      this.client = createClient({
        url: configService.get('REDIS_URI')
      });

      this.client.on('error', (err) => console.error('Redis Client Error', err));

      await this.client.connect();
      console.log(`Redis connected ✅`);
    } catch (error) {
      console.error('Failed to connect to Redis ❌');
      console.error(error);
    }
  }

  private get getClient(): RedisClientType {
    if (!this.client) {
      throw new Error("Redis client not initialized. Call connect() first.");
    }
    return this.client;
  }

  /* ==================== CRUD OPERATIONS ==================== */

  public async set({ key, value, ttl }: { key: string; value: any; ttl?: number }): Promise<string | null> {
    try {
      const data = typeof value === "string" ? value : JSON.stringify(value);
      if (ttl) {
        return await this.getClient.set(key, data, { EX: ttl });
      }
      return await this.getClient.set(key, data);
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      return null;
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const data = await this.getClient.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  public async update({ key, value, ttl }: { key: string; value: any; ttl?: number }): Promise<string | number | null> {
    try {
      const isExist = await this.exists(key);
      if (!isExist) return 0;
      return await this.set({ key, value, ...(ttl !== undefined && { ttl }) }) as string | null;
    } catch (error) {
      console.error(`Redis UPDATE error for key ${key}:`, error);
      return null;
    }
  }

  public async exists(key: string): Promise<number> {
    try {
      return await this.getClient.exists(key);
    } catch (error) {
      console.error(`Redis EXISTS error for key ${key}:`, error);
      return 0;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      return await this.getClient.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  public async expire({ key, ttl }: { key: string; ttl: number }): Promise<boolean> {
    try {
      const result = await this.getClient.expire(key, ttl);
      return Boolean(result);
    } catch (error) {
      console.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  public async mget(keys: string[]): Promise<any[]> {
    try {
      if (!keys.length) return [];
      const data = await this.getClient.mGet(keys);

      return data.map((item) => {
        if (!item) return null;
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } catch (error) {
      console.error(`Redis MGET error:`, error);
      return [];
    }
  }

  public async findKeysByPrefix(prefix: string): Promise<string[]> {
    try {
      return await this.getClient.keys(`${prefix}*`);
    } catch (error) {
      console.error(`Redis KEYS error for prefix ${prefix}:`, error);
      return [];
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.getClient.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
      return 0;
    }
  }

  public async deleteKeys(keys: string[]): Promise<number> {
    try {
      if (!keys.length) return 0;
      return await this.getClient.del(keys);
    } catch (error) {
      console.error(`Redis DEL error for multiple keys:`, error);
      return 0;
    }
  }

  public async incr(key: string): Promise<number> {
    try {
      return await this.getClient.incr(key);
    } catch (error) {
      console.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  }

  public async decr(key: string): Promise<number> {
    try {
      return await this.getClient.decr(key);
    } catch (error) {
      console.error(`Redis DECR error for key ${key}:`, error);
      return 0;
    }
  }



  FCM_key(userId: Types.ObjectId | string): string {
    return `user:FCM:${userId.toString()}`;
  }
  async addFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.getClient.sAdd(this.FCM_key(userId), FCMToken);
  }

  async removeFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.getClient.sRem(this.FCM_key(userId), FCMToken);
  }

  async getFCMs(userId: Types.ObjectId | string) {
    return await this.getClient.sMembers(this.FCM_key(userId));
  }

  async hasFCMs(userId: Types.ObjectId | string) {
    return await this.getClient.sCard(this.FCM_key(userId));
  }

  async removeFCMUser(userId: Types.ObjectId | string) {
    return await this.getClient.del(this.FCM_key(userId));
  }
}

export const redisService = new RedisService();

/* ==================== KEY GENERATORS ==================== */

export const baseRevokeTokenKey = (userId: Types.ObjectId | string | number) => {
  return `RevokeToken::${userId.toString()}`;
};

export const revokeTokenKey = ({ userId, jti }: { userId: Types.ObjectId | string; jti: string }) => {
  return `${baseRevokeTokenKey(userId)}::${jti}`;
};

export const otpKey = ({ email, subject }: RedisKeyType) => {
  return `OTP::User::${email}::${subject}`;
};

export const blockOtpKey = ({ email, subject }: RedisKeyType) => {
  return `${otpKey({ email, subject })}::Block`;
};

export const maxAttemptOtp = ({ email, subject }: RedisKeyType) => {
  return `${otpKey({ email, subject })}::MaxTrial`;
};

export const pendingUserKey = (email: string) => {
  return `PendingUser::${email}`;
};




