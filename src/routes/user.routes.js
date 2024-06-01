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
import multer from "multer";

const router = Router()

router.route("/register").post(upload.fields([{name : "avatar",maxCount:1},{name : "coverImage",maxCount:1}]) , registerUser)
router.route("/login").post(loginUser)  
router.route("/logout").post(jwtVerify, logoutUser)
router.route("/refresh-token").post(refreshTheAccessToken)
router.route("/change-password").post(jwtVerify, changePassword)
router.route("/current-user").get(jwtVerify, getCurrentUser)
router.route("/update-account").patch(jwtVerify, updateAccountDetails)
router.route("/avatar").patch(jwtVerify, upload.single("avatar"), updateUserAvatar)
router.route("/coverimage").patch(jwtVerify, upload.single("coverImage"), updateUserCoverImage)
router.route("/channel/:username").get( jwtVerify, getUserChannelProfile)

export default router