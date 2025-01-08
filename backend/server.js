import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js'
import connectMongooseDB from './db/connectMongoDB.js';

const app=express();
dotenv.config();

app.use("/api/auth",authRoutes);
const port = process.env.PORT|| 5000;
app.listen(port,()=>{
    console.log("server is at ",port);
    connectMongooseDB();
});