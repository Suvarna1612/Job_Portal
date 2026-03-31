import { getAuth } from "@clerk/express"
import Job from "../models/Job.js"
import JobApplication from "../models/JobApplication.js"
import User from "../models/User.js"
import SavedJob from "../models/SavedJob.js"
import CompanyFollower from "../models/CompanyFollower.js"
import { v2 as cloudinary } from "cloudinary"
import axios from 'axios'
import { GoogleGenerativeAI } from "@google/generative-ai"
import { sendApplicationConfirmation } from "../utils/sendEmail.js"

// Get user data 
export const getUserData = async (req, res) => {

    const { userId } = getAuth(req)
    console.log("Userid", userId)
    try {

        let user = await User.findById(userId)

        if (!user) {
            // Local dev fallback: If webhook wasn't received, fetch user directly from Clerk
            try {
                const clerkResponse = await axios.get(`https://api.clerk.com/v1/users/${userId}`, {
                    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
                })
                const clerkUser = clerkResponse.data;
                const email = clerkUser.email_addresses?.[0]?.email_address || '';
                const name = `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || 'Unknown User';
                const image = clerkUser.image_url || '';

                user = await User.create({
                    _id: userId,
                    email,
                    name,
                    image,
                    resume: "",
                });
            } catch (err) {
                return res.json({ success: false, message: 'User Not Found in local DB and failed to sync from Clerk.' })
            }
        }

        res.json({ success: true, user })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}


// Apply for a job
export const applyForJob = async (req, res) => {

    const { jobId } = req.body

    const { userId } = getAuth(req)


    try {

        const isAlreadyApplied = await JobApplication.find({ jobId, userId })

        if (isAlreadyApplied.length > 0) {
            return res.json({ success: false, message: 'Already applied' })
        }

        const jobData = await Job.findById(jobId)

        if (!jobData) {
            return res.json({ success: false, message: 'Job Not Found' })
        }

        // Check if job has expired
        if (jobData.expiryDate && new Date(jobData.expiryDate) < new Date()) {
            return res.json({ success: false, message: 'This job posting has expired and is no longer accepting applications.' })
        }

        // Check if max applications reached
        if (jobData.maxApplications && jobData.applicationCount >= jobData.maxApplications) {
            return res.json({ success: false, message: 'This job has reached its maximum number of applications.' })
        }

        const user = await User.findById(userId)
        if (!user.resume) {
            return res.json({ success: false, message: 'Please upload a resume in your profile before applying.' })
        }

        // --- RESUME SCORING USING GEMINI ---
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.json({ success: false, message: 'Gemini API Key is not configured in the server environment.' })
        }

        let overallMatch = 0, skillsMatch = 0, experienceMatch = 0, educationMatch = 0

        try {
            // Import pdf-parse from lib to avoid test file loading issue
            const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default

            console.log(`Attempting to fetch resume from: ${user.resume}`)
            const response = await axios.get(user.resume, { 
                responseType: 'arraybuffer',
                timeout: 10000,  // 10 second timeout
                headers: {
                    'User-Agent': 'Job-Portal-Server/1.0'
                }
            })
            
            const pdfBuffer = Buffer.from(response.data)
            const resumeData = await pdfParse(pdfBuffer)
            const resumeText = resumeData.text

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })

            const prompt = `Analyze this candidate's resume against the following job description and provide detailed matching scores.

Job Description:
${jobData.description}

Resume:
${resumeText}

Provide ONLY a JSON response with the following structure:
{
  "overallMatch": integer from 0-100,
  "skillsMatch": integer from 0-100 (technical skills alignment),
  "experienceMatch": integer from 0-100 (years and type of experience),
  "educationMatch": integer from 0-100 (degree and certifications alignment)
}

Do not include any other text or explanation.`;

            const result = await model.generateContent(prompt)
            const responseText = result.response.text()

            const cleanJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
            const matchData = JSON.parse(cleanJsonText)
            
            overallMatch = matchData.overallMatch
            skillsMatch = matchData.skillsMatch
            experienceMatch = matchData.experienceMatch
            educationMatch = matchData.educationMatch

            if (overallMatch < 50) {
                //  To Generate learning suggestions using Gemini
                try {
                    const suggestionPrompt = `Based on the following job description and resume analysis, provide specific learning suggestions to help the candidate become eligible for this role.
Job Title: ${jobData.title}
Job Description: ${jobData.description}
Resume Content: ${resumeText}
Match Percentage: ${overallMatch}%

Provide 5-7 specific, actionable learning suggestions including:
1. Technical skills to develop
2. Certifications to pursue
3. Online courses or platforms to use
4. Projects to build
5. Experience areas to focus on

Format as a JSON object with this structure:
{
  "suggestions": [
    {
      "category": "Technical Skills",
      "title": "Learn [Specific Technology]",
      "description": "Brief description of why this is important",
      "resources": ["Resource 1", "Resource 2"]
    }
  ]
}

Provide ONLY the JSON response, no other text.`
                    const suggestionResult = await model.generateContent(suggestionPrompt)
                    const suggestionText = suggestionResult.response.text()
                    const cleanSuggestionJson = suggestionText.replace(/```json/gi, '').replace(/```/g, '').trim()
                    const suggestions = JSON.parse(cleanSuggestionJson)
                    return res.json({
                        success: false,
                        message: `Unfortunately, your profile does not meet the necessary qualifications and skillset required for this position at this time.`,
                        matchPercentage: overallMatch,
                        suggestions: suggestions.suggestions
                    })
                } catch (suggestionError) {
                    console.error("Suggestion generation error:", suggestionError)
                    return res.json({
                        success: false,
                        message: `Unfortunately, your profile does not meet the necessary qualifications and skillset required for this position at this time.`,
                        matchPercentage: overallMatch
                    })
                }
            }
        } catch (error) {
            console.error("Resume scoring error:", error)

            if (error.isAxiosError && error.response) {
                const status = error.response.status
                console.error(`HTTP ${status} error when fetching resume: ${user.resume}`)
                
                if (status === 401) {
                    return res.json({ 
                        success: false, 
                        message: 'Your resume is restricted by Cloudinary security. Please go to your profile, re-upload your resume, and try applying again.' 
                    })
                } else if (status === 404) {
                    return res.json({ 
                        success: false, 
                        message: 'Resume file not found. Please re-upload your resume in your profile.' 
                    })
                } else {
                    return res.json({ 
                        success: false, 
                        message: `Error accessing resume (HTTP ${status}). Please re-upload your resume and try again.` 
                    })
                }
            }

            return res.json({ success: false, message: 'Error analyzing resume. Please try again.' })
        }
        // --- END SCORING ---

        await JobApplication.create({
            companyId: jobData.companyId,
            userId,
            jobId,
            date: Date.now(),
            matchAnalytics: {
                overallMatch: overallMatch,
                skillsMatch: skillsMatch,
                experienceMatch: experienceMatch,
                educationMatch: educationMatch,
                analysisDate: new Date()
            }
        })

        // Increment application count for the job
        await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } })

        // Send confirmation email to user
        try {
            const populatedJob = await Job.findById(jobId).populate('companyId', 'name')
            const companyName = populatedJob.companyId.name

            console.log(`📧 Sending confirmation email to: ${user.email} | Job: ${jobData.title} | Company: ${companyName}`)

            const emailResult = await sendApplicationConfirmation(
                user.email,
                user.name,
                jobData.title,
                companyName
            )

            if (!emailResult.success) {
                console.error('❌ Email failed:', emailResult.error)
            }
        } catch (emailError) {
            console.error('❌ Error sending confirmation email:', emailError.message)
        }

        res.json({ success: true, message: 'Applied Successfully' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Get user applied application
export const getUserJobApplications = async (req, res) => {

    try {

        const { userId } = getAuth(req)


        const applications = await JobApplication.find({ userId })
            .populate('companyId', 'name email image')
            .populate('jobId', 'title description location category level salary')
            .exec()

        if (!applications) {
            return res.json({ success: false, message: 'No job applications found for this user.' })
        }

        return res.json({ success: true, applications })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Get single application by ID
export const getApplicationById = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const { id } = req.params

        const application = await JobApplication.findOne({ _id: id, userId })
            .populate('companyId', 'name email image')
            .populate('jobId', 'title description location category level salary companyId')
            .exec()

        if (!application) {
            return res.json({ success: false, message: 'Application not found' })
        }

        return res.json({ success: true, application })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Helper: try Gemini with multiple fallback models
const geminiGenerate = async (prompt) => {
    const models = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.5-flash']
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    let lastError
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName })
            const result = await model.generateContent(prompt)
            console.log(`✅ Gemini responded using model: ${modelName}`)
            return result.response.text()
        } catch (err) {
            console.warn(`⚠️ Model ${modelName} failed: ${err.message}`)
            lastError = err
        }
    }
    throw lastError
}

// Generate interview question
export const generateInterviewQuestion = async (req, res) => {
    try {
        const { jobId, questionNumber } = req.body

        if (!jobId || !questionNumber) {
            return res.json({ success: false, message: 'jobId and questionNumber are required.' })
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.json({ success: false, message: 'AI service not configured' })
        }

        const jobData = await Job.findById(jobId)
        if (!jobData) {
            return res.json({ success: false, message: 'Job not found' })
        }

        const level = questionNumber === 1 ? 'basic' : questionNumber <= 3 ? 'intermediate' : 'advanced'
        const prompt = `You are an expert interviewer. Based on the following job description, generate a relevant interview question.

Job Title: ${jobData.title}
Job Description: ${jobData.description}
Question Number: ${questionNumber}

Generate a ${level} level interview question that tests the candidate's knowledge and skills for this role.

Provide ONLY the question text, nothing else.`

        const question = await geminiGenerate(prompt)
        return res.json({ success: true, question: question.trim() })

    } catch (error) {
        console.error("Question generation error:", error.message)
        res.json({ success: false, message: error.message || 'Error generating question. Please try again.' })
    }
}

// Evaluate interview answer
export const evaluateInterviewAnswer = async (req, res) => {
    try {
        const { jobId, question, answer } = req.body

        if (!jobId || !question || !answer) {
            return res.json({ success: false, message: 'jobId, question, and answer are required.' })
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.json({ success: false, message: 'AI service not configured' })
        }

        const jobData = await Job.findById(jobId)
        if (!jobData) {
            return res.json({ success: false, message: 'Job not found' })
        }

        const prompt = `You are an expert interviewer evaluating a candidate's answer.

Job Title: ${jobData.title}
Job Description: ${jobData.description}

Interview Question: ${question}

Candidate's Answer: ${answer}

Evaluate this answer and provide:
1. A score from 1-10
2. Detailed feedback on what was good and what could be improved
3. Suggestions for a better answer

Respond ONLY in JSON format with this structure:
{
  "score": <number 1-10>,
  "feedback": "<detailed feedback>",
  "suggestions": "<suggestions for improvement>"
}

Do not include any other text or explanation outside the JSON.`

        const responseText = await geminiGenerate(prompt)
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
        const evaluation = JSON.parse(cleanJson)

        return res.json({ success: true, evaluation })

    } catch (error) {
        console.error("Answer evaluation error:", error.message)
        res.json({ success: false, message: error.message || 'Error evaluating answer. Please try again.' })
    }
}

// Update user profile (resume)
export const updateUserResume = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const resumeFile = req.file
        const userData = await User.findById(userId)

        if (resumeFile) {
            // Upload with proper configuration for public access
            const resumeUpload = await cloudinary.uploader.upload(resumeFile.path, {
                resource_type: "raw",
                public_id: `resume_${userId}_${Date.now()}`,
                type: "upload",
                access_mode: "public",
                folder: "resumes"  // Organize in a folder
            })
            
            // Store the secure URL
            userData.resume = resumeUpload.secure_url
            
            // Also store a proxy URL as fallback
            userData.resumeProxy = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/users/resume-proxy/${userId}`
            
            console.log(`Resume uploaded for user ${userId}: ${resumeUpload.secure_url}`)
        }

        await userData.save()
        return res.json({ success: true, message: 'Resume Updated' })

    } catch (error) {
        console.error('Resume upload error:', error)
        res.json({ success: false, message: error.message })
    }
}

// Proxy endpoint for serving resume files (fallback for Cloudinary 401 errors)
export const getResumeProxy = async (req, res) => {
    try {
        const { userId } = req.params
        const user = await User.findById(userId)
        
        if (!user || !user.resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' })
        }

        console.log(`Proxying resume for user ${userId}: ${user.resume}`)

        // Fetch the resume from Cloudinary
        const response = await axios.get(user.resume, { 
            responseType: 'stream',
            timeout: 10000,
            headers: {
                'User-Agent': 'Job-Portal-Server/1.0'
            }
        })

        // Set appropriate headers
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="resume_${userId}.pdf"`)
        res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
        
        // Pipe the stream to response
        response.data.pipe(res)

    } catch (error) {
        console.error('Resume proxy error:', error)
        if (error.response && error.response.status === 401) {
            res.status(401).json({ 
                success: false, 
                message: 'Resume access restricted. Please re-upload your resume.' 
            })
        } else {
            res.status(500).json({ success: false, message: 'Error serving resume' })
        }
    }
}
// Save/Unsave a job
export const toggleSaveJob = async (req, res) => {
    try {
        const { jobId } = req.body
        const { userId } = getAuth(req)

        // Check if job is already saved
        const existingSavedJob = await SavedJob.findOne({ userId, jobId })

        if (existingSavedJob) {
            // Unsave the job
            await SavedJob.findByIdAndDelete(existingSavedJob._id)
            return res.json({ success: true, message: 'Job removed from saved jobs', saved: false })
        } else {
            // Save the job
            await SavedJob.create({ userId, jobId })
            return res.json({ success: true, message: 'Job saved successfully', saved: true })
        }

    } catch (error) {
        console.error('Toggle save job error:', error)
        res.json({ success: false, message: error.message })
    }
}

// Get user's saved jobs
export const getSavedJobs = async (req, res) => {
    try {
        const { userId } = getAuth(req)

        const savedJobs = await SavedJob.find({ userId })
            .populate({
                path: 'jobId',
                populate: {
                    path: 'companyId',
                    select: 'name image'
                }
            })
            .sort({ savedDate: -1 })

        // Filter out any saved jobs where the job has been deleted
        const validSavedJobs = savedJobs.filter(savedJob => savedJob.jobId)

        return res.json({ success: true, savedJobs: validSavedJobs })

    } catch (error) {
        console.error('Get saved jobs error:', error)
        res.json({ success: false, message: error.message })
    }
}

// Check if jobs are saved (for displaying save status on job listings)
export const checkSavedJobs = async (req, res) => {
    try {
        const { jobIds } = req.body
        const { userId } = getAuth(req)

        const savedJobs = await SavedJob.find({ 
            userId, 
            jobId: { $in: jobIds } 
        }).select('jobId')

        const savedJobIds = savedJobs.map(savedJob => savedJob.jobId.toString())

        return res.json({ success: true, savedJobIds })

    } catch (error) {
        console.error('Check saved jobs error:', error)
        res.json({ success: false, message: error.message })
    }
}
// Follow/Unfollow a company
export const toggleFollowCompany = async (req, res) => {
    try {
        const { companyId } = req.body
        const { userId } = getAuth(req)

        // Check if user is already following the company
        const existingFollow = await CompanyFollower.findOne({ userId, companyId })

        if (existingFollow) {
            // Unfollow the company
            await CompanyFollower.findByIdAndDelete(existingFollow._id)
            return res.json({ success: true, message: 'Company unfollowed successfully', following: false })
        } else {
            // Follow the company
            await CompanyFollower.create({ userId, companyId })
            return res.json({ success: true, message: 'Company followed successfully! You\'ll be notified of new job postings.', following: true })
        }

    } catch (error) {
        console.error('Toggle follow company error:', error)
        res.json({ success: false, message: error.message })
    }
}

// Get user's followed companies
export const getFollowedCompanies = async (req, res) => {
    try {
        const { userId } = getAuth(req)

        const followedCompanies = await CompanyFollower.find({ userId, isActive: true })
            .populate('companyId', 'name image email')
            .sort({ followedDate: -1 })

        // Filter out any follows where the company has been deleted
        const validFollows = followedCompanies.filter(follow => follow.companyId)

        return res.json({ success: true, followedCompanies: validFollows })

    } catch (error) {
        console.error('Get followed companies error:', error)
        res.json({ success: false, message: error.message })
    }
}

// Check if companies are followed (for displaying follow status)
export const checkFollowedCompanies = async (req, res) => {
    try {
        const { companyIds } = req.body
        const { userId } = getAuth(req)

        const followedCompanies = await CompanyFollower.find({ 
            userId, 
            companyId: { $in: companyIds },
            isActive: true
        }).select('companyId')

        const followedCompanyIds = followedCompanies.map(follow => follow.companyId.toString())

        return res.json({ success: true, followedCompanyIds })

    } catch (error) {
        console.error('Check followed companies error:', error)
        res.json({ success: false, message: error.message })
    }
}

// Enhance Resume - ATS analysis and suggestions
export const enhanceResume = async (req, res) => {
    try {
        const resumeFile = req.file
        if (!resumeFile) {
            return res.json({ success: false, message: 'Please upload a resume PDF.' })
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.json({ success: false, message: 'Gemini API Key is not configured.' })
        }

        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
        const fs = await import('fs')
        const pdfBuffer = fs.readFileSync(resumeFile.path)
        const resumeData = await pdfParse(pdfBuffer)
        const resumeText = resumeData.text

        // Clean up temp file
        fs.unlinkSync(resumeFile.path)

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

        const prompt = `You are an expert ATS (Applicant Tracking System) resume analyst. Analyze the following resume thoroughly.

Resume Content:
${resumeText}

Provide a detailed ATS analysis in ONLY this JSON format (no extra text):
{
  "atsScore": <integer 0-100 overall ATS compatibility score>,
  "atsSummary": "<2-3 sentence summary of the resume's ATS compatibility>",
  "scores": {
    "formatting": <integer 0-100>,
    "keywords": <integer 0-100>,
    "readability": <integer 0-100>,
    "impact": <integer 0-100>
  },
  "strengths": [
    "<strength point 1>",
    "<strength point 2>",
    "<strength point 3>"
  ],
  "issues": [
    "<issue 1>",
    "<issue 2>",
    "<issue 3>"
  ],
  "rephrasingSuggestions": [
    {
      "original": "<exact weak line from resume>",
      "improved": "<stronger, ATS-friendly rephrased version>",
      "reason": "<why this change improves ATS score>"
    }
  ],
  "actionTips": [
    "<specific actionable tip 1>",
    "<specific actionable tip 2>",
    "<specific actionable tip 3>",
    "<specific actionable tip 4>",
    "<specific actionable tip 5>"
  ]
}

Rules:
- rephrasingSuggestions must have 3-6 real lines from the resume that need improvement
- Be specific and actionable, not generic
- Focus on ATS keywords, action verbs, quantifiable achievements, formatting issues`

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
        const analysis = JSON.parse(cleanJson)

        return res.json({ success: true, analysis })

    } catch (error) {
        console.error('Enhance resume error:', error)
        res.json({ success: false, message: 'Error analyzing resume. Please try again.' })
    }
}
