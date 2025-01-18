import Router from "express";
import {
  changeCurrentPassword,
  deleteUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]), registerUser);
    
router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);    

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router.route("/update-details").post(verifyJWT, updateAccountDetails);

router.route("/update-avatar").post(verifyJWT, upload.single("avatar"), updateUserAvatar);

router.route("/update-coverImage").post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/delete").delete(verifyJWT, deleteUser);

export default router;