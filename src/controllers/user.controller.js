import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js"
import { validateEmail, validateFullName, validatePassword, validateUsername } from "../utils/validation.js";
import { isDebugging } from "../constants.js";


const registerUser = asyncHandler(
    async (req, res) => {
        if (isDebugging) { console.log("started register User"); }
        
        
        
        const { fullName,username,email,password } = req.body;
        

        //  if statement as they provide more detailed and precise errors
        
        if (isDebugging) { console.log({ username, fullName, email, password }); }
        
        if (  !validateUsername(username)   ) { throw new ApiError(400, "Username is required") }
        if (  !validatePassword(password)   ) { throw new ApiError(400, "password is required") }
        if (  !validateEmail(email)         ) { throw new ApiError(400, "email is required");   }
        if (  !validateFullName(fullName)   ) { throw new ApiError(400, "password is required") }

        if  (  [validateEmail(email), validateFullName(fullName), validateUsername(username), validatePassword(password)]
              .some(   ( el ) => el==false       )
            )
        {
            throw new ApiError(400, "all fields are required");
        }
        const checkUser = await User.findOne({
            $or:[{username},{email}]
        })
        
        if (checkUser) { throw new ApiError(400, "user with this name or email already exists"); }        
        
        const avatarLocalFilePath = req.files.avatar[0]?.path;
        if (!avatarLocalFilePath) { throw new ApiError(400, "avatar is required"); }
        
        const coverImageLocalFilePath = req.files.coverImage[0]?.path;
        
        const avatar = await uploadToCloudinary(avatarLocalFilePath);
        if (!avatar) { throw new ApiError(500, "error in saving image to cloudinary") }
        
        const coverImage = await uploadToCloudinary(coverImageLocalFilePath);
        
        if(isDebugging){console.log("db createCall");console.log({ username, email, fullName, avatar: avatar.url, coverImage: coverImage?.url || "", password, });}

       const createdUser = await User.create({
         username,
         email,
         fullName,
         avatar: avatar.url,
         coverImage: coverImage?.url || "",
         password,
       });
        
        if (isDebugging) { console.log("return from db"); console.log(createdUser); }
        if (!createdUser) { throw new ApiError(500,"cannot save user to database try again"); }
        
        createdUser.refreshToken = createdUser.password = undefined;
       
        res.status(201)
            .json(
            new ApiResponse(201, createdUser,"user registered successfully")
                
        )
        
        
        

}
);

export {registerUser}