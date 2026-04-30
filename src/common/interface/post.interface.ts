import { Types } from "mongoose";
import { IUser } from "./user.interface.js";
import { AvalibilityEnum } from "../enums/post.enum.js";

export interface Ipost {

    folderId: string;
    content?: string;
    attachments?: string[];

    likes?: Types.ObjectId[] | IUser[];
    tags?: Types.ObjectId[] | IUser[];

    availability: AvalibilityEnum;

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;

    createdAt: Date;
    deletedAt?: Date;
    restoredAt?: Date;
    updatedAt: Date;
}