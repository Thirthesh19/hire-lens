import express from "express";
import multer from "multer";
import cors from "cors";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import natural from "natural";
import stringSimilarity from "string-similarity";

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

// Global error handlers to prevent Tesseract worker crashes from killing the server
process.on('uncaughtException', (err) => {
  console.error("Uncaught Exception (Possible Tesseract Worker Crash):", err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const domainKeywords = {
  "IT/Software": ["software", "engineer", "developer", "react", "node", "javascript", "python", "java", "sql", "aws", "docker", "frontend", "backend", "fullstack", "programming", "database", "devops", "cloud", "api", "architecture", "server", "code", "agile", "scrum", "git", "ci/cd"],
  "Healthcare": ["nurse", "doctor", "medical", "patient", "clinical", "hospital", "healthcare", "health", "medicine", "caregiver", "surgery", "therapy", "rn", "md", "physician", "clinic", "diagnostic"],
  "Education": ["teacher", "educator", "school", "student", "curriculum", "teaching", "university", "professor", "tutor", "instructor", "academic", "classroom", "lesson", "faculty", "syllabus"],
  "Finance": ["finance", "accounting", "bank", "financial", "analyst", "investment", "audit", "tax", "wealth", "budget", "ledger", "equity", "cpa", "portfolio", "banking", "capital"],
  "Sales": ["sales", "account executive", "b2b", "b2c", "revenue", "lead generation", "cold calling", "outbound", "inbound", "quota", "deal", "pitch", "prospecting", "pipeline", "territory"],
  "Marketing": ["marketing", "seo", "social media", "campaign", "content", "advertising", "brand", "digital marketing", "growth", "copywriting", "sem", "conversion", "analytics", "pr"],
  "Hospitality": ["hotel", "restaurant", "hospitality", "guest", "front desk", "food", "beverage", "catering", "event", "concierge", "culinary", "chef", "housekeeping", "banquet"],
  "Child Care": ["babysitter", "nanny", "child", "children", "daycare", "infant", "toddler", "caregiver", "pediatric", "childcare", "preschool", "babysitting", "nannying", "tending"],
  "Transportation": ["driver", "transportation", "logistics", "delivery", "truck", "freight", "fleet", "transit", "chauffeur", "route", "dispatch", "cdl", "warehouse", "driving"],
  "Others": [] // fallback
};

const degreeKeywords = {
  "MCA": ["MCA", "Master of Computer Application", "Master of Computer Applications"],
  "BCA": ["BCA", "Bachelor of Computer Application", "Bachelor of Computer Applications"],
  "B.Sc": ["B.Sc", "Bachelor of Science"],
  "M.Sc": ["M.Sc", "Master of Science"],
  "B.E": ["B.E", "Bachelor of Engineering"],
  "M.E": ["M.E", "Master of Engineering"],
  "B.Tech": ["B.Tech", "Bachelor of Technology"],
  "M.Tech": ["M.Tech", "Master of Technology"],
  "MBA": ["MBA", "Master of Business Administration"],
  "BBA": ["BBA", "Bachelor of Business Administration"],
  "B.Com": ["B.Com", "Bachelor of Commerce"],
  "M.Com": ["M.Com", "Master of Commerce"],
  "BA": ["BA", "Bachelor of Arts"],
  "MA": ["MA", "Master of Arts"],
  "LLB": ["LLB", "Bachelor of Law", "Bachelor of Laws"],
  "LLM": ["LLM", "Master of Law", "Master of Laws"],
  "MBBS": ["MBBS", "Bachelor of Medicine", "Bachelor of Surgery"],
  "MD": ["MD", "Doctor of Medicine"],
  "BDS": ["BDS", "Bachelor of Dental Surgery"],
  "MDS": ["MDS", "Master of Dental Surgery"],
  "B.Arch": ["B.Arch", "Bachelor of Architecture"],
  "M.Arch": ["M.Arch", "Master of Architecture"],
  "PhD": ["PhD", "Doctorate", "Doctor of Philosophy"],
  "Diploma": ["Diploma", "Polytechnic"],
  "PUC": ["PUC", "Pre-University", "Pre-University Education", "Higher Secondary", "12th"],
  "SSLC": ["SSLC", "Secondary Education", "10th", "High School"]
};

const skillsList = [
  "html", "css", "javascript", "react", "node", "python", "java", "sql", "mongodb", "mysql", 
  "php", "c", "c++", "express", "git", "github", "aws", "flask", "machine learning", "ai",
  "docker", "kubernetes", "typescript", "angular", "vue", "spring boot", "django", "ruby",
  "swift", "kotlin", "linux", "jira", "figma", "ui/ux", "agile", "scrum", "data analysis", "devops",
  "next.js", "tailwind", "tailwindcss", "redux", "graphql", "postgresql", "postgres", "nosql",
  "rest api", "gcp", "azure", "ci/cd", "jenkins", "terraform", "ansible", "bash", "shell",
  "go", "rust", "php", "laravel", "c#", ".net", "unity", "machine learning", "deep learning",
  "nlp", "data science", "pandas", "numpy", "pytorch", "tensorflow", "excel", "word", "powerpoint",
  "communication", "leadership", "management", "customer service"
];

const COMMON_HEADERS = [
  "education", "experience", "skills", "projects", "certifications", "courses", 
  "work experience", "professional summary", "summary", "languages", "contact", 
  "personal projects", "academic projects", "coursework", "licenses", "achievements",
  "awards", "volunteer", "side projects"
];

// --- HELPER FUNCTIONS ---

function cleanText(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
}

function isSectionHeader(line) {
  const lower = line.trim().toLowerCase();
  return COMMON_HEADERS.some(h => lower.length < 50 && (lower === h || lower.startsWith(h + ":")));
}

function extractSectionLines(text, sectionKeywords) {
  const lines = text.split('\n');
  let inSection = false;
  let sectionContent = [];
  
  for (let line of lines) {
    const lowerLine = line.trim().toLowerCase();
    
    if (!inSection && sectionKeywords.some(kw => lowerLine === kw || lowerLine.startsWith(kw + ":"))) {
      inSection = true;
      continue;
    }
    
    if (inSection && isSectionHeader(line)) {
      break;
    }
    
    if (inSection && line.trim()) {
      sectionContent.push(line.trim());
    }
  }
  return sectionContent;
}

function extractContactInfo(resumeText) {
  const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = resumeText.match(/(\+91[\s-]?)?[6-9]\d{9}/);
  const firstLine = resumeText.split('\n').find(line => line.trim().length > 0) || "";
  
  return {
    name: firstLine.trim() || "Unknown",
    email: emailMatch ? emailMatch[0] : "Not Found",
    phone: phoneMatch ? phoneMatch[0] : "Not Found"
  };
}

function extractEducation(resumeText) {
  const education = [];
  for (const degree in degreeKeywords) {
    const variations = degreeKeywords[degree];
    for (const variation of variations) {
      const escapedVariation = variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedVariation}\\b`, "i");
      if (regex.test(resumeText) && !education.includes(degree)) {
        education.push(degree);
      }
    }
  }
  return education;
}

function extractExperienceYears(text) {
  const regex = /(\d+)\+?\s*(years?|yrs?)/gi;
  let match;
  let maxYears = 0;
  while ((match = regex.exec(text)) !== null) {
     const yrs = parseInt(match[1], 10);
     if (yrs > maxYears && yrs < 50) {
        maxYears = yrs;
     }
  }
  return maxYears;
}

function detectDomain(text) {
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  let maxScore = 0;
  let bestDomain = "Others";
  
  for (const [domain, keywords] of Object.entries(domainKeywords)) {
    if (domain === "Others") continue;
    let score = 0;
    for (const token of tokens) {
      if (keywords.includes(token)) score++;
    }
    if (score > maxScore) {
      maxScore = score;
      bestDomain = domain;
    }
  }
  return { domain: maxScore >= 2 ? bestDomain : "Others", score: maxScore };
}

function parseSkillsAndSemantic(resumeText, jobDesc) {
  const textLower = resumeText.toLowerCase();
  const jobLower = jobDesc.toLowerCase();
  const resumeSkills = [];
  const jobSkills = [];

  for (const skill of skillsList) {
    const skillLower = skill.toLowerCase();
    const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<=\\s|^|[^a-zA-Z0-9+#])${escapedSkill}(?=\\s|$|[^a-zA-Z0-9+#])`, 'i');
    
    if (regex.test(textLower)) resumeSkills.push(skill);
    if (jobDesc && regex.test(jobLower)) jobSkills.push(skill);
  }

  const matchedSkills = resumeSkills.filter(skill => jobSkills.includes(skill));
  const missingSkills = jobSkills.filter(skill => !resumeSkills.includes(skill));
  
  let skillMatchScore = 0;
  if (!jobDesc || jobDesc.trim() === "") {
     skillMatchScore = 0; 
  } else if (jobSkills.length === 0) {
     const sim = stringSimilarity.compareTwoStrings(textLower, jobLower);
     skillMatchScore = Math.min(100, Math.round(sim * 100));
  } else {
     let matchCount = 0;
     const tokens = textLower.split(/\W+/).filter(t => t.length > 1);
     
     for (const js of jobSkills) {
       if (resumeSkills.includes(js)) {
          matchCount++;
       } else if (tokens.length > 0) {
          const bestMatch = stringSimilarity.findBestMatch(js.toLowerCase(), tokens);
          if (bestMatch.bestMatch.rating > 0.85) {
             matchCount += 0.8;
          }
       }
     }
     skillMatchScore = Math.min(100, Math.round((matchCount / jobSkills.length) * 100));
  }

  return { resumeSkills, jobSkills, matchedSkills, missingSkills, skillMatchScore };
}

function generateSemanticMatch(resumeData, jobData) {
  let score = 0;
  let reason = "";

  // 1. Skill Match (40%)
  const skillPoints = (resumeData.skillsData.skillMatchScore / 100) * 40;
  score += skillPoints;

  // 2. Experience Match (25%)
  const resumeExp = resumeData.experienceYears;
  const jdExp = jobData.experienceYears;
  let expPoints = 0;
  let expGap = "";
  
  if (jdExp === 0) {
      expPoints = 25; 
      expGap = resumeExp > 0 ? `Exceeds (has ${resumeExp} years)` : "Meets requirement (no specific experience required)";
  } else {
      if (resumeExp >= jdExp) {
          expPoints = 25;
          expGap = `Meets requirement (has ${resumeExp} years, needs ${jdExp})`;
      } else {
          expPoints = (resumeExp / jdExp) * 25;
          expGap = `Missing ${jdExp - resumeExp} years (has ${resumeExp}, needs ${jdExp})`;
      }
  }
  score += expPoints;

  // 3. Education Match (15%)
  let eduPoints = 0;
  if (resumeData.education.length > 0) eduPoints = 15; 
  score += eduPoints;

  // 4. Certifications Match (10%)
  let certPoints = resumeData.certifications.length > 0 ? 10 : 0;
  score += certPoints;

  // 5. Role Relevance (10%)
  const resDomain = resumeData.domain.domain;
  const jdDomain = jobData.domain.domain;
  let rolePoints = 0;
  
  if (resDomain === jdDomain && resDomain !== "Others") {
      rolePoints = 10;
  } else if (resDomain === "Others" || jdDomain === "Others") {
      rolePoints = 5;
  }
  score += rolePoints;

  // Domain Penalty
  if (resDomain !== jdDomain && resDomain !== "Others" && jdDomain !== "Others") {
      score = score * 0.2; // 80% penalty
      reason = `Severe domain mismatch. Resume is tailored for '${resDomain}', but job requires '${jdDomain}'. Job roles belong to different industries and require different skill sets.`;
  } else if (resDomain !== "Others" && jdDomain !== "Others" && resDomain === jdDomain) {
      reason = `Strong alignment in the ${resDomain} domain.`;
  } else {
      reason = "General matching applied (domain could not be strongly classified).";
  }

  const domainMatchScore = resDomain === jdDomain && resDomain !== "Others" ? 100 : (resDomain === "Others" || jdDomain === "Others" ? 50 : 5);

  // General ATS Structure score
  let atsScore = 0;
  if (resumeData.contact.email !== "Not Found") atsScore += 20;
  if (resumeData.contact.phone !== "Not Found") atsScore += 20;
  if (resumeData.education.length > 0) atsScore += 20;
  if (resumeData.projects.length > 0) atsScore += 20;
  if (resumeData.skillsData.resumeSkills.length >= 5) atsScore += 20;

  return {
     overallMatch: Math.round(score),
     domainMatchScore,
     atsScore,
     expGap,
     reason,
     resDomain,
     jdDomain
  };
}

// --- MAIN ROUTE ---

app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const jobDesc = req.body.jobDesc || "";
    let resumeText = "";

    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(req.file.buffer) });
        const pdfDocument = await loadingTask.promise;
        let textItems = [];

        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const content = await page.getTextContent();
          
          let lastY = -1;
          let pageText = "";
          for (let item of content.items) {
             const y = item.transform ? item.transform[5] : lastY;
             if (lastY !== -1 && Math.abs(y - lastY) > 5) {
                 pageText += "\n";
             } else if (lastY !== -1) {
                 pageText += " ";
             }
             pageText += item.str || "";
             lastY = y;
          }
          textItems.push(pageText);
        }
        resumeText = textItems.join("\n");
      }
      else if (req.file.mimetype.startsWith("image/")) {
        const result = await Tesseract.recognize(req.file.buffer, "eng", {
            langPath: ".", cacheMethod: "none", gzip: false
        });
        resumeText = result.data.text;
      }
      else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || req.file.mimetype === "application/msword") {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        resumeText = result.value;
      }
    }

    if (!resumeText) {
      return res.status(400).json({ error: "Could not extract text from file" });
    }

    const contact = extractContactInfo(resumeText);
    const education = extractEducation(resumeText);
    
    const projectLines = extractSectionLines(resumeText, ["projects", "personal projects", "academic projects", "side projects", "professional projects"]);
    const projects = projectLines.filter(line => line.length > 10).slice(0, 4);

    const certLines = extractSectionLines(resumeText, ["certifications", "courses", "certificates", "coursework", "licenses"]);
    const certifications = certLines.filter(line => line.length > 5).slice(0, 4);

    const skillsData = parseSkillsAndSemantic(resumeText, jobDesc);

    const resumeData = {
      domain: detectDomain(resumeText),
      experienceYears: extractExperienceYears(resumeText),
      education,
      projects,
      certifications,
      skillsData,
      contact
    };

    const jobData = {
      domain: detectDomain(jobDesc),
      experienceYears: extractExperienceYears(jobDesc)
    };

    const matchAnalysis = generateSemanticMatch(resumeData, jobData);
    
    let experienceDisplay = resumeData.experienceYears > 0 ? `${resumeData.experienceYears} years` : "Fresher";

    const summary = `${contact.name} is a professional in the ${resumeData.domain.domain} domain with ${experienceDisplay} experience. They have been matched with a ${jobData.domain.domain} job description.`;

    const strengths = [];
    if (skillsData.matchedSkills.length > 3) strengths.push("Strong alignment with core job requirements.");
    if (education.some(d => ["M.Sc", "M.Tech", "MCA", "MBA", "PhD"].includes(d))) strengths.push("Advanced higher education degree.");
    if (projects.length > 0) strengths.push("Demonstrated practical experience through projects.");
    if (resumeData.experienceYears >= jobData.experienceYears && jobData.experienceYears > 0) strengths.push("Meets or exceeds experience requirements.");

    const weaknesses = [];
    const suggestions = [];
    
    if (matchAnalysis.resDomain !== matchAnalysis.jdDomain && matchAnalysis.resDomain !== "Others" && matchAnalysis.jdDomain !== "Others") {
        weaknesses.push(`Severe Domain Mismatch: Applied for ${matchAnalysis.jdDomain} role with a ${matchAnalysis.resDomain} resume.`);
        suggestions.push(`Consider applying for roles within the ${matchAnalysis.resDomain} industry.`);
    }

    if (skillsData.missingSkills.length > 0) {
       weaknesses.push(`Missing critical job skills: ${skillsData.missingSkills.slice(0, 3).join(', ')}.`);
       suggestions.push(`Consider learning ${skillsData.missingSkills[0]} to improve your match rate.`);
    }
    if (certifications.length === 0) {
       weaknesses.push("No explicit certifications detected.");
       suggestions.push("Adding industry-recognized certifications can boost your ATS visibility.");
    }
    if (projects.length === 0) {
       weaknesses.push("No specific projects section found.");
       suggestions.push("Detail your technical projects to demonstrate hands-on ability.");
    }
    if (resumeData.experienceYears < jobData.experienceYears) {
       weaknesses.push(`Lacks required experience (needs ${jobData.experienceYears} years).`);
    }

    if (suggestions.length === 0) suggestions.push("Your resume is well optimized for this role.");
    if (strengths.length === 0) strengths.push("Focus on tailoring your resume more to the job description.");

    res.json({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      education,
      experience: experienceDisplay,
      matchScore: matchAnalysis.overallMatch,
      domainMatchScore: matchAnalysis.domainMatchScore,
      atsScore: matchAnalysis.atsScore,
      expGap: matchAnalysis.expGap,
      reason: matchAnalysis.reason,
      resDomain: matchAnalysis.resDomain,
      jdDomain: matchAnalysis.jdDomain,
      matchedSkills: skillsData.matchedSkills,
      missingSkills: skillsData.missingSkills,
      allSkills: skillsData.resumeSkills,
      projects,
      certifications,
      summary,
      strengths,
      weaknesses,
      suggestions
    });

  } catch (err) {
    console.error("Analysis Error:", err);
    res.status(500).json({ error: "Internal Server Error during analysis" });
  }
});

app.use(express.static("client/dist"));

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});