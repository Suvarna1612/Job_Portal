import Company from "../models/Company.js";
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import CompanyFollower from "../models/CompanyFollower.js";
import { sendApplicationStatusEmail, sendNewJobNotification } from "../utils/sendEmail.js";
// import { jobsData } from "../../client/src/assets/assets.js";


// Register a new company
export const registerCompany = async (req,res) => {

    const {name,email,password} = req.body

    const imageFile = req.file;

    if (!name || !email || !password || !imageFile) {
        return res.json({success:false,message:"Missing Details"})
    }

    try {
        const companyExists= await Company.findOne({email})

        if(companyExists){
            return res.json({success:false,message:'Company already registered'})
        }

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        const company = await Company.create({
            name,
            email,
            password: hashPassword,
            image: imageUpload.secure_url
        })

        res.json({
            success:true,
            company:{
                _id : company._id,
                name : company.name,
                email : company.email,
                image : company.image
            },
            token: generateToken(company._id)
        })

    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// Company login
export const loginCompany = async (req,res) => {
    const { email, password} = req.body

    try {
        const company = await Company.findOne({email})

        if (await bcrypt.compare(password, company.password)) {
            res.json({
                success:true,
                company:{
                    _id : company._id,
                    name : company.name,
                    email : company.email,
                    image : company.image
                },
                token: generateToken(company._id)
            })
        }
        else{
            res.json({success:false, message: 'Invalid email or password'})
        }


    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// Get Company data
export const getCompanyData = async (req,res) => {


    try {

        const company = req.company
        
        res.json({success:true, company})

    } catch (error) {
        res.json({
            success:false,message:error.message
        })
    }

}

// Post a new job
export const postJob = async (req,res) =>{

    const { title, description, location, salary, level, category, expiryDate, maxApplications } = req.body

    const companyId = req.company._id

    try {
        const jobData = {
            title,
            description,
            location,
            salary,
            companyId,
            date: Date.now(),
            level,
            category
        }

        // Add optional fields if provided
        if (expiryDate) {
            jobData.expiryDate = new Date(expiryDate)
        }
        if (maxApplications) {
            jobData.maxApplications = parseInt(maxApplications)
        }

        const newJob = new Job(jobData)
        await newJob.save()

        // Send notifications to company followers
        try {
            const followers = await CompanyFollower.find({ 
                companyId, 
                isActive: true 
            }).populate('userId', 'name email')

            const company = await Company.findById(companyId).select('name')

            console.log(`📧 Sending new job notifications to ${followers.length} followers of ${company.name}`)

            // Send notifications in batches to avoid overwhelming the email service
            const batchSize = 10
            for (let i = 0; i < followers.length; i += batchSize) {
                const batch = followers.slice(i, i + batchSize)
                
                const emailPromises = batch.map(async (follower) => {
                    if (follower.userId && follower.userId.email) {
                        try {
                            await sendNewJobNotification(
                                follower.userId.email,
                                follower.userId.name,
                                title,
                                company.name,
                                newJob._id,
                                location,
                                salary
                            )
                        } catch (emailError) {
                            console.error(`❌ Failed to send notification to ${follower.userId.email}:`, emailError.message)
                        }
                    }
                })

                await Promise.all(emailPromises)
                
                // Small delay between batches to avoid rate limiting
                if (i + batchSize < followers.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000))
                }
            }

        } catch (notificationError) {
            console.error('❌ Error sending job notifications:', notificationError.message)
            // Don't fail the job posting if notifications fail
        }

        res.json({success:true, newJob})
    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// Get company Job Applicants
export const getCompanyJobApplicants = async (req,res) =>{
    try{
        const companyId = req.company._id

        //Find job applications for user and populate related data
        const applications = await JobApplication.find({companyId})
        .populate('userId', 'name image resume')
        .populate('jobId', 'title location category level salary')
        .exec()

        // Format applications with match analytics for recruiter dashboard
        const formattedApplications = applications.map(app => ({
            ...app.toObject(),
            matchAnalytics: app.matchAnalytics || {
                overallMatch: 0,
                skillsMatch: 0,
                experienceMatch: 0,
                educationMatch: 0
            }
        }))

        return res.json({ success: true, applications: formattedApplications})
    }
    catch(error){
        res.json({success: false, message: error.message})
    }
}

// Get Company posted jobs
export const getCompanyPostedJobs = async (req,res) =>{
    try {
        
        const companyId = req.company._id

        const jobs= await Job.find({companyId})

        // Adding No of applications info in data
        const jobsData = await Promise.all(jobs.map(async (job) => {
            const applicants = await JobApplication.find({jobId: job._id});
            return {...job.toObject(), applicants: applicants.length}
        }))

        res.json({success:true, jobsData})

    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// Change Job Application Status
export const changeJobApplicationStatus = async (req, res) => {
    try {
        const { id, status } = req.body

        const application = await JobApplication.findById(id)
            .populate('userId', 'name email')
            .populate('jobId', 'title')
            .populate('companyId', 'name')

        if (!application) {
            return res.json({ success: false, message: 'Application not found' })
        }

        await JobApplication.findByIdAndUpdate(id, { status })

        // Send status email to candidate
        if (status === 'Accepted' || status === 'Rejected') {
            try {
                await sendApplicationStatusEmail(
                    application.userId.email,
                    application.userId.name,
                    application.jobId.title,
                    application.companyId.name,
                    status
                )
            } catch (emailError) {
                console.error('❌ Failed to send status email:', emailError.message)
            }
        }

        res.json({ success: true, message: 'Status Changed' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Change job visiblity
export const changeVisibility = async (req,res) =>{
    try {
        
        const {id} = req.body

        const companyId = req.company._id

        const job= await Job.findById(id)

        if (companyId.toString() === job.companyId.toString()) {
            job.visible = !job.visible
        }

        await job.save()

        res.json({success:true, job})


    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

// Regenerate match analytics for applications that don't have them
export const regenerateMatchAnalytics = async (req, res) => {
    try {
        const companyId = req.company._id

        // Find applications without match analytics
        const applicationsWithoutAnalytics = await JobApplication.find({
            companyId,
            $or: [
                { matchAnalytics: { $exists: false } },
                { 'matchAnalytics.overallMatch': 0 }
            ]
        })
        .populate('userId', 'name resume')
        .populate('jobId', 'title description')

        console.log(`Found ${applicationsWithoutAnalytics.length} applications without analytics`)

        let processed = 0
        let errors = 0

        for (const application of applicationsWithoutAnalytics) {
            try {
                if (!application.userId.resume || !application.jobId.description) {
                    console.log(`Skipping application ${application._id} - missing resume or job description`)
                    continue
                }

                // Import required modules
                const { GoogleGenerativeAI } = await import('@google/generative-ai')
                const axios = (await import('axios')).default
                const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default

                // Fetch and parse resume
                const response = await axios.get(application.userId.resume, { 
                    responseType: 'arraybuffer',
                    timeout: 10000
                })
                const pdfBuffer = Buffer.from(response.data)
                const resumeData = await pdfParse(pdfBuffer)
                const resumeText = resumeData.text

                // Generate analytics using AI
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })

                const prompt = `Analyze this candidate's resume against the following job description and provide detailed matching scores.

Job Description:
${application.jobId.description}

Resume:
${resumeText}

Provide ONLY a JSON response with the following structure:
{
  "overallMatch": integer from 0-100,
  "skillsMatch": integer from 0-100 (technical skills alignment),
  "experienceMatch": integer from 0-100 (years and type of experience),
  "educationMatch": integer from 0-100 (degree and certifications alignment)
}

Do not include any other text or explanation.`

                const result = await model.generateContent(prompt)
                const responseText = result.response.text()
                const cleanJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
                const matchData = JSON.parse(cleanJsonText)

                // Update the application with analytics
                await JobApplication.findByIdAndUpdate(application._id, {
                    matchAnalytics: {
                        overallMatch: matchData.overallMatch || 0,
                        skillsMatch: matchData.skillsMatch || 0,
                        experienceMatch: matchData.experienceMatch || 0,
                        educationMatch: matchData.educationMatch || 0,
                        analysisDate: new Date()
                    }
                })

                processed++
                console.log(`✅ Processed application ${application._id} - Overall: ${matchData.overallMatch}%`)

                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000))

            } catch (error) {
                console.error(`❌ Error processing application ${application._id}:`, error.message)
                errors++
            }
        }

        res.json({ 
            success: true, 
            message: `Analytics regenerated for ${processed} applications. ${errors} errors occurred.`,
            processed,
            errors
        })

    } catch (error) {
        console.error('Error regenerating analytics:', error)
        res.json({ success: false, message: error.message })
    }
}
// Delete Job Application
export const deleteJobApplication = async (req, res) => {
    try {
        const { id } = req.body
        const companyId = req.company._id

        // Find the application and verify it belongs to this company
        const application = await JobApplication.findById(id)
            .populate('jobId', 'companyId')

        if (!application) {
            return res.json({ success: false, message: 'Application not found' })
        }

        // Verify the application belongs to this company
        if (application.jobId.companyId.toString() !== companyId.toString()) {
            return res.json({ success: false, message: 'Unauthorized to delete this application' })
        }

        // Delete the application
        await JobApplication.findByIdAndDelete(id)

        // Decrement application count for the job
        await Job.findByIdAndUpdate(application.jobId._id, { $inc: { applicationCount: -1 } })

        res.json({ success: true, message: 'Application deleted successfully' })
    } catch (error) {
        console.error('Delete application error:', error)
        res.json({ success: false, message: error.message })
    }
}