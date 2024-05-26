import dotenv from 'dotenv'
import express from 'express'
import dbConnect from './src/db/index.js';
dotenv.config({
    path : './.env'
})

const app = express(); 

dbConnect()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Served connected at PORT ${process.env.PORT || 8000}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connection failed", error)
})