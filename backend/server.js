import express from 'express';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import postRoutes from './routes/post.routes.js'
import connectMongooseDB from './db/connectMongoDB.js';
import cookieParser from 'cookie-parser';
import cors from "cors";
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const app=express();

app.use(cookieParser());//it helps to get cookie from the browser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));//for url encoded to parse form data
app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/posts",postRoutes);
const port = process.env.PORT|| 5000;
app.use(cors({
    origin: `http://localhost:${port}`,
    credentials: true, // Allow credentials (cookies)
  }));
app.listen(port,()=>{
    console.log("server is at ",port);
    connectMongooseDB();
});