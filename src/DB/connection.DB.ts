import { connect } from "mongoose"
import UserModel from "./model/user.model.js";

export const connectDB = async () => {
    try {
        console.log(`Connecting to Database...`);
        await connect(process.env.DB_URL as string);
        await UserModel.createCollection();

        console.log(`Database connected successfully ✅`);
    } catch (error) {
        console.error(`Database connection error: ${error}`);
        if (error instanceof Error && error.name === 'MongooseServerSelectionError') {
            console.warn('TIP: This often happens due to IP whitelisting issues in MongoDB Atlas. Ensure your current IP is whitelisted.');
        }
        throw error; 
    }
}

export default connectDB;