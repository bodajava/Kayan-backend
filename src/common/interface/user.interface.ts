import { GenderEnum, ProviderEnum, RoleEnum } from "../enums/user.enum.js";


export interface IUser {
    firstName: string;
    lastName: string;
    userName?: string;
    email: string;
    phone?: string;
    password?: string;
    profilePicture?: string;
    profileCoverPictures?: string[];

    gender: GenderEnum;
    role: RoleEnum;
    provider: ProviderEnum;

    changeCredatielTime?: Date;
    DOB?: Date;
    confirmEmail?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?:Date;    
    restoredAt?:Date
}