import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";
import fs from "fs";
import pdfParse from "pdf-parse";
import { pdfToPng } from 'pdf-to-png-converter';
import Tesseract from 'tesseract.js';

// ✅ GROQ-OPTIMIZED: Minimal delay (Groq is very fast and has good limits)
let lastAPICall = 0;
const MIN_DELAY_BETWEEN_CALLS = 2000; // 2 seconds (safe for 30/min limit)

// ✅ GROQ-OPTIMIZED: Fast retry with short delays
async function callAIWithRetry(messages, maxRetries = 3, initialDelay = 3000) {
  const now = Date.now();
  const timeSinceLastCall = now - lastAPICall;
  if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
    const waitTime = MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastAPICall = Date.now();
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  📡 API Call - Attempt ${attempt}/${maxRetries}...`);
      
      const aiResponse = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.2,
        max_tokens: 2000,
      });
      
      console.log(`  ✅ Success!`);
      return aiResponse;
      
    } catch (error) {
      lastError = error;
      
      const is429 = error.status === 429 || 
                    error.message?.includes('429') || 
                    error.message?.includes('rate limit');
      
      if (is429 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1); // 3s, 6s, 12s
        console.log(`  ⚠️ Rate limit. Waiting ${(delay/1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (attempt >= maxRetries) {
        console.log(`  ❌ All retries exhausted`);
        throw lastError;
      } else {
        console.log(`  ❌ Error: ${error.message}`);
        throw error;
      }
    }
  }
  
  throw lastError;
}

async function extractTextWithOCR(pdfPath) {
  console.log("👁️ OCR extraction...");
  
  try {
    const pngPages = await pdfToPng(pdfPath, { viewportScale: 2.0 });
    if (pngPages.length === 0) throw new Error("No pages");
    
    let allText = "";
    for (let i = 0; i < Math.min(pngPages.length, 2); i++) {
      const { data: { text } } = await Tesseract.recognize(pngPages[i].content, 'eng');
      allText += text + "\n\n";
    }
    
    return allText.trim();
  } catch (error) {
    throw error;
  }
}

