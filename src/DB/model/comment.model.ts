import { model, Schema, Types, UpdateQuery } from "mongoose";
import { IComment } from "../../common/interface/comment.interface.js";
const commentSchema = new Schema<IComment>(
    {


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



        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        postId: {
            type: Types.ObjectId, ref: "Post", required: true
        },


        commentId: {
            type: Types.ObjectId,
            ref: "Comment",
            default: null
        },

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
        collection: "Comment"
    }
);

commentSchema.pre(["find", "findOne", "countDocuments"], function () {

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

commentSchema.pre(["updateOne", "findOneAndUpdate"], function () {

    // fix type casting
    const update = this.getUpdate() as UpdateQuery<IComment> & IComment


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

commentSchema.pre(["deleteOne", "findOneAndDelete"], function () {

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

commentSchema.virtual('replay', {
    localField: "_id",
    foreignField: "commentId",
    ref: "Comment"
})

export const CommentModel = model<IComment>("Comment", commentSchema);