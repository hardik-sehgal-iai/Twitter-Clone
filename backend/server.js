import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js'
import connectMongooseDB from './db/connectMongoDB.js';
import cookieParser from 'cookie-parser';
import cors from "cors";

const app=express();
dotenv.config();

app.use(cookieParser());//it helps to get cookie from the browser
app.use(express.json());
app.use(express.urlencoded());//for url encoded to parse form data
app.use("/api/auth",authRoutes);
const port = process.env.PORT|| 5000;
app.use(cors({
    origin: `http://localhost:${port}`, // Replace with your frontend's URL
    credentials: true, // Allow credentials (cookies)
  }));
app.listen(port,()=>{
    console.log("server is at ",port);
    connectMongooseDB();
});