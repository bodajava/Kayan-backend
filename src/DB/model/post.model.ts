import mongoose, { UpdateQuery } from "mongoose";
const { Schema, model, models } = mongoose;
import { Ipost } from "../../common/interface/post.interface.js";
import { AvalibilityEnum } from "../../common/enums/post.enum.js";

const postSchema = new Schema<Ipost>(
    {
        folderId: {
            type: String,
            required: true
        },

        content: {
            type: String,
            required: function (this) {
                return !this.attachments?.length;
            }
        },

        attachments: {
            type: [String],
            default: []
        },

        availability: {
            type: Number,
            enum: Object.values(AvalibilityEnum).filter(v => typeof v === 'number'),
            default: AvalibilityEnum.PUBLIC
        },

        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        tags: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        deletedAt: {
            type: Date
        },

        restoredAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
        strict: true,
        strictQuery: true,
        collection: "Post"
    }
);

postSchema.pre(["find", "findOne"], function () {

    const { paranoid, ...query } = this.getQuery();

    if (paranoid == false) {
        this.setQuery({
            ...query
        })
    } else {
        this.setQuery({
            ...query,
            deletedAt: { $exists: false }
        })
    }
})

postSchema.pre(["updateOne", "findOneAndUpdate"], function () {

    // fix type casting
    const update = this.getUpdate() as UpdateQuery<Ipost> & Ipost


    if (update.deletedAt) {

        this.getQuery().paranoid = true

        this.setUpdate({
            ...this.getUpdate(),

            // fix unset override
            $unset: {
                ...(this.getUpdate() as any).$unset,
                restoredAt: 1
            }
        })
    }



    if (update.restoredAt) {

        this.setQuery({
            ...this.getQuery(),
            paranoid: false,
            deletedAt: { $exists: true }
        })

        this.setUpdate({
            ...this.getUpdate(),

            // fix unset override
            $unset: {
                ...(this.getUpdate() as any).$unset,
                deletedAt: 1
            }
        })
    }



    // remove paranoid from mongo query
    const { paranoid, force, ...query } = this.getQuery()

    if (paranoid == false) {
        this.setQuery({
            ...query
        })
    } else {
        this.setQuery({
            ...query,
            deletedAt: { $exists: false }
        })
    }

})

postSchema.pre(["deleteOne", "findOneAndDelete"], function () {

    const { force, ...query } = this.getQuery()

    if (force == true) {
        this.setQuery({
            ...query
        })
    } else {
        this.setQuery({
            ...query,
            deletedAt: { $exists: true }
        })
    }

})

export const PostModel = models.post || model<Ipost>("Post", postSchema);