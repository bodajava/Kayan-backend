import { SignupDto, confirmEmailDto, ResendConfirmEmailDto, loginDTO } from "./auth.dto.js";
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from "../../common/exception/domain.exception.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.security.js";
import { UserRepository } from "../../DB/repository/user.repository.js";
import { generatencrypt } from "../../common/utils/security/encryption.security.js";
import { sendEmail } from "../../common/utils/email/send.email.js";
import { emailTemplet } from "../../common/utils/email/templet.email.js";
import { EmailEnum, EmailEnumType } from "../../common/enums/emailenum.js";
import { generateRandomCode } from "../../common/utils/security/random.security.js";
import { redisService, RedisService, otpKey, blockOtpKey, maxAttemptOtp, pendingUserKey } from "../../common/services/redis.service.js";
import { emailEvent } from "../../common/utils/email/event.email.js";
import { ProviderEnum } from "../../common/enums/user.enum.js";
import { tokenService, TokenService } from "../../common/services/token.service.js";
import { OAuth2Client } from "google-auth-library";
import { configService } from "../../common/services/config.service.js";

export class AuthenticationService {
  private readonly userRepository: UserRepository;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly googleClient = new OAuth2Client();

  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisService;
    this.tokenService = tokenService;
  }

  public async signup(data: SignupDto): Promise<any> {
    const { password, phone, ...restData } = data;

    const checkUserExist = await this.userRepository.findOne({
      filter: { email: restData.email },
      projection: "email",
      options: { lean: true }
    });

    if (checkUserExist) {
      throw new BadRequestException("Email already exists");
    }

    const encodedPhone = phone ? await generatencrypt({ value: phone }) : undefined;

    const userData = {
      ...restData,
      ...(encodedPhone && { phone: encodedPhone }),
      password: password,
    };

    await this.redis.set({
      key: pendingUserKey(restData.email),
      value: userData,
      ttl: 3600 // 1 hour TTL for registration
    });

    await this.sendEmailOtp({
      email: restData.email,
      subject: EmailEnum.confirmEmail,
      title: `Verify this ${restData.email} account`
    });

    return { message: "Signup initiated. Please check your email to verify your account." };
  }

  public async confirmEmail(inputs: confirmEmailDto): Promise<any> {
    const { email, otp } = inputs;

    const pendingUser = await this.redis.get(pendingUserKey(email));

    if (!pendingUser) {
      const userExists = await this.userRepository.findOne({
        filter: { email, confirmEmail: { $exists: true } },
        projection: "email",
        options: { lean: true }
      });

      if (userExists) {
        throw new ConflictException("Email already confirmed. Please login.");
      }
      throw new NotFoundException("No pending registration found for this email. Please signup again.");
    }

    const hashOtp = await this.redis.get(otpKey({ email, subject: EmailEnum.confirmEmail }));

    if (!hashOtp) {
      throw new NotFoundException("Expired OTP. Please request a new one.");
    }

    if (!await compareHash({ plainText: `${otp}`, cipherText: hashOtp })) {
      throw new ConflictException("Invalid OTP. Please check your email and try again.");
    }

    const user = await this.userRepository.createOne({
      data: {
        ...pendingUser,
        confirmEmail: new Date()
      }
    });

    if (!user) {
      throw new BadRequestException("Failed to complete registration 💁");
    }

    await Promise.all([
      this.redis.del(pendingUserKey(email)),
      this.redis.del(otpKey({ email, subject: EmailEnum.confirmEmail })),
      this.redis.del(maxAttemptOtp({ email, subject: EmailEnum.confirmEmail }))
    ]);

    const userResponse = user.toObject();
    delete userResponse.password;

    return userResponse;
  }

  public async resendConfirmEmail(inputs: ResendConfirmEmailDto): Promise<any> {
    const { email } = inputs;

    let userFound = await this.redis.exists(pendingUserKey(email));

    if (!userFound) {
      const user = await this.userRepository.findOne({
        filter: { email },
        projection: "confirmEmail",
        options: { lean: true }
      });

      if (!user) {
        throw new NotFoundException("User not found. Please signup first.");
      }

      if (user.confirmEmail) {
        throw new ConflictException("Email already confirmed. Please login.");
      }
    }

    await this.sendEmailOtp({
      email,
      subject: EmailEnum.confirmEmail,
      title: `Verify your account`
    });

    return { message: "Activation email resent successfully. Please check your inbox." };
  }

  public async login(input: loginDTO, issuer: string): Promise<any> {
    const { email, password } = input;

    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM
      }
    });

    if (!user) {
      throw new NotFoundException("Email not found");
    }

    if (!user.confirmEmail) {
      throw new UnauthorizedException("Please confirm your email before logging in");
    }

    if (!await compareHash({ plainText: password, cipherText: user.password })) {
      throw new UnauthorizedException("Invalid password");
    }

    return await this.tokenService.createTokenLogin(user, issuer);
  }

  private async sendEmailOtp({ email, subject, title }: { email: string; subject: EmailEnumType; title: string }) {
    const remainingOtpTtl = await this.redis.ttl(otpKey({ email, subject }));
    const isBlockedTtl = await this.redis.ttl(blockOtpKey({ email, subject }));

    if (isBlockedTtl > 0) {
      throw new BadRequestException(`Your email is temporarily blocked. Please wait ${isBlockedTtl} seconds before requesting a new OTP.`);
    }

    if (remainingOtpTtl > 0) {
      throw new BadRequestException(`Please wait ${remainingOtpTtl} seconds before requesting a new OTP.`);
    }

    const maxTrialStr = await this.redis.get(maxAttemptOtp({ email, subject }));
    const maxTrialNum = Number(maxTrialStr) || 0;

    if (maxTrialNum >= 3) {
      await this.redis.set({
        key: blockOtpKey({ email, subject }),
        value: 1,
        ttl: 7 * 60 // 7 minutes block
      });
      throw new BadRequestException("Too many attempts. Your account has been temporarily blocked for 7 minutes.");
    }

    const code = generateRandomCode();
    await this.redis.set({
      key: otpKey({ email, subject }),
      value: await generateHash({ plainText: `${code}` }),
      ttl: 120 // 2 minutes
    });

    emailEvent.emit("sendEmail", async () => {
      await sendEmail({
        to: email,
        subject: subject as string,
        html: await emailTemplet({ code: Number(code), title }),
      });
    });

    await this.redis.incr(maxAttemptOtp({ email, subject }));
    await this.redis.expire({ key: maxAttemptOtp({ email, subject }), ttl: 360 }); // 6 minutes window
  }

  private async verifyGoogleAccount(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: [configService.get('CLIENT_GOOGLE_ID')],
    });
    return ticket.getPayload();
  }

  public async signupWithGmail({ idToken }: { idToken: string }, issuer: string): Promise<any> {
    const payload = await this.verifyGoogleAccount(idToken);
    if (!payload || !payload.email_verified) throw new BadRequestException("Email is not verified");

    const userExist = await this.userRepository.findOne({
      filter: { email: payload.email as string }
    });

    if (userExist) {
      if (userExist.provider !== ProviderEnum.GOOGLE) {
        throw new ConflictException("Email already exists with another provider.");
      }
      return {
        message: "User already exists. Login successful.",
        statusCode: 200,
        user: await this.tokenService.createTokenLogin(userExist, issuer)
      };
    }

    const newUser = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name || "User",
        lastName: payload.family_name || "",
        email: payload.email as string,
        provider: ProviderEnum.GOOGLE,
        confirmEmail: new Date(),
        profilePicture: payload.picture
      } as any
    });

    return {
      message: "User created successfully.",
      statusCode: 201,
      user: await this.tokenService.createTokenLogin(newUser, issuer)
    };
  }

  public async loginWithGmail({ idToken }: { idToken: string }, issuer: string): Promise<any> {
    const payload = await this.verifyGoogleAccount(idToken);
    if (!payload) throw new BadRequestException("Invalid credentials.");

    const user = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
        provider: ProviderEnum.GOOGLE,
      }
    });

    if (!user) throw new NotFoundException("Invalid account provider or not registered. Please signup.");

    return {
      user: await this.tokenService.createTokenLogin(user, issuer),
      statusCode: 200
    };
  }

  public async googleSiginupAndLogin({ idToken }: { idToken: string }, issuer: string): Promise<any> {
    const payload = await this.verifyGoogleAccount(idToken);
    if (!payload || !payload.email_verified) throw new BadRequestException("Email address is not verified.");

    const user = await this.userRepository.findOne({
      filter: { email: payload.email as string }
    });

    if (user) {
      if (user.provider === ProviderEnum.GOOGLE) {
        return { credentials: await this.tokenService.createTokenLogin(user, issuer), isNew: false };
      }
      throw new ConflictException("Email already exists. Please login using your system credentials.");
    }

    const newUser = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name || "User",
        lastName: payload.family_name || "",
        email: payload.email as string,
        provider: ProviderEnum.GOOGLE,
        confirmEmail: new Date(),
        profilePicture: payload.picture
      } as any
    });

    const credentials = await this.tokenService.createTokenLogin(newUser, issuer);
    return { credentials, isNew: true };
  }
}

export default new AuthenticationService();