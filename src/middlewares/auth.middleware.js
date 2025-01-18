import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { isDebugging } from "../constants.js";
import { httpCodes } from "../constants.js";
export const verifyJWT = asyncHandler(
    async (req, res, next) => {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if (isDebugging) { console.log(`accessToekn : ${accessToken}`); }
        if (!accessToken) { throw new ApiError(httpCodes.unauthorized, "secure routes required login"); }
        const decodedToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        if (!decodedToken) { throw new ApiError(httpCodes.unprocessableEntity, "Invalid token"); }
        req.user = await User.findById(decodedToken._id).select("-password");
        next();
    }
);