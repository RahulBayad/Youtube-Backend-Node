import dotenv from "dotenv"
import dbConnect from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path : "./.env"
})

dbConnect()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Served connected at PORT ${process.env.PORT || 8000}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed", error)
})