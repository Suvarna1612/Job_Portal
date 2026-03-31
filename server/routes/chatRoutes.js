import express from 'express'
import {
    getCandidateChat,
    sendCandidateMessage,
    getRecruiterChat,
    sendRecruiterMessage,
    getCandidateUnreadCount
} from '../controllers/chatController.js'

const router = express.Router()

// Candidate routes
router.get('/candidate/:applicationId', getCandidateChat)
router.post('/candidate/send', sendCandidateMessage)
router.get('/candidate/unread/count', getCandidateUnreadCount)

// Recruiter routes
router.get('/recruiter/:applicationId', getRecruiterChat)
router.post('/recruiter/send', sendRecruiterMessage)

export default router
