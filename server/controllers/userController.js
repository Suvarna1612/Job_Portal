import { getAuth } from "@clerk/express"
import Job from "../models/Job.js"
import JobApplication from "../models/JobApplication.js"
import User from "../models/User.js"
import { v2 as cloudinary } from "cloudinary"
import axios from 'axios'
import { GoogleGenerativeAI } from "@google/generative-ai"

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

        const user = await User.findById(userId)
        if (!user.resume) {
            return res.json({ success: false, message: 'Please upload a resume in your profile before applying.' })
        }

        // --- RESUME SCORING USING GEMINI ---
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            return res.json({ success: false, message: 'Gemini API Key is not configured in the server environment.' })
        }

        try {
            // Import pdf-parse from lib to avoid test file loading issue
            const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
            
            const response = await axios.get(user.resume, { responseType: 'arraybuffer' })
            const pdfBuffer = Buffer.from(response.data)
            const resumeData = await pdfParse(pdfBuffer)
            const resumeText = resumeData.text

            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })

            const prompt = `Analyze this candidate's resume against the following job description.
            Job Description:
            ${jobData.description}
            
            Resume:
            ${resumeText}
            
            Provide ONLY a JSON response with a single property "matchPercentage" containing an integer from 0 to 100 representing how well the resume matches the job description. Do not include any other text or explanation.`;

            const result = await model.generateContent(prompt)
            const responseText = result.response.text()

            const cleanJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
            const scoreData = JSON.parse(cleanJsonText)
            const matchPercentage = scoreData.matchPercentage

            if (matchPercentage < 50) {
                return res.json({
                    success: false,
                    message: `Application Rejected: Your resume matched ${matchPercentage}% with the job description. A minimum of 50% is required.`
                })
            }
        } catch (error) {
            console.error("Resume scoring error:", error)

            if (error.isAxiosError && error.response && error.response.status === 401) {
                return res.json({ success: false, message: 'Your resume is restricted by Cloudinary security. Please go to your profile, re-upload your resume, and try applying again.' })
            }

            return res.json({ success: false, message: 'Error analyzing resume with AI. Please try again.' })
        }
        // --- END SCORING ---

        await JobApplication.create({
            companyId: jobData.companyId,
            userId,
            jobId,
            date: Date.now()
        })

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

// Update user profile (resume)
export const updateUserResume = async (req, res) => {
    try {

        const { userId } = getAuth(req)

        const resumeFile = req.file

        const userData = await User.findById(userId)

        if (resumeFile) {
            // Upload as a 'raw' resource to bypass Cloudinary's strict PDF image-processing restrictions
            const resumeUpload = await cloudinary.uploader.upload(resumeFile.path, { resource_type: "raw" })
            userData.resume = resumeUpload.secure_url
        }

        await userData.save()

        return res.json({ success: true, message: 'Resume Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
