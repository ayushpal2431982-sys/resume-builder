import express from "express";
import { uploadResume, enhanceProfessionalSummary, enhanceExperience } from "../controllers/aiController.js";
import upload from "../configs/multer.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/upload-resume", protect, upload.single("resume"), uploadResume);
router.post("/enhance-pro-sum", protect, enhanceProfessionalSummary);
router.post("/enhance-experience", protect, enhanceExperience);

export default router;