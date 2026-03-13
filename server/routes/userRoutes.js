import express from 'express'
import { applyForJob, getUserData, getUserJobApplications, updateUserResume, getApplicationById, generateInterviewQuestion, evaluateInterviewAnswer } from '../controllers/userController.js'
import upload from '../config/multer.js'


const router = express.Router()

// Get user Data
router.get('/user',getUserData)

// Apply for a job
router.post('/apply', applyForJob)

// Get applied jobs data
router.get('/applications', getUserJobApplications)

// Get single application by ID
router.get('/application/:id', getApplicationById)

// Generate interview question
router.post('/generate-question', generateInterviewQuestion)

// Evaluate interview answer
router.post('/evaluate-answer', evaluateInterviewAnswer)

// Update user profile (resume)
router.post('/update-resume', upload.single('resume'),updateUserResume)

export default router;