import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:");
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Get admin credentials from command line or use defaults
    const args = process.argv.slice(2);
    const email = args[0] || "admin@kickit.com";
    const username = args[1] || "admin";
    const password = args[2] || "admin123";
    const firstName = args[3] || "Admin";
    const lastName = args[4] || "User";

    // Create admin user
    const admin = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: "admin",
      isActive: true,
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  Please change the password after first login!");
    console.log("\nYou can now login at: http://localhost:5173/login\n");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error.message);
    process.exit(1);
  }
};

createAdmin();
