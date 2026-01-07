import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Resume from "../models/Resume.js";

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// REGISTER
export const registerUser = async (req, res) => {
  console.log("\n========== REGISTER ATTEMPT ==========");
  console.log("Request body:", req.body);
  
  try {
    const { name, email, password } = req.body;
    console.log("Extracted fields:", { name, email, password: password ? "***" : "missing" });

    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("✓ All fields present");
    console.log("Checking if user exists...");
    
    const userExists = await User.findOne({ email });
    console.log("User exists check:", userExists ? "YES" : "NO");
    
    if (userExists) {
      console.log("❌ User already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✓ Password hashed");

    console.log("Creating new user in database...");
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });
    console.log("✓ User created with ID:", newUser._id);

    console.log("Generating token...");
    const token = generateToken(newUser._id);
    console.log("✓ Token generated");
    
    newUser.password = undefined;

    console.log("✅ REGISTRATION SUCCESSFUL");
    console.log("=====================================\n");

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("\n❌❌❌ REGISTRATION ERROR ❌❌❌");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=====================================\n");
    
    return res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  console.log("\n========== LOGIN ATTEMPT ==========");
  console.log("Request body:", req.body);
  
  try {
    const { email, password } = req.body;
    console.log("Email:", email);

    console.log("Finding user...");
    const user = await User.findOne({ email });
    console.log("User found:", user ? "YES" : "NO");
    
    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("Comparing password...");
    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch ? "YES" : "NO");
    
    if (!isMatch) {
      console.log("❌ Invalid password");
      return res.status(400).json({ message: "Invalid email or password" });
    }

    console.log("Generating token...");
    const token = generateToken(user._id);
    user.password = undefined;

    console.log("✅ LOGIN SUCCESSFUL");
    console.log("=====================================\n");

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("\n❌❌❌ LOGIN ERROR ❌❌❌");
    console.error("Error:", error.message);
    console.error("=====================================\n");
    
    return res.status(500).json({ message: error.message });
  }
};

// GET USER
export const getUserById = async (req, res) => {
  console.log("\n========== GET USER DATA ==========");
  console.log("User ID from middleware:", req.userId);
  
  try {
    const userId = req.userId;

    if (!userId) {
      console.log("❌ No userId in request");
      return res.status(401).json({ message: "Not authorized" });
    }

    console.log("Finding user by ID...");
    const user = await User.findById(userId);
    console.log("User found:", user ? "YES" : "NO");
    
    if (!user) {
      console.log("❌ User not found in database");
      return res.status(404).json({ message: "User not found" });
    }

    user.password = undefined;
    
    console.log("✅ User data retrieved");
    console.log("=====================================\n");
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error("\n❌❌❌ GET USER ERROR ❌❌❌");
    console.error("Error:", error.message);
    console.error("=====================================\n");
    
    return res.status(500).json({ message: error.message });
  }
};

// GET USER RESUMES
export const getUserResumes = async (req, res) => {
  console.log("\n========== GET USER RESUMES ==========");
  console.log("User ID:", req.userId);
  
  try {
    const userId = req.userId;
    
    console.log("Finding resumes...");
    const resumes = await Resume.find({ userId });
    console.log("Resumes found:", resumes.length);
    
    console.log("✅ Resumes retrieved");
    console.log("=====================================\n");
    
    return res.status(200).json({ resumes });
  } catch (error) {
    console.error("\n❌❌❌ GET RESUMES ERROR ❌❌❌");
    console.error("Error:", error.message);
    console.error("=====================================\n");
    
    return res.status(500).json({ message: error.message });
  }
};