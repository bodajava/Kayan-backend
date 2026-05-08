import { Types } from "mongoose";
import { IUser } from "./user.interface.js";
import { Ipost } from "./post.interface.js";

export interface IComment {

    content?: string;
    attachments?: string[];

    likes?: Types.ObjectId[] | IUser[];
    tags?: Types.ObjectId[] | IUser[];

    postId: Types.ObjectId | Ipost
    commentId?: Types.ObjectId | IComment

    createdBy: Types.ObjectId | IUser;
    updatedBy?: Types.ObjectId | IUser;

    createdAt: Date;
    deletedAt?: Date;
    restoredAt?: Date;
    updatedAt: Date;
}