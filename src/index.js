import { connectDB } from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({path:"./env"});
connectDB()
    .then(() => { 
        app.listen(process.env.PORT || 8000, () => { console.log(`server is running on port ${process.env.PORT}`) });
        app.on("error", (error) => { console.log("express server cannot talk to db");process.exit(1) })
    })
    .catch(
        (error) => { console.log("mongo connection error"); process.exit(1); }
)