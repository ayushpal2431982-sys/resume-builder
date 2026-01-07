import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";
import fs from "fs";
import pdfParse from "pdf-parse";
import { pdfToPng } from 'pdf-to-png-converter';
import Tesseract from 'tesseract.js';

async function extractTextWithOCR(pdfPath) {
  console.log("👁️ Using Tesseract OCR for text extraction...");
  
  try {
    const pngPages = await pdfToPng(pdfPath, {
      viewportScale: 2.0,
    });
    
    if (pngPages.length === 0) {
      throw new Error("No pages found in PDF");
    }
    
    console.log(`  ✓ Converted ${pngPages.length} page(s) to images`);
    
    let allText = "";
    
    for (let i = 0; i < Math.min(pngPages.length, 2); i++) {
      console.log(`  📄 Processing page ${i + 1}...`);
      
      const imageBuffer = pngPages[i].content;
      
      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const progress = Math.round(m.progress * 100);
              if (progress % 25 === 0) {
                console.log(`    Progress: ${progress}%`);
              }
            }
          }
        }
      );
      
      allText += text + "\n\n";
      console.log(`  ✓ Page ${i + 1} completed (${text.length} characters)`);
    }
    
    console.log("✓ OCR extraction successful!");
    console.log(`  Total extracted: ${allText.length} characters`);
    console.log("  First 300 chars:", allText.substring(0, 300));
    
    return allText.trim();
    
  } catch (error) {
    console.error("❌ OCR Error:", error.message);
    throw error;
  }
}

export const uploadResume = async (req, res) => {
  console.log("\n========== UPLOAD RESUME ==========");
  
  try {
    const userId = req.userId;
    const { title } = req.body;

    console.log("User ID:", userId);
    console.log("Title:", title);
    console.log("File:", req.file ? req.file.originalname : "NO FILE");
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "Please select a PDF file" 
      });
    }
    
    if (!title || title.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Please enter a resume title" 
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ 
        success: false, 
        message: "Only PDF files are allowed" 
      });
    }

    console.log("📄 Step 1: Attempting normal PDF text extraction...");
    let extractedText = "";
    let pdfPageCount = 0;
    
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
      pdfPageCount = pdfData.numpages;
      
      console.log("✓ PDF text extraction completed");
      console.log("  Pages:", pdfPageCount);
      console.log("  Text length:", extractedText.length, "characters");
      
      if (extractedText.length > 100) {
        console.log("  First 200 chars:", extractedText.substring(0, 200));
      }
      
    } catch (parseError) {
      console.error("⚠️ Normal PDF parsing failed:", parseError.message);
    }

    if (!extractedText || extractedText.trim().length < 50) {
      console.log("\n⚠️ Not enough text extracted (only", extractedText.length, "chars)");
      console.log("📸 Step 2: Attempting OCR extraction...\n");
      
      try {
        extractedText = await extractTextWithOCR(req.file.path);
        
        if (!extractedText || extractedText.trim().length < 50) {
          throw new Error("OCR extracted less than 50 characters");
        }
        
        console.log("\n✓ OCR extraction successful!");
        
      } catch (ocrError) {
        console.error("\n❌ OCR also failed:", ocrError.message);
        
        const emptyResume = await Resume.create({
          userId: userId,
          title: title.trim(),
          uploadedFile: {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
          },
          professional_summary: "⚠️ Could not extract text from this PDF. Please fill in your details manually below.",
          personal_info: {
            full_name: "",
            email: "",
            phone: "",
            location: "",
            profession: "",
            linkedin: "",
            website: "",
          },
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
          message: "Resume uploaded but text extraction failed. Please fill in details manually.",
          warning: "Both PDF parsing and OCR failed."
        });
      }
    }

    console.log("\n🤖 Step 3: Parsing extracted text with AI...");
    
    let parsedData = {
      professional_summary: "",
      personal_info: {
        full_name: "",
        email: "",
        phone: "",
        location: "",
        profession: "",
        linkedin: "",
        website: "",
      },
      experience: [],
      education: [],
      project: [],
      skills: [],
    };

    try {
      const aiResponse = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
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
          {
            role: "user",
            content: `Parse this resume text and extract all information in JSON format:\n\n${extractedText}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
      });

      let aiText = aiResponse.choices[0].message.content.trim();
      console.log("✓ AI response received");
      console.log("  Response length:", aiText.length);
      
      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiText = jsonMatch[0];
      }
      
      console.log("  Cleaned response (first 300 chars):", aiText.substring(0, 300));
      
      const aiParsedData = JSON.parse(aiText);
      console.log("✓ JSON parsed successfully");
      
      console.log("\n📊 Extracted Data Summary:");
      console.log("  ├─ Name:", aiParsedData.personal_info?.full_name || "❌ Not found");
      console.log("  ├─ Email:", aiParsedData.personal_info?.email || "❌ Not found");
      console.log("  ├─ Phone:", aiParsedData.personal_info?.phone || "❌ Not found");
      console.log("  ├─ Location:", aiParsedData.personal_info?.location || "❌ Not found");
      console.log("  ├─ Profession:", aiParsedData.personal_info?.profession || "❌ Not found");
      console.log("  ├─ Experience:", aiParsedData.experience?.length || 0, "entries");
      console.log("  ├─ Education:", aiParsedData.education?.length || 0, "entries");
      console.log("  ├─ Projects:", aiParsedData.project?.length || 0, "entries");
      console.log("  └─ Skills:", aiParsedData.skills?.length || 0, "skills");
      
      parsedData = {
        professional_summary: aiParsedData.professional_summary || "Experienced professional with diverse background",
        personal_info: {
          full_name: aiParsedData.personal_info?.full_name || "",
          email: aiParsedData.personal_info?.email || "",
          phone: aiParsedData.personal_info?.phone || "",
          location: aiParsedData.personal_info?.location || "",
          profession: aiParsedData.personal_info?.profession || "",
          linkedin: aiParsedData.personal_info?.linkedin || "",
          website: aiParsedData.personal_info?.website || "",
        },
        experience: Array.isArray(aiParsedData.experience) ? aiParsedData.experience : [],
        education: Array.isArray(aiParsedData.education) ? aiParsedData.education : [],
        project: Array.isArray(aiParsedData.project) ? aiParsedData.project : [],
        skills: Array.isArray(aiParsedData.skills) ? aiParsedData.skills : [],
      };
      
    } catch (aiError) {
      console.error("\n❌ AI parsing error:", aiError.message);
      console.error("   Will save with extracted text but empty parsed data");
    }

    console.log("\n💾 Step 4: Saving to database...");
    
    const newResume = await Resume.create({
      userId: userId,
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
    
    console.log("\n✅ SUCCESS! Resume saved to database!");
    console.log("   Resume ID:", newResume._id);
    console.log("   Title:", newResume.title);
    console.log("   Saved name:", newResume.personal_info?.full_name || "Empty");
    console.log("   Saved email:", newResume.personal_info?.email || "Empty");
    console.log("=====================================\n");

    return res.status(200).json({
      success: true,
      resumeId: newResume._id,
      message: `"${newResume.title}" uploaded and parsed successfully!`,
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
          skills: parsedData.skills?.length || 0,
        }
      }
    });

  } catch (error) {
    console.error("\n❌❌❌ UPLOAD ERROR ❌❌❌");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    console.error("=====================================\n");
    
    return res.status(500).json({ 
      success: false,
      message: "Upload failed: " + error.message
    });
  }
};

export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent || userContent.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide content to enhance"
      });
    }

    const aiResponse = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional resume writer. Enhance the given professional summary to make it more compelling, professional, and impactful. Keep it concise (2-4 sentences, max 100 words). Use strong action words and industry-relevant terminology. Highlight key strengths, skills, and achievements. Make it ATS-friendly. Maintain a professional tone. Focus on value proposition and unique qualities. Return ONLY the enhanced summary text, no explanations.`
        },
        {
          role: "user",
          content: userContent
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const enhancedContent = aiResponse.choices[0].message.content.trim();

    return res.status(200).json({
      success: true,
      enhancedContent: enhancedContent,
      message: "Summary enhanced successfully!"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Enhancement failed: " + error.message
    });
  }
};

