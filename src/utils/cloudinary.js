import { v2 as cloudinary } from "cloudinary"
import fs from "fs";



const uploadOnCloudinary = async (localFilePath) => {
    try{
        
        if(!localFilePath) return null;

        cloudinary.config({
            cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
            api_key : process.env.CLOUDINARY_API_KEY,
            api_secret : process.env.CLOUDINARY_API_SECRET
        })
        
        const response = await cloudinary.uploader.upload(localFilePath ,{resource_type:"auto"})

        console.log("this is 3",localFilePath)

        console.log("File is uploaded on cloudinary", response.secure_url)
        fs.unlinkSync(localFilePath)
        return response
    }catch(error){
        console.log(error)
        fs.unlinkSync(localFilePath)
    }
}

export {uploadOnCloudinary}