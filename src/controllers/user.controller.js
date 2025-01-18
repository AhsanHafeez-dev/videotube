import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import {User} from "../models/user.model.js"
import { validateAndUpdateCloudinaryImage, validateEmail, validateFullName, validatePassword, validateUsername } from "../utils/validation.js";
import { httpCodes, isDebugging, secureCookieOptions } from "../constants.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async (user) => {
    if (isDebugging) { console.log(`generating access and refresh token for user : ${user.username}`); }
    
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    if (isDebugging) { console.log(`access token generated for ${user.username} : ${accessToken}`); }
    
    // we dont want other items in mongoose model to be saved to kicked in again
    await user.save({ validateBeforeSave: false })
    
    if (isDebugging) { console.log({ accessToken, refreshToken }); }
    return { accessToken, refreshToken };
    
    
}






// controllers
const registerUser = asyncHandler(
    async (req, res) => {
        if (isDebugging) { console.log("started register User"); }
        
        
        
        const { fullName,username,email,password } = req.body;
        

        //  if statement as they provide more detailed and precise errors
        
        if (isDebugging) { console.log({ username, fullName, email, password }); }
        
        // I prefer this because of verbose and specific error messages
        if (  !validateUsername(username)   ) { throw new ApiError(httpCodes.badRequest, "Username is required") }
        if (  !validatePassword(password)   ) { throw new ApiError(httpCodes.badRequest, "password is required") }
        if (  !validateEmail(email)         ) { throw new ApiError(httpCodes.badRequest, "email is required");   }
        if (  !validateFullName(fullName)   ) { throw new ApiError(httpCodes.badRequest `   `, "password is required") }

        // alternative precise code approach
        // if  (  [validateEmail(email), validateFullName(fullName), validateUsername(username), validatePassword(password)]
        //       .some(   ( el ) => el==false       )
        //     )
        // {
        //     throw new ApiError(httpCodes.badRequest, "all fields are required");
        // }


        const checkUser = await User.findOne({
            $or:[{username},{email}]
        })
        
        if (checkUser) { throw new ApiError(httpCodes.conflict, "user with this name or email already exists"); }        
        
        const avatarLocalFilePath = req.files.avatar[0]?.path;
        if (!avatarLocalFilePath) { throw new ApiError(httpCodes.badRequest, "avatar is required"); }
        let coverImageLocalFilePath = "";
        console.log("checking if");
        if (req.files.coverImage) { console.log("got if"); coverImageLocalFilePath = req.files.coverImage[0]?.path;}
    
        
        const avatar = await uploadToCloudinary(avatarLocalFilePath);
        if (!avatar) { throw new ApiError(httpCodes.badGateway, "error in saving image to cloudinary") }
        
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
        if (!createdUser) { throw new ApiError(httpCodes.badGateway,"cannot save user to database try again"); }
        
        createdUser.refreshToken = createdUser.password = undefined;
       
        res.status(201)
            .json(
            new ApiResponse(201, createdUser,"user registered successfully")
                
        )
        
        
        

}
);





const loginUser = asyncHandler(
    async (req, res) => {
        if (isDebugging) { console.log("start of login controller"); console.log(req.body)}
        // getting data
        const { username, email, password } = req.body;
        
        if (isDebugging) { console.log({ username, email, password }); }
        
        // sanity checks
        if (!email && !username) { throw new ApiError(httpCodes.badRequest, "required fields cannot be null"); }

        if (isDebugging) { console.log(`db request to fetch user with username : ${username} or email : ${email}`); }
        // verifcation
        const user = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (!user) {
            if (isDebugging) { console.log(`user not found in db`); }
            throw new ApiError(httpCodes.notFound, "Incorrect username or password");

        }
        const validPassword = await user.isPasswordCorrect(password);
        if (!validPassword) { throw new ApiError(httpCodes.unauthorized, "incorrect user credentials"); }
        
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);
        if (isDebugging) { console.log(accessToken); }
        user.password = undefined;
        if (isDebugging) { console.log("sending httpCodes.ok response from login controller"); }
        res.status(httpCodes.ok)
            .cookie("accessToken", accessToken, secureCookieOptions)
            .cookie("refreshToken", refreshToken, secureCookieOptions)
            .json(
                new ApiResponse(httpCodes.ok, { user: user, accessToken, refreshToken }, "successfully logged in user")
            );
        
        
    }
);





