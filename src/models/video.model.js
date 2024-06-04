import mongoose, {Schema} from "mongoose";

const videoSchema = new Schema(
    {
        videoFile : {
            type : String,
            required : true
        },
        title : {
            type : String,
            required : true
        },
        thumbnail : {
            type : String,
        },
        description : {
            type : String,
            required : true
        },
        duration : {
            type : Number,
            required : true
        },
        views : {
            type : Number,
            required : true
        },
        isPublished : {
            type : Boolean,
            default : true
        },
        owner : {
            type : Schema.Types.ObjectId,
            ref : "User"
        }   
    },
    {
        timestamps : true
    }
)

export const Video = mongoose.model("Video",videoSchema)
