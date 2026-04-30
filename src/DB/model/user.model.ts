import { model, Schema } from "mongoose";
import { IUser } from "../../common/interface/user.interface.js";
import { GenderEnum, ProviderEnum, RoleEnum } from "../../common/enums/user.enum.js";
import { generateHash } from "../../common/utils/security/hash.security.js";
import { generateEncrypt } from "../../common/utils/security/encryption.security.js";



const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    phone: { type: String },

    password: {
        type: String,
        required: function (this: IUser) {
            return this.provider === ProviderEnum.SYSTEM;
        }
    },

    profilePicture: { type: String },
    profileCoverPictures: { type: [String] },

    gender: {
        type: Number,
        enum: Object.values(GenderEnum).filter(v => typeof v === 'number'),
        default: GenderEnum.MALE
    },

    role: {
        type: Number,
        enum: Object.values(RoleEnum).filter(v => typeof v === 'number'),
        default: RoleEnum.USER
    },

    provider: {
        type: Number,
        enum: Object.values(ProviderEnum).filter(v => typeof v === 'number'),
        default: ProviderEnum.SYSTEM
    },

    changeCredatielTime: { type: Date },
    DOB: { type: Date },
    confirmEmail: { type: Date },
    deletedAt: { type: Date },
    restoredAt: { type: Date },


}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    collection: "User",
});


userSchema.virtual("userName").set(function (this: any, value: string) {
    const [firsName, lastName] = value.split(" ") || [];
    this.firstName = firsName;
    this.lastName = lastName;
}).get(function (this: any) {
    return `${this.firstName} ${this.lastName}`;
});

userSchema.pre(["find", "findOne", "findOneAndUpdate", "countDocuments", "updateOne", "updateMany"], function () {
    const options = this.getOptions();

    if (options.paranoid === false) {
        return;
    }

    this.where({ deletedAt: { $exists: false } });
});

userSchema.pre("save", async function () {
    (this as any).wasNew = this.isNew;

    if (this.isModified("password") && this.password) {
        this.password = await generateHash({ plainText: this.password });
    }

    if (this.isModified("phone") && this.phone) {
        this.phone = await generateEncrypt({ value: this.phone });
    }
});

const UserModel = model<IUser>("User", userSchema);

export default UserModel;