const logoutUser = asyncHandler(async (req, res) =>
{ 
    if (isDebugging) { console.log("starting logout controller"); }
    req.user.refreshToken = undefined;
    await req.user.save();
    if (isDebugging) { console.log(`sending httpCodes.ok from logout controller of user : ${req.user.username}`); }
    res
        .status(httpCodes.ok)
        .clearCookie("accessToken", secureCookieOptions)
        .clearCookie("refreshToken", secureCookieOptions)
        .json(
            new ApiResponse(httpCodes.ok, {}, "logged out successfully")
        );
}
);


    const refreshAccessToken = asyncHandler(async (req, res) => {
    if (isDebugging) { console.log("started refresh Access Token controller"); }

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (isDebugging) { console.log(`got token from cookies : ${incomingRefreshToken}`); }
    
    if (!incomingRefreshToken) { throw new ApiError(httpCodes.unauthorized, "Unauthorized user"); }
    
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    if (isDebugging) { console.log(`refresh token decoded : ${decodedToken}`); }
    
    if (!decodedToken) { throw new ApiError(httpCodes.unauthorized, "Invalid token"); }

    const user = await User.findById(decodedToken._id);
    if (!user) { throw new ApiError(httpCodes.unauthorized, "Invalid token or expired token"); }

    if (isDebugging) { console.log(`db refresh token  : ${user.refreshToken}`); }
    
    if (user.refreshToken !== incomingRefreshToken) { throw new ApiError("Invalid token or expired"); }
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user);
    
    if (isDebugging) { console.log(`newsly generated tokens : ${(accessToken, refreshToken)}`); }
    if (isDebugging) { console.log("ended refresh Access Token controller sending httpCodes.ok response"); }
    
    res.
        status(httpCodes.ok)
        .cookie("accessToken", accessToken, secureCookieOptions)
        .cookie("refreshToken", refreshToken, secureCookieOptions)
        .json(new ApiResponse(httpCodes.ok, { accessToken, refreshToken }, "successfully generated new tokens"));
    });
 
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    if (!await req.user.isPasswordCorrect(oldPassword)) { throw new ApiError(httpCodes.unprocessableEntity, "Incorrect old password"); }
    if (!validatePassword(newPassword)) { throw new ApiError(httpCodes.badRequest, "Invalid new password"); }
    
    req.user.password = newPassword;
    await req.user.save({validationBeforeSave:false});
    res.status(httpCodes.ok)
        .json(new ApiResponse(httpCodes.noContent, {}, "password changes successfully"));
    
});
const getCurrentUser = asyncHandler(
    (req, res) => {
        res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, req.user, "current user fetched successfully"));
    }
)
const updateAccountDetails = asyncHandler(async (req, res) => {
    
    const { email, fullName } = req.body;
    const user = req.user;    
    if (!validateEmail(email) || validateFullName(fullName)) { throw new ApiError(httpCodes.badRequest, "Invalid email or fullname"); }
    user.email = email;
    user.fullName = fullName;
    await user.save({validateBeforeSave:false});
    user.password = undefined;
    res.status(httpCodes.ok)
    .json(new ApiResponse(httpCodes.ok,user,"updated user profile details"))
    
})
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatrtLocalFilePath = req.file?.path || "";
    const user = req.user;
    const avatar = await validateAndUpdateCloudinaryImage(avatrtLocalFilePath,user.avatar);
    user.avatar = avatar.url;
    await user.save({validationBeforeSave:false});
    res.status(httpCodes.ok).json(new ApiResponse(httpCodes.ok, { user }, "avatar updated successfully"))

});
const updateUserCoverImage = asyncHandler(async (req, res) => {
    
    const coverImageLocalPath = req.file?.path || "";
    const user = req.user;
    const coverImage = await validateAndUpdateCloudinaryImage(coverImageLocalPath, user.coverImage);
    user.coverImage = coverImage.url;
    await user.save({validationBeforeSave:false});
    res .status(httpCodes.ok)
        .json(new ApiResponse(httpCodes.ok, user, "coverImage updated successfully"));
    
})

const deleteUser = asyncHandler(async (req, res) => {
    const _id = req.user._id;;
    await User.deleteOne({ _id });
    res
        .status(httpCodes.ok)
        .clearCookie("accessToken", secureCookieOptions)
        .clearCookie("refreshToken", secureCookieOptions)
        .json(new ApiResponse(httpCodes.noContent,{},"user Deleted SuccessFully"))
    
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails,
    deleteUser
}