import { User } from "../models/user.models.js";
import { asyncHandler } from './../utils/asyncHandler.js'
import { ApiError } from "./../utils/ApiError.js"
import { ApiResponse } from "./../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    // console.log("i came here" , avatar)
    
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

export {registerUser}