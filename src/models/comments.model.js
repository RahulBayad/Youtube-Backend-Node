import mongoose, { Schema } from 'mongoose'

const commentsSchema = new Schema(
    {
        content : {
            type : String,
            required : true
        },
        commentBy : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : true
        },
        video : {
            type : Schema.Types.ObjectId,
            ref : "Video"
        },
        tweet : {
            type : Schema.Types.ObjectId,
            ref : "Tweet"
        },
    },
    {
        timestamps : true
    }
)

export const Like = mongoose.model("Comment" , commentsSchema)
