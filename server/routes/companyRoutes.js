import express from'express'
import { getCompanyPostedJobs,getCompanyJobApplicants,postJob,getCompanyData,loginCompany,registerCompany, changeJobApplicationStatus, changeVisibility } from '../controllers/companyController.js'
import upload from '../config/multer.js'
import { protectCompany } from '../middleware/authMiddleware.js'

const router = express.Router()

// Register a company
router.post('/register',upload.single('image'), registerCompany)

//company login
router.post('/login', loginCompany)

// Get company data
router.get('/company', protectCompany, getCompanyData)

// Post a job
router.post('/post-Job',protectCompany, postJob)

// Get Applicants Data of a Company
router.get('/applicants',protectCompany, getCompanyJobApplicants)

// Get Company job list
router.get('/list-jobs',protectCompany, getCompanyPostedJobs)

// Change Application Status
router.post('/change-status',protectCompany,changeJobApplicationStatus)

//Change Application visiblity
router.post('/change-visibility',protectCompany,changeVisibility)

export default router