import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import moment from 'moment'

const CANDIDATE_QUICK = [
    { label: 'Request interview details', message: 'Could you please share the interview details?', type: 'text' },
    { label: 'Ask about the role', message: 'I would like to know more about the day-to-day responsibilities of this role.', type: 'text' },
    { label: 'Clarify requirements', message: 'Could you clarify the key requirements or skills needed for this position?', type: 'text' },
    { label: 'Confirm availability', message: 'I am available and looking forward to the next steps.', type: 'text' },
]

const RECRUITER_QUICK = [
    { label: 'Schedule interview', message: 'We would like to schedule an interview with you. Please share your availability.', type: 'interview_invite' },
    { label: 'Request documents', message: 'Please upload your updated resume and any relevant certificates.', type: 'document_request' },
    { label: 'Share offer details', message: 'We are pleased to move forward. We will share the offer details shortly.', type: 'status_update' },
    { label: 'Request references', message: 'Could you please provide 2-3 professional references?', type: 'text' },
]

const typeIcon = (type) => {
    switch (type) {
        case 'interview_invite': return '📅'
        case 'document_request': return '📎'
        case 'status_update': return '🔔'
        default: return null
    }
}

const typeBadge = (type) => {
    switch (type) {
        case 'interview_invite': return 'bg-blue-100 text-blue-700'
        case 'document_request': return 'bg-orange-100 text-orange-700'
        case 'status_update': return 'bg-green-100 text-green-700'
        default: return null
    }
}

const typeLabel = (type) => {
    switch (type) {
        case 'interview_invite': return 'Interview Invite'
        case 'document_request': return 'Document Request'
        case 'status_update': return 'Status Update'
        default: return null
    }
}

