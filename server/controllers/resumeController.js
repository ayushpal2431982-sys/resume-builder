import imagekit from "../configs/imageKit.js";
import Resume from "../models/Resume.js";
import fs from 'fs';

// controller for creating a new resume
// POST: /api/resumes/create
export const createResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;

    // create new resume
    const newResume = await Resume.create({ userId, title });
    // return success message
    return res
      .status(201)
      .json({ message: "Resume created successfully", resume: newResume });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// controller for deleting resume
// DELETE: /api/resume/delete
export const deleteResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    await Resume.findOneAndDelete({ userId, _id: resumeId });

    // return sucess message
    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// get user resume by id
// GET: /api/resume/get
export const getResumeById = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const resume = await Resume.findOne({ userId, _id: resumeId });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    resume.__v = undefined;
    resume.createdAt = undefined;
    resume.updatedAt = undefined;

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// get resume by id public
// GET: /api/resume/public
export const getPublicResumeById = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const resume = await Resume.findOne({ public: true, _id: resumeId });

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// controller for updating a resume
// PUT: /api/resume/update
export const updateResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId, resumeData, removeBackground } = req.body;
    const image = req.file;

    console.log("\n========== UPDATE RESUME ==========");
    console.log("Resume ID:", resumeId);
    console.log("Has image file:", !!image);
    console.log("Remove background:", removeBackground);

    // Parse resumeData safely
    let resumeDataCopy;
    try {
      resumeDataCopy = typeof resumeData === 'string' 
        ? JSON.parse(resumeData) 
        : resumeData;
    } catch (parseError) {
      console.error("❌ Failed to parse resumeData:", parseError.message);
      return res.status(400).json({ 
        message: "Invalid resume data format" 
      });
    }

    // ✅ FIX: Ensure personal_info.image is always a string
    if (resumeDataCopy.personal_info) {
      // If image is an object, null, or undefined, convert to empty string
      if (typeof resumeDataCopy.personal_info.image !== 'string') {
        console.log("⚠️ Converting non-string image value to empty string");
        resumeDataCopy.personal_info.image = "";
      }
    }

    // If there's an image file, upload it to ImageKit
    if (image) {
      console.log("📸 Processing image upload...");
      console.log("   File:", image.originalname);
      console.log("   Size:", image.size, "bytes");

      try {
        // Read the file
        const imageBufferData = fs.readFileSync(image.path);
        console.log("   ✓ File read successfully");

        // Upload to ImageKit
        console.log("   Uploading to ImageKit...");
        const response = await imagekit.upload({
          file: imageBufferData,
          fileName: `resume-${Date.now()}.png`,
          folder: '/user-resumes',
          transformation: {
            pre: 'w-300,h-300,fo-face,z-0.75' +
             (removeBackground === 'true' || removeBackground === true ? ',e-bgremove' : '')
          }
        });

        console.log("   ✓ Image uploaded successfully!");
        console.log("   URL:", response.url);

        // Update image URL in personal_info
        if (!resumeDataCopy.personal_info) {
          resumeDataCopy.personal_info = {};
        }
        resumeDataCopy.personal_info.image = response.url;

        // Clean up temp file
        try {
          fs.unlinkSync(image.path);
          console.log("   ✓ Temp file deleted");
        } catch (unlinkError) {
          console.warn("   ⚠️ Could not delete temp file");
        }

      } catch (imageError) {
        console.error("❌ Image upload failed:", imageError.message);
        console.error("   Full error:", imageError);
        
        // Continue without image - don't fail the entire request
        console.log("   Continuing without image...");
      }
    }

    // Update the resume in database
    console.log("💾 Updating database...");
    
    const resume = await Resume.findOneAndUpdate(
      { userId, _id: resumeId },
      resumeDataCopy,
      { new: true }
    );

    if (!resume) {
      console.error("❌ Resume not found");
      return res.status(404).json({ 
        message: "Resume not found" 
      });
    }

    console.log("✅ Resume updated successfully!");
    console.log("   Title:", resume.title);
    console.log("   Has image:", !!resume.personal_info?.image);
    console.log("=====================================\n");

    return res.status(200).json({ 
      message: "Saved Successfully", 
      resume 
    });

  } catch (error) {
    console.error("\n❌ UPDATE ERROR:", error.message);
    console.error("Stack:", error.stack);
    console.error("=====================================\n");
    
    return res.status(400).json({ 
      message: "Update failed: " + error.message 
    });
  }
};