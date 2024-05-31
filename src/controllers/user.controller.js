import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";
import { asyncHandler } from './../utils/asyncHandler.js'
import { ApiError } from "./../utils/ApiError.js"
import { ApiResponse } from "./../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

export {registerUser , loginUser , logoutUser , refreshTheAccessToken}