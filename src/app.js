import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended : true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

import userRouter from './routes/user.routes.js'

app.use("/api/v1/users",userRouter)


app.use((err, req, res, next)=>{
    console.log(err)
    return res.status(err.statusCode || 500).json({
        message : err.errorStack ? err.message : "Server Error",
        success : false
    })
})

export {app}