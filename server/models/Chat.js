import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ['candidate', 'recruiter'], required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'interview_invite', 'document_request', 'status_update'],
        default: 'text'
    },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now }
})

const chatSchema = new mongoose.Schema({
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication', required: true, unique: true },
    candidateId: { type: String, required: true },
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    messages: [messageSchema],
    isEnabled: { type: Boolean, default: false }
}, { timestamps: true })

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema)
export default Chat
