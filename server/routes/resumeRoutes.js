import express from "express";
import protect from "../middlewares/authMiddleware.js";
import { 
  createResume, 
  deleteResume, 
  getPublicResumeById, 
  getResumeById, 
  updateResume 
} from "../controllers/resumeController.js";
import upload from "../configs/multer.js";

const resumeRouter = express.Router();

// Create resume
resumeRouter.post('/create', protect, createResume);

// Update resume - ✅ FIXED: protect before upload
resumeRouter.put('/update', protect, upload.single('image'), updateResume);

// Delete resume
resumeRouter.delete('/delete/:resumeId', protect, deleteResume);

// Get user's resume
resumeRouter.get('/get/:resumeId', protect, getResumeById);

// Get public resume
resumeRouter.get('/public/:resumeId', getPublicResumeById);

export default resumeRouter;