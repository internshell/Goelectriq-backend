import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      console.error("❌ MONGODB_URI is not defined in .env file");
      process.exit(1);
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;