export const uploadResume = async (req, res) => {
  console.log("\n========== UPLOAD RESUME ==========");
  
  try {
    const userId = req.userId;
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Select a PDF file" });
    }
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ success: false, message: "Enter a title" });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: "PDF only" });
    }

    console.log("📄 Extracting text...");
    let extractedText = "";
    let pdfPageCount = 0;
    
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
      pdfPageCount = pdfData.numpages;
      console.log(`✓ ${extractedText.length} chars from ${pdfPageCount} pages`);
    } catch (parseError) {
      console.error("⚠️ PDF parse failed");
    }

    if (!extractedText || extractedText.trim().length < 50) {
      console.log("📸 Trying OCR...");
      try {
        extractedText = await extractTextWithOCR(req.file.path);
        if (!extractedText || extractedText.trim().length < 50) {
          throw new Error("Insufficient text");
        }
      } catch (ocrError) {
        const emptyResume = await Resume.create({
          userId,
          title: title.trim(),
          uploadedFile: {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
          },
          professional_summary: "⚠️ Text extraction failed. Fill manually.",
          personal_info: { full_name: "", email: "", phone: "", location: "", profession: "", linkedin: "", website: "" },
          experience: [],
          education: [],
          project: [],
          skills: [],
          template: "classic",
          accent_color: "#3B82F6",
          public: false
        });
        
        return res.status(200).json({
          success: true,
          resumeId: emptyResume._id,
          message: "Uploaded. Fill details manually.",
          warning: true
        });
      }
    }

    console.log("🤖 AI parsing with Groq...");
    
    let parsedData = {
      professional_summary: "",
      personal_info: { full_name: "", email: "", phone: "", location: "", profession: "", linkedin: "", website: "" },
      experience: [],
      education: [],
      project: [],
      skills: []
    };

    try {
      const aiResponse = await callAIWithRetry([
        {
          role: "system",
          content: `You are a professional resume parser. Extract structured data from resume text and return ONLY valid JSON.

CRITICAL RULES:
1. Your response must be ONLY a JSON object
2. No markdown code blocks (no \`\`\`json)
3. No explanations before or after the JSON
4. Extract ALL information you can find

Return this EXACT structure:
{
  "professional_summary": "2-3 sentence professional summary based on the resume content",
  "personal_info": {
    "full_name": "full name from resume",
    "email": "email address",
    "phone": "phone number with country code if available",
    "location": "city, state/country",
    "profession": "current job title or desired role",
    "linkedin": "linkedin URL if found",
    "website": "personal website URL if found"
  },
  "experience": [
    {
      "company": "company name",
      "position": "job title",
      "start_date": "MM/YYYY format",
      "end_date": "MM/YYYY or Present",
      "description": "key responsibilities and achievements",
      "is_current": true/false
    }
  ],
  "education": [
    {
      "institution": "school/university name",
      "degree": "degree type (e.g., Bachelor of Science)",
      "field": "field of study (e.g., Computer Science)",
      "graduation_date": "MM/YYYY",
      "gpa": "GPA if mentioned (e.g., 3.8/4.0)"
    }
  ],
  "project": [
    {
      "name": "project name",
      "type": "personal/professional/academic",
      "description": "brief project description"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"]
}

IMPORTANT:
- If a field is not found, use empty string ("") or empty array ([])
- For dates, convert to MM/YYYY format if possible
- Extract phone numbers in international format if possible
- List skills as individual items in array
- Return ONLY the JSON object, nothing else`
        },
        { role: "user", content: `Parse this resume text and extract all information in JSON format:\n\n${extractedText}` }
      ]);

      let aiText = aiResponse.choices[0].message.content.trim();
      console.log("✓ AI response received");
      
      // Clean up response
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) aiText = jsonMatch[0];
      
      const aiParsedData = JSON.parse(aiText);
      console.log("✓ JSON parsed successfully");
      
      console.log("\n📊 Extracted Data:");
      console.log("  Name:", aiParsedData.personal_info?.full_name || "❌");
      console.log("  Email:", aiParsedData.personal_info?.email || "❌");
      console.log("  Phone:", aiParsedData.personal_info?.phone || "❌");
      console.log("  Experience:", aiParsedData.experience?.length || 0, "entries");
      console.log("  Education:", aiParsedData.education?.length || 0, "entries");
      console.log("  Skills:", aiParsedData.skills?.length || 0, "skills");
      
      parsedData = {
        professional_summary: aiParsedData.professional_summary || "Experienced professional",
        personal_info: {
          full_name: aiParsedData.personal_info?.full_name || "",
          email: aiParsedData.personal_info?.email || "",
          phone: aiParsedData.personal_info?.phone || "",
          location: aiParsedData.personal_info?.location || "",
          profession: aiParsedData.personal_info?.profession || "",
          linkedin: aiParsedData.personal_info?.linkedin || "",
          website: aiParsedData.personal_info?.website || ""
        },
        experience: Array.isArray(aiParsedData.experience) ? aiParsedData.experience : [],
        education: Array.isArray(aiParsedData.education) ? aiParsedData.education : [],
        project: Array.isArray(aiParsedData.project) ? aiParsedData.project : [],
        skills: Array.isArray(aiParsedData.skills) ? aiParsedData.skills : []
      };
      
    } catch (aiError) {
      console.error("❌ AI parsing error:", aiError.message);
      console.error("   Will save with empty parsed data");
    }

    console.log("💾 Saving to database...");
    
    const newResume = await Resume.create({
      userId,
      title: title.trim(),
      uploadedFile: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      professional_summary: parsedData.professional_summary,
      personal_info: parsedData.personal_info,
      experience: parsedData.experience,
      education: parsedData.education,
      project: parsedData.project,
      skills: parsedData.skills,
      template: "classic",
      accent_color: "#3B82F6",
      public: false
    });
    
    console.log("✅ SUCCESS! Resume saved!");
    console.log("   ID:", newResume._id);
    console.log("   Title:", newResume.title);
    console.log("=====================================\n");

    return res.status(200).json({
      success: true,
      resumeId: newResume._id,
      message: `"${newResume.title}" uploaded successfully!`,
      stats: {
        textExtracted: extractedText.length,
        pages: pdfPageCount || 1,
        extractionMethod: extractedText.length < 50 ? "OCR" : "PDF Parser",
        fieldsFound: {
          name: !!parsedData.personal_info?.full_name,
          email: !!parsedData.personal_info?.email,
          phone: !!parsedData.personal_info?.phone,
          experience: parsedData.experience?.length || 0,
          education: parsedData.education?.length || 0,
          skills: parsedData.skills?.length || 0
        }
      }
    });

  } catch (error) {
    console.error("❌ UPLOAD ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Upload failed: " + error.message });
  }
};

export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent || userContent.trim() === "") {
      return res.status(400).json({ success: false, message: "Provide content to enhance" });
    }

    const aiResponse = await callAIWithRetry([
      {
        role: "system",
        content: `You are a professional resume writer. Enhance the given professional summary to make it more compelling, professional, and impactful. Keep it concise (2-4 sentences, max 100 words). Use strong action words and industry-relevant terminology. Highlight key strengths, skills, and achievements. Make it ATS-friendly. Maintain a professional tone. Focus on value proposition and unique qualities. Return ONLY the enhanced summary text, no explanations.`
      },
      { role: "user", content: userContent }
    ]);

    return res.status(200).json({
      success: true,
      enhancedContent: aiResponse.choices[0].message.content.trim(),
      message: "Summary enhanced successfully!"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Enhancement failed: " + error.message });
  }
};

export const enhanceExperience = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent || userContent.trim() === "") {
      return res.status(400).json({ success: false, message: "Provide content to enhance" });
    }

    const aiResponse = await callAIWithRetry([
      {
        role: "system",
        content: `You are a professional resume writer. Enhance job experience descriptions to make them more professional, impactful, and ATS-friendly.

INSTRUCTIONS:
1. Expand the content with more details and professional language
2. Use bullet points (•) to organize achievements and responsibilities
3. Start each bullet with strong action verbs (Developed, Led, Implemented, Architected, Spearheaded, etc.)
4. Quantify achievements with numbers, percentages, or metrics when possible
5. Include technical skills and technologies used
6. Highlight impact on business outcomes (efficiency, revenue, user satisfaction, etc.)
7. Aim for 6-10 detailed bullet points
8. Make it comprehensive and detailed, not short or minimal
9. Keep professional tone throughout
10. Return ONLY the enhanced description text with bullet points, no explanations`
      },
      { role: "user", content: userContent }
    ]);

    return res.status(200).json({
      success: true,
      enhancedContent: aiResponse.choices[0].message.content.trim(),
      message: "Experience enhanced successfully!"
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Enhancement failed: " + error.message });
  }
};