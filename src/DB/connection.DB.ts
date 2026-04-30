import { configService } from "../common/services/config.service.js";
import { connect } from "mongoose"
import UserModel from "./model/user.model.js";

export const connectDB = async () => {
    try {
        console.log(`Connecting to Database...`);
        await connect(configService.get("DB_URL"), {
            serverSelectionTimeoutMS: 30000, // 30 seconds timeout
            connectTimeoutMS: 30000,
        });
        await UserModel.createCollection();

        console.log(`Database connected successfully ✅`);
    } catch (error) {
        console.error(`Database connection error: ${error}`);

        throw error;
    }
}

export default connectDB;