const ChatPanel = ({ applicationId, role, senderId, backendUrl, authToken, companyToken, companyName, getToken }) => {
    const [chat, setChat] = useState(null)
    const [locked, setLocked] = useState(false)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const [selectedFile, setSelectedFile] = useState(null)
    const [showCustomText, setShowCustomText] = useState(false)
    const [customText, setCustomText] = useState('')
    const fileInputRef = useRef(null)
    const bottomRef = useRef(null)
    const pollRef = useRef(null)
    const initialLoadDone = useRef(false)

    const fetchChat = async (isInitial = false) => {
        try {
            // Always get a fresh token for candidate to avoid stale token issues
            let token = authToken
            if (role === 'candidate' && getToken) {
                try { token = await getToken() } catch (e) { /* use existing */ }
            }
            const headers = role === 'candidate'
                ? { Authorization: `Bearer ${token}` }
                : { token: companyToken }
            const url = role === 'candidate'
                ? `${backendUrl}/api/chat/candidate/${applicationId}`
                : `${backendUrl}/api/chat/recruiter/${applicationId}`
            const { data } = await axios.get(url, { headers })
            if (data.success) {
                setChat(data.chat)
                // Only unlock if we were locked — never re-lock during polling
                if (isInitial) setLocked(false)
            } else if (data.chatLocked && isInitial) {
                // Only show locked state on initial load, not on background polls
                setLocked(true)
            }
        } catch (e) { /* silent */ }
        if (isInitial) setLoading(false)
    }

    useEffect(() => {
        if (!applicationId) return
        fetchChat(true)
        pollRef.current = setInterval(() => fetchChat(false), 10000)
        return () => clearInterval(pollRef.current)
    }, [applicationId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chat?.messages?.length])

    const sendMessage = async (message, type = 'text', file = null) => {
        if (!message?.trim() && !file) return
        setSending(true)
        try {
            // Always get fresh token for candidate
            let token = authToken
            if (role === 'candidate' && getToken) {
                try { token = await getToken() } catch (e) { /* use existing */ }
            }
            const headers = role === 'candidate'
                ? { Authorization: `Bearer ${token}` }
                : { token: companyToken }

            let payload, config

            if (role === 'candidate' && file) {
                // Use FormData for file upload
                const formData = new FormData()
                formData.append('applicationId', applicationId)
                formData.append('message', message || '')
                formData.append('type', type)
                formData.append('file', file)
                payload = formData
                config = { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
            } else {
                payload = role === 'candidate'
                    ? { applicationId, message, type }
                    : { applicationId, message, type, recruiterId: senderId, companyName }
                config = { headers }
            }

            const url = role === 'candidate'
                ? `${backendUrl}/api/chat/candidate/send`
                : `${backendUrl}/api/chat/recruiter/send`

            const { data } = await axios.post(url, payload, config)
            if (data.success) {
                setChat(data.chat)
                setInput('')
                setSelectedFile(null)
            } else if (data.chatLocked) {
                setLocked(true)
            } else {
                toast.error(data.message)
            }
        } catch (e) {
            toast.error('Failed to send message')
        }
        setSending(false)
    }

    // Check if last recruiter message was a document request
    const lastRecruiterMsg = chat?.messages?.filter(m => m.senderRole === 'recruiter').slice(-1)[0]
    const showUploadPrompt = role === 'candidate' && lastRecruiterMsg?.type === 'document_request'

    if (loading) return (
        <div className='flex items-center justify-center h-40'>
            <div className='w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        </div>
    )

    if (locked) return (
        <div className='flex flex-col items-center justify-center h-40 gap-2 text-center px-4'>
            <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' />
                </svg>
            </div>
            <p className='text-sm text-gray-500'>
                {role === 'candidate'
                    ? 'Chat unlocks once your application is accepted'
                    : 'Chat is available for accepted applications only'}
            </p>
        </div>
    )

    const quickReplies = role === 'candidate' ? CANDIDATE_QUICK : RECRUITER_QUICK

    return (
        <div className='flex flex-col h-[440px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
            {/* Header */}
            <div className='px-4 py-3 bg-blue-600 flex items-center gap-2'>
                <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                </svg>
                <span className='text-white text-sm font-semibold'>Application Chat</span>
                <span className='ml-auto text-xs text-blue-200'>Please be respectful and don't spam</span>
            </div>

            {/* Messages */}
            <div className='flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50'>
                {chat?.messages?.length === 0 && (
                    <div className='text-center text-xs text-gray-400 mt-8'>
                        No messages yet. Use a quick reply or type below.
                    </div>
                )}
                {chat?.messages?.map((msg, i) => {
                    const isMe = msg.senderRole === role
                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                                {typeLabel(msg.type) && (
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge(msg.type)}`}>
                                        {typeIcon(msg.type)} {typeLabel(msg.type)}
                                    </span>
                                )}
                                <div className={`px-3 py-2 rounded-2xl text-sm ${
                                    isMe
                                        ? 'bg-blue-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                                }`}>
                                    {msg.message}
                                    {/* File attachment */}
                                    {msg.fileUrl && (
                                        <a
                                            href={msg.fileUrl}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className={`flex items-center gap-1.5 mt-2 text-xs underline ${isMe ? 'text-blue-100' : 'text-blue-600'}`}
                                        >
                                            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' />
                                            </svg>
                                            {msg.fileName || 'View attachment'}
                                        </a>
                                    )}
                                </div>
                                <div className='flex items-center gap-1'>
                                    <span className='text-[10px] text-gray-400'>{moment(msg.timestamp).fromNow()}</span>
                                    {isMe && (
                                        <span className={`text-[10px] ${msg.read ? 'text-blue-400' : 'text-gray-300'}`}>
                                            {msg.read ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {/* Document upload prompt — shown to candidate when recruiter requests docs */}
            {showUploadPrompt && (
                <div className='px-3 py-2 bg-orange-50 border-t border-orange-100 flex items-center gap-2'>
                    <svg className='w-4 h-4 text-orange-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' />
                    </svg>
                    <span className='text-xs text-orange-700 flex-1'>Recruiter requested documents</span>
                    <input
                        ref={fileInputRef}
                        type='file'
                        className='hidden'
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                    />
                    {selectedFile ? (
                        <div className='flex items-center gap-2'>
                            <span className='text-xs text-gray-600 max-w-[120px] truncate'>{selectedFile.name}</span>
                            <button
                                onClick={() => sendMessage('', 'document_request', selectedFile)}
                                disabled={sending}
                                className='text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg transition-colors'
                            >
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                            <button onClick={() => setSelectedFile(null)} className='text-gray-400 hover:text-gray-600 text-xs'>✕</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className='text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg transition-colors font-medium'
                        >
                            Upload File
                        </button>
                    )}
                </div>
            )}

            {/* Quick Replies */}
            <div className='px-3 py-2 border-t border-gray-100 bg-white'>
                {/* Quick Reply Buttons */}
                <div className='flex gap-1.5 overflow-x-auto'>
                    {/* Custom Text Button - First */}
                    <button
                        onClick={() => setShowCustomText(true)}
                        disabled={sending || showCustomText}
                        className='flex-shrink-0 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap font-medium'
                    >
                        ✏️ Custom Text
                    </button>
                    
                    {/* Predefined Quick Replies */}
                    {quickReplies.map((q, i) => (
                        <button
                            key={i}
                            onClick={() => sendMessage(q.message, q.type)}
                            disabled={sending}
                            className='flex-shrink-0 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap'
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
                
                {/* Custom Text Input Area */}
                {showCustomText && (
                    <div className='mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200'>
                        <div className='flex items-center justify-between mb-2'>
                            <span className='text-xs font-medium text-gray-700'>Custom Message</span>
                            <button
                                onClick={() => {
                                    setShowCustomText(false)
                                    setCustomText('')
                                }}
                                className='text-gray-400 hover:text-gray-600 text-sm'
                            >
                                ✕
                            </button>
                        </div>
                        <textarea
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder='Type your custom message here...'
                            className='w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
                            rows={3}
                        />
                        <div className='flex gap-2 mt-2'>
                            <button
                                onClick={() => {
                                    if (customText.trim()) {
                                        sendMessage(customText, 'text')
                                        setCustomText('')
                                        setShowCustomText(false)
                                    }
                                }}
                                disabled={sending || !customText.trim()}
                                className='text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors'
                            >
                                {sending ? 'Sending...' : 'Send Message'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCustomText(false)
                                    setCustomText('')
                                }}
                                className='text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className='px-3 py-2 border-t border-gray-100 bg-white flex gap-2'>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                    placeholder='Type a message...'
                    className='flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <button
                    onClick={() => sendMessage(input)}
                    disabled={sending || !input.trim()}
                    className='bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white px-4 py-2 rounded-xl transition-colors'
                >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 19l9 2-9-18-9 18 9-2zm0 0v-8' />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default ChatPanel
