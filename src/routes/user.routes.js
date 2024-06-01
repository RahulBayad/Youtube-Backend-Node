import { Router } from "express";
import { 
    loginUser,
    logoutUser, 
    registerUser, 
    refreshTheAccessToken, 
    changePassword, 
    getCurrentUser,
    updateUserAvatar,
    updateUserCoverImage,
    updateAccountDetails,
    getUserChannelProfile
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { jwtVerify } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(upload.fields([{name : "avatar",maxCount:1},{name : "coverImage",maxCount:1}]) , registerUser)
router.route("/login").post(loginUser)  
router.route("/logout").post(jwtVerify, logoutUser)
router.route("/refresh-token").post(refreshTheAccessToken)
router.route("/change-password").post(jwtVerify, changePassword)
router.route("/current-user").get(jwtVerify, getCurrentUser)
router.route("/update-account").post(jwtVerify, updateAccountDetails)
router.route("/avatar").post(jwtVerify, updateUserAvatar)
router.route("/coverimage").post(jwtVerify, updateUserCoverImage)
router.route("/channel/:username").get(getUserChannelProfile)

export default router