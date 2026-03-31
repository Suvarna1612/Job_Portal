import Chat from '../models/Chat.js'
import JobApplication from '../models/JobApplication.js'
import User from '../models/User.js'
import { getAuth } from '@clerk/express'
import { v2 as cloudinary } from 'cloudinary'
import { sendChatMessageNotification } from '../utils/sendEmail.js'

// Get or create chat thread for an application (candidate)
export const getCandidateChat = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const { applicationId } = req.params

        // Find application - check userId matches
        const application = await JobApplication.findById(applicationId)
            .populate('companyId', 'name')
        if (!application) return res.json({ success: false, message: 'Application not found', chatLocked: true })
        if (application.userId !== userId) return res.json({ success: false, message: 'Unauthorized', chatLocked: true })

        if (application.status !== 'Accepted') {
            return res.json({ success: false, message: 'Chat is only available after your application is accepted.', chatLocked: true })
        }

        let chat = await Chat.findOne({ applicationId })
        if (!chat) {
            chat = await Chat.create({
                applicationId,
                candidateId: userId,
                recruiterId: application.companyId,
                isEnabled: true,
                messages: []
            })
        }

        // Mark recruiter messages as read
        await Chat.updateOne(
            { applicationId },
            { $set: { 'messages.$[msg].read': true } },
            { arrayFilters: [{ 'msg.senderRole': 'recruiter', 'msg.read': false }] }
        )

        const updatedChat = await Chat.findOne({ applicationId })
        return res.json({ success: true, chat: updatedChat })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Send message as candidate (supports file upload)
export const sendCandidateMessage = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const { applicationId, message, type = 'text' } = req.body

        const application = await JobApplication.findOne({ _id: applicationId, userId })
        if (!application) return res.json({ success: false, message: 'Application not found', chatLocked: true })
        if (application.status !== 'Accepted') return res.json({ success: false, message: 'Chat not available', chatLocked: true })

        let chat = await Chat.findOne({ applicationId })
        if (!chat) return res.json({ success: false, message: 'Chat thread not found' })

        let fileUrl = null
        let fileName = null

        // Handle file upload to Cloudinary
        if (req.file) {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                resource_type: 'raw',
                folder: 'chat_documents',
                public_id: `doc_${userId}_${Date.now()}`,
                access_mode: 'public'
            })
            fileUrl = uploadResult.secure_url
            fileName = req.file.originalname
        }

        const msgText = message || (fileName ? `📎 Sent document: ${fileName}` : '')
        if (!msgText) return res.json({ success: false, message: 'Message or file required' })

        chat.messages.push({
            senderId: userId,
            senderRole: 'candidate',
            message: msgText,
            type: req.file ? 'document_request' : type,
            fileUrl,
            fileName
        })
        await chat.save()

        return res.json({ success: true, chat })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get chat thread for recruiter
export const getRecruiterChat = async (req, res) => {
    try {
        const { applicationId } = req.params

        const application = await JobApplication.findById(applicationId)
        if (!application) return res.json({ success: false, message: 'Application not found' })

        if (application.status !== 'Accepted') {
            return res.json({ success: false, message: 'Chat is only available for accepted applications.', chatLocked: true })
        }

        let chat = await Chat.findOne({ applicationId })
        if (!chat) {
            chat = await Chat.create({
                applicationId,
                candidateId: application.userId,
                recruiterId: application.companyId,
                isEnabled: true,
                messages: []
            })
        }

        // Mark candidate messages as read
        await Chat.updateOne(
            { applicationId },
            { $set: { 'messages.$[msg].read': true } },
            { arrayFilters: [{ 'msg.senderRole': 'candidate', 'msg.read': false }] }
        )

        const updatedChat = await Chat.findOne({ applicationId })
        return res.json({ success: true, chat: updatedChat })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Send message as recruiter — triggers email to candidate
export const sendRecruiterMessage = async (req, res) => {
    try {
        const { applicationId, message, type = 'text', recruiterId, companyName } = req.body

        const application = await JobApplication.findById(applicationId)
        if (!application) return res.json({ success: false, message: 'Application not found' })
        if (application.status !== 'Accepted') return res.json({ success: false, message: 'Chat not available' })

        let chat = await Chat.findOne({ applicationId })
        if (!chat) return res.json({ success: false, message: 'Chat thread not found' })

        chat.messages.push({ senderId: recruiterId, senderRole: 'recruiter', message, type })
        await chat.save()

        // Send email notification to candidate
        try {
            const candidate = await User.findById(application.userId)
            if (candidate?.email) {
                const appUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/applications`
                await sendChatMessageNotification(
                    candidate.email,
                    candidate.name,
                    companyName || 'The recruiter',
                    message.length > 100 ? message.slice(0, 100) + '...' : message,
                    appUrl
                )
            }
        } catch (emailErr) {
            console.error('Chat email notification failed:', emailErr.message)
        }

        return res.json({ success: true, chat })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get unread counts for all accepted applications (recruiter)
export const getRecruiterUnreadCounts = async (req, res) => {
    try {
        const chats = await Chat.find({})
        const counts = {}
        chats.forEach(chat => {
            const unread = chat.messages.filter(m => m.senderRole === 'candidate' && !m.read).length
            if (unread > 0) counts[chat.applicationId.toString()] = unread
        })
        return res.json({ success: true, counts })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get unread count for candidate
export const getCandidateUnreadCount = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const chats = await Chat.find({ candidateId: userId })
        const unread = chats.reduce((sum, chat) => {
            return sum + chat.messages.filter(m => m.senderRole === 'recruiter' && !m.read).length
        }, 0)
        return res.json({ success: true, unread })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
