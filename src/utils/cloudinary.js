import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { asyncHandler } from "./asyncHandler.js";
import { isDebugging } from "../constants.js";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = asyncHandler(
  async (filePath) => {
    const response = await cloudinary.uploader.upload(filePath, { resource_type: "auto" });
    if(isDebugging){console.log(`successfully uploaded image to cloudinary on url : ${response?.url||'no url because your file is not there'},now deleting from local storage`);}
    fs.unlinkSync(filePath);
    return response;
    
  }
);

const deleteFromCloudinary = asyncHandler(
  (filePath) =>
  {
    if (isDebugging) { console.log(`deleting cloudinary image on url ${filePath}`); }
    cloudinary.uploader.destroy(filePath);
  }
);

export { uploadToCloudinary,deleteFromCloudinary };