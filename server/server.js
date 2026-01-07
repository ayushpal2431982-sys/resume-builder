import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import aiRouter from "./routes/aiRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
await connectDB()

app.use(express.json())
app.use(cors())

app.get("/", (req, res)=> res.send("server is live..."))
app.use('/api/users', userRouter)
app.use('/api/resumes', resumeRouter)
app.use('/api/ai', aiRouter)

// Add this before app.listen
app.get('/api/test-upload', (req, res) => {
  console.log("Test route hit");
  res.json({ 
    status: "Server is working",
    uploadsFolder: "Check if uploads/ exists",
    mongodb: "Check connection" 
  });
});

app.listen(PORT, ()=> {
    console.log(`Server is running on port${PORT}`);
});