import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary.js";
import {ApiError} from "./ApiError.js"
import { httpCodes } from "../constants.js";
const validateEmail = function (email) { return email?.trim != ""; };

const validatePassword = function (password) {return password?.trim != "";};
const validateUsername = function (username) {return username?.trim != "";};
const validateFullName = function (fullName) { return fullName?.trim != ""; };
const validateAndUpdateCloudinaryImage = async function (localFilePath,prevPath,imageName)
{
    if (!localFilePath) { throw new ApiError(httpCodes.badRequest, "image is required"); }
    
    await deleteFromCloudinary(prevPath);
    
    const cloudinarResponse = await uploadToCloudinary(localFilePath);
    if (!cloudinarResponse) { throw new ApiError(httpCodes.badGateway, {}, "could not upload image to cloud "); }
    return cloudinarResponse;
    
 }
export { validateEmail, validateFullName, validatePassword, validateUsername,validateAndUpdateCloudinaryImage };

