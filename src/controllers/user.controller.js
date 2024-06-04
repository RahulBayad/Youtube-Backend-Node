import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { asyncHandler } from './../utils/asyncHandler.js'
import { ApiError } from "./../utils/ApiError.js"
import { ApiResponse } from "./../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Schema } from "mongoose";

const generateAccessAndRefreshToken = async (userId) =>{
    const user = await User.findById(userId)

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    if(!accessToken || !refreshToken){
        throw new ApiError(500, "Unable to generate tokens")
    }
    user.refreshToken = refreshToken
    user.save({validateBeforeSave : false});

    return {accessToken , refreshToken}

}

const registerUser = asyncHandler(async (req,res)=>{

    const {username , email ,fullName , password} = req.body
    
    if([username , email , fullName , password].some((field)=> field?.trim() ===  "" || field === undefined ) ){
        throw new ApiError(400 , "All fields are required")
    }

    let existedUser = await User.findOne({ $or : [{username},{email}]}) 
    
    if(existedUser){
        throw new ApiError(400 , "User with this email or username is already registered")
    }
    
    if(!Array.isArray(req.files.avatar)){
        // console.log("Array",Array.isArray(req.files.avatar));
        throw new ApiError(400 , "Avatar file is required") 
    }

    // console.log("files" , req.files.avatar)

    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;

    if(Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0]?.path
    }
    
    console.log(avatarLocalPath)
    let avatar = await uploadOnCloudinary(avatarLocalPath)
    let coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new ApiError(400 , "Avatar file is required") 
    }
    
    let createdUser = await User.create({
        username,
        email,
        fullName,
        password,
        avatar : avatar.secure_url,
        coverImage : coverImage?.secure_url
    })
    console.log("Craeted user" ,createdUser)
    
    let user = await User.findById(createdUser._id).select(
        "-password -refreshToken"
    )
    console.log(" user" ,user)
    
    if(!user){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    return res.status(202).json(
        new ApiResponse(202, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async (req,res)=>{
    const {username , email , password} = req.body

    if( !username && !email ){
        throw new ApiError(400 ,"Please enter your username or email")
    }
    if(!password){
        throw new ApiError(400 ,"Please enter your password")
    }
    
    const user = await User.findOne({
        $or : [
            {username},{email}
        ]
    })
    
    if(!user){
        throw new ApiError(400 ,"Provided username or email are not registered")
    }
    
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Incorrect Password")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("refreshToken" , refreshToken,options)
    .cookie("accessToken", accessToken,options)
    .json(
        new ApiResponse(200, loggedInUser , "User login successfull")
    )

})

const logoutUser = asyncHandler(async (req,res)=>{

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(req.user._id)

    const user = await User.findByIdAndUpdate(req.user._id,
        {$unset : { refreshToken : 1 }} , { new : true }
    ).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(
        new ApiResponse(200 , user , "Logout Successfull")
    )

})

const refreshTheAccessToken = asyncHandler(async (req,res)=>{

    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(400 , "unauthorized request")
    }
    
    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
        
        if(!decodedToken){
            throw new ApiError(400 , "unauthorized access")
        }
        
        const user = await User.findById(decodedToken._id)
        
        if(!user){
            throw new ApiError(400 , "Invalid refresh token")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(400 , "Refresh token is expired")
        }
    
        const {refreshToken , accessToken} = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        res.status(200)
        .cookie("refreshToken" , refreshToken , options)
        .cookie("accessToken" , accessToken , options)
        .json(
            new ApiResponse(200, {accessToken , refreshToken} , "Access token refreshed")
        )
    } catch (error) {
        console.log(error)
        res.status(400).json({
            message : "Invalid access token",
            success : false
        })
        // throw new ApiError(400, error.message)
    }
})

const changePassword = asyncHandler(async (req,res)=>{
    const {oldPassword , newPassword} = req.body

    if(!oldPassword || !newPassword){
        throw new ApiError(400, "All field are required")
    }
    
    const user = await User.findById(req.user._id)
    console.log("user" , user)
    if(!user){
        throw new ApiError(400,"unauthorized access")
    }
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if(!isPasswordCorrect){
        throw new ApiError(400,"Incorrect old password")
    }
    
    user.password = newPassword
    await user.save();
    
    return res.status(202)
    .json(
        new ApiResponse(202, null, "Password changed successfully")
    )
    
})

const getCurrentUser = asyncHandler((req,res)=>{
    return res.status(200)
    .json(
        new ApiResponse(200 , req.user , "User fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName , username } = req.body

    if(!fullName || !username){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        user._id,
        {
            $set : {
                fullName,username
            }
        },
        {
            new : true
        }
    ).select("-password -refreshToken")

    return res.status(202).json(
        new ApiResponse(202, user, "Account details updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async(req,res)=>{

    if(!req.file){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatarLocalPath = req.file?.path

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.secure_url){
        throw new ApiError(500, "Error in uploading avatar")
    }

    const user = await findByIdAndUpdate(
        user._id,
        {
            $set : {
                avatar : avatar.secure_url
            }
        },
        {
            new : true
        }
    ).select("-password -refreshToken")
    
    return res.status(202).json(
        new ApiResponse(202, user, "Avatar changed successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    if(!req.file){
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImageLocalPath = req.file?.path

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.secure_url){
        throw new ApiError(500, "Error in uploading cover image")
    }

    const user = await findByIdAndUpdate(
        user._id,
        {
            $set : {
                coverImage : coverImage.secure_url
            }
        },
        {
            new : true
        }
    ).select("-password -refreshToken")
    
    return res.status(202).json(
        new ApiResponse(202, user, "Cover image changed successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const username = req.params.username?.trim() 

    if(!username){
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username 
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                subscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {
                            $in : [
                                req.user?._id,
                                "$subscribers"
                            ]
                        },
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                email : 1,
                username : 1,
                fullName : 1,
                avatar : 1,
                coverImage : 1,
                subscribersCount : 1,
                subscribedToCount : 1,
                isSubscribed : 1
            }
        }
    ])

    console.log("channel profile ", channel)

    if(!channel.length){
        throw new ApiError(500, "Channel does not exist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , channel[0] , "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async (req,res)=>{
    if(!req.user){
        throw new ApiError(400, "Access Denied")
    }

    const watchHistory = await User.aggregate([
        {
            $match : {
                _id : new Schema.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        username : 1,
                                        fullName : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                                // $arrayElemAt : ["$owner", 0]
                            }
                        }
                    }
                ]
            }
        }
    ])

    if(!watchHistory.length){
        throw new ApiError(500,"No videos in your watch history")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, watchHistory[0], "Watch History fetched successfully")
    )
})


export {
    registerUser , 
    loginUser , 
    logoutUser , 
    refreshTheAccessToken, 
    changePassword, 
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
