/* eslint-env node */

import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in environment variables");
      console.error("Please check your .env file in the root directory");
      process.exit(1);
    }

    console.log("🔄 Attempting to connect to MongoDB...");
    console.log(
      `📍 Connection string: ${process.env.MONGODB_URI.replace(
        /\/\/[^:]+:[^@]+@/,
        "//***:***@"
      )}`
    ); // Hide credentials

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("\n❌ MongoDB Connection Error:");
    console.error(`   ${error.message}\n`);

    if (error.message.includes("ECONNREFUSED")) {
      console.error("💡 Troubleshooting steps:");
      console.error("   1. Make sure MongoDB is installed on your system");
      console.error("   2. Start MongoDB service:");
      console.error("      Windows: net start MongoDB");
      console.error('      Or run: mongod --dbpath "C:\\data\\db"');
      console.error(
        "   3. If using MongoDB Atlas, check your connection string"
      );
      console.error("   4. Verify MONGODB_URI in your .env file\n");
    }

    process.exit(1);
  }
};

export default connectDB;
