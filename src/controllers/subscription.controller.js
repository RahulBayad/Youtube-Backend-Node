import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const channelSubscribe = asyncHandler(async (req,res)=>{

    const {_id} = req.user
    if(!_id){
        throw new ApiError(400, "Unauthorized access")
    }
    const channelName = req.params.username
    
    const channel = await User.findOne({username : channelName}).select("-password -refreshToken -watchHistory")

    if(!channel){
        throw new ApiError(400, "Wrong Username")
    }

    const subscribe = await Subscription.create({
        subscriber : _id,
        channel : channel._id
    })

    return res.status(202)
    .json(new ApiResponse(202, subscribe, "Channel Subscribed"))
})

export {channelSubscribe}