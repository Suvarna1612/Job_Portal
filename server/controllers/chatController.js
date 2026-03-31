import Chat from '../models/Chat.js'
import JobApplication from '../models/JobApplication.js'
import { getAuth } from '@clerk/express'

// Get or create chat thread for an application (candidate)
export const getCandidateChat = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const { applicationId } = req.params

        const application = await JobApplication.findOne({ _id: applicationId, userId })
        if (!application) return res.json({ success: false, message: 'Application not found' })

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

// Send message as candidate
export const sendCandidateMessage = async (req, res) => {
    try {
        const { userId } = getAuth(req)
        const { applicationId, message, type = 'text' } = req.body

        const application = await JobApplication.findOne({ _id: applicationId, userId })
        if (!application) return res.json({ success: false, message: 'Application not found' })
        if (application.status !== 'Accepted') return res.json({ success: false, message: 'Chat not available' })

        let chat = await Chat.findOne({ applicationId })
        if (!chat) return res.json({ success: false, message: 'Chat thread not found' })

        chat.messages.push({ senderId: userId, senderRole: 'candidate', message, type })
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

// Send message as recruiter
export const sendRecruiterMessage = async (req, res) => {
    try {
        const { applicationId, message, type = 'text', recruiterId } = req.body

        const application = await JobApplication.findById(applicationId)
        if (!application) return res.json({ success: false, message: 'Application not found' })
        if (application.status !== 'Accepted') return res.json({ success: false, message: 'Chat not available' })

        let chat = await Chat.findOne({ applicationId })
        if (!chat) return res.json({ success: false, message: 'Chat thread not found' })

        chat.messages.push({ senderId: recruiterId, senderRole: 'recruiter', message, type })
        await chat.save()

        return res.json({ success: true, chat })
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