export const enhanceExperience = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent || userContent.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide content to enhance"
      });
    }

    const aiResponse = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional resume writer. Your task is to enhance job experience descriptions to make them more professional, impactful, and ATS-friendly.

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
10. Return ONLY the enhanced description text with bullet points, no explanations

EXAMPLE INPUT:
"Developed web applications using React and Node.js"

EXAMPLE OUTPUT:
- Architected and developed 15+ scalable web applications using React.js, Node.js, and MongoDB, serving over 100,000+ active users
- Implemented RESTful APIs and microservices architecture, improving system performance by 40% and reducing server response time by 250ms
- Led frontend development using React.js with Redux for state management, creating reusable component libraries that reduced development time by 30%
- Collaborated with cross-functional teams of 8+ members using Agile methodologies, ensuring timely delivery of sprint goals with 95% completion rate
- Integrated third-party APIs including payment gateways (Stripe, PayPal), authentication services (OAuth, JWT), and cloud storage solutions (AWS S3)
- Optimized application performance through code splitting, lazy loading, and caching strategies, achieving 90+ Lighthouse scores
- Conducted code reviews and mentored 3 junior developers, improving code quality and adherence to best practices
- Implemented comprehensive testing strategies using Jest and React Testing Library, maintaining 85%+ code coverage`
        },
        {
          role: "user",
          content: userContent
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const enhancedContent = aiResponse.choices[0].message.content.trim();

    return res.status(200).json({
      success: true,
      enhancedContent: enhancedContent,
      message: "Experience enhanced successfully!"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Enhancement failed: " + error.message
    });
  }
};