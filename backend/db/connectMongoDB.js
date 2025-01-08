import mongoose from 'mongoose';

const connectMongooseDB = async ()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
    } catch (error) {
        console.error("Error connecting to MongoDB",error.message);
        process.exit(1);
    }
}
export default connectMongooseDB;