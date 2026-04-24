import z from "zod";
import { validationGeneralFaild } from "../../common/validation/validation.faild.js";

export const loginSchema = {
    body: z.object({
        email: validationGeneralFaild.email,
        password: validationGeneralFaild.password
    })
};

export const signupSchema = {
    body: z.object({
        userName: validationGeneralFaild.userName,
        email: validationGeneralFaild.email,
        password: validationGeneralFaild.password,
        phone: validationGeneralFaild.phone.optional(),
        profilePicture: validationGeneralFaild.profilePicture,
        profileCoverPictures: validationGeneralFaild.profileCoverPictures,
        gender: validationGeneralFaild.gender,
        role: validationGeneralFaild.role,
        provider: validationGeneralFaild.provider,
        DOB: validationGeneralFaild.DOB
    })
};

export const confirmEmail = {
    body: z.object({
        email: validationGeneralFaild.email,
        otp: validationGeneralFaild.otp
    })
};

export const reSendConfifrmEmailDto = {
    body: z.object({
        email: validationGeneralFaild.email,
    })
};