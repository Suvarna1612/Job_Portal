import express from 'express'
import upload from '../config/multer.js'
import {
    getCandidateChat,
    sendCandidateMessage,
    getRecruiterChat,
    sendRecruiterMessage,
    getCandidateUnreadCount,
    getRecruiterUnreadCounts
} from '../controllers/chatController.js'

const router = express.Router()

// Candidate routes
router.get('/candidate/:applicationId', getCandidateChat)
router.post('/candidate/send', upload.single('file'), sendCandidateMessage)
router.get('/candidate/unread/count', getCandidateUnreadCount)

// Recruiter routes
router.get('/recruiter/:applicationId', getRecruiterChat)
router.post('/recruiter/send', sendRecruiterMessage)
router.get('/recruiter/unread/counts', getRecruiterUnreadCounts)

export default router
