import express from'express'
import { getCompanyPostedJobs,getCompanyJobApplicants,postJob,getCompanyData,loginCompany,registerCompany, changeJobApplicationStatus, changeVisibility, generateMatchAnalytics, deleteJobApplication, editJob, deleteJob } from '../controllers/companyController.js'
import upload from '../config/multer.js'
import { protectCompany } from '../middleware/authMiddleware.js'
import axios from 'axios'

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

// Generate match analytics for new applications
router.post('/generate-analytics',protectCompany, generateMatchAnalytics)

// Get analytics statistics
router.get('/analytics-stats', protectCompany, async (req, res) => {
    try {
        const companyId = req.company._id
        const { getAnalyticsStats } = await import('../utils/analyticsHelper.js')
        
        const stats = await getAnalyticsStats(companyId)
        
        res.json({
            success: true,
            stats: {
                ...stats,
                needsProcessing: stats.withoutAnalytics > 0,
                message: stats.withoutAnalytics > 0 
                    ? `${stats.withoutAnalytics} applications need analytics processing`
                    : 'All applications have been analyzed'
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
})

// Reset rate limiting counters (for new API keys)
router.post('/reset-rate-limits', protectCompany, async (req, res) => {
    try {
        const rateLimitHandler = (await import('../utils/rateLimitHandler.js')).default
        rateLimitHandler.manualReset()
        
        res.json({
            success: true,
            message: 'Rate limiting counters have been reset. You can now make fresh API calls.',
            quotaStatus: rateLimitHandler.getQuotaStatus()
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
})

// Delete job application
router.post('/delete-application',protectCompany, deleteJobApplication)

// Edit job
router.post('/edit-job', protectCompany, editJob)

// Delete job
router.post('/delete-job', protectCompany, deleteJob)

// Get API quota status
router.get('/quota-status', protectCompany, async (req, res) => {
    try {
        const { getQuotaStatus } = await import('../utils/rateLimitHandler.js')
        const quotaStatus = getQuotaStatus()
        
        res.json({
            success: true,
            quotaStatus,
            recommendations: {
                canProcessApplications: quotaStatus.minuteQuota.remaining > 0 && quotaStatus.dailyQuota.remaining > 0,
                suggestedBatchSize: Math.min(quotaStatus.minuteQuota.remaining, 10),
                nextResetTime: new Date(Date.now() + quotaStatus.minuteQuota.resetIn).toISOString()
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
})

// Proxy resume PDF so browser can view it inline (no auth needed - URL is already secured by Cloudinary)
router.get('/resume-proxy', async (req, res) => {
    try {
        const { url } = req.query
        if (!url) return res.status(400).json({ success: false, message: 'URL required' })

        const response = await axios.get(decodeURIComponent(url), { responseType: 'arraybuffer' })
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"')
        res.send(Buffer.from(response.data))
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to load resume' })
    }
})

export default router