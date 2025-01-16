import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
export async function connectDB() {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Mongodb connected!!! at host ${connectionInstance.connection.host}`)
    } catch (error) {
        consolele.console.log(`mongodb connection failed!!  ${error}`);
        process.exit(1);
        
    }
 }
// export connectDB;