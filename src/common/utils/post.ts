import { HydratedDocument } from "mongoose";
import { IUser } from "../interface/user.interface.js";
import { AvalibilityEnum } from "../enums/post.enum.js";


export const getAvalibalityQuery = (user: HydratedDocument<IUser>) => ({
    $or: [
        { availability: AvalibilityEnum.PUBLIC },
        { availability: AvalibilityEnum.ONLY_ME, createdBy: user._id },
        { tags: { $in: [user._id] } },
        { availability: AvalibilityEnum.FRINDS, createdBy: { $in: [user._id, ...(user.frinds || [])] } },
        { exceptedFor: { $nin: [user._id] } }
    ]
})