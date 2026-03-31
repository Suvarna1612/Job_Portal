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

// role: 'candidate' | 'recruiter'
// senderId: userId (candidate) or companyId (recruiter)
// token: auth token (candidate uses Bearer, recruiter uses token header)
const ChatPanel = ({ applicationId, role, senderId, backendUrl, authToken, companyToken }) => {
    const [chat, setChat] = useState(null)
    const [locked, setLocked] = useState(false)
    const [input, setInput] = useState('')
    const [sending, setSending] = useState(false)
    const [loading, setLoading] = useState(true)
    const bottomRef = useRef(null)
    const pollRef = useRef(null)

    const fetchChat = async () => {
        try {
            const headers = role === 'candidate'
                ? { Authorization: `Bearer ${authToken}` }
                : { token: companyToken }

            const url = role === 'candidate'
                ? `${backendUrl}/api/chat/candidate/${applicationId}`
                : `${backendUrl}/api/chat/recruiter/${applicationId}`

            const { data } = await axios.get(url, { headers })
            if (data.success) {
                setChat(data.chat)
                setLocked(false)
            } else if (data.chatLocked) {
                setLocked(true)
            }
        } catch (e) {
            // silent poll failure
        }
        setLoading(false)
    }

    useEffect(() => {
        if (!applicationId) return
        fetchChat()
        pollRef.current = setInterval(fetchChat, 10000)
        return () => clearInterval(pollRef.current)
    }, [applicationId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chat?.messages?.length])

    const sendMessage = async (message, type = 'text') => {
        if (!message.trim()) return
        setSending(true)
        try {
            const url = role === 'candidate'
                ? `${backendUrl}/api/chat/candidate/send`
                : `${backendUrl}/api/chat/recruiter/send`

            const payload = role === 'candidate'
                ? { applicationId, message, type }
                : { applicationId, message, type, recruiterId: senderId }

            const headers = role === 'candidate'
                ? { Authorization: `Bearer ${authToken}` }
                : { token: companyToken }

            const { data } = await axios.post(url, payload, { headers })
            if (data.success) {
                setChat(data.chat)
                setInput('')
            } else {
                toast.error(data.message)
            }
        } catch (e) {
            toast.error('Failed to send message')
        }
        setSending(false)
    }

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
        <div className='flex flex-col h-[420px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
            {/* Header */}
            <div className='px-4 py-3 bg-blue-600 flex items-center gap-2'>
                <svg className='w-4 h-4 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                </svg>
                <span className='text-white text-sm font-semibold'>Application Chat</span>
                <span className='ml-auto text-xs text-blue-200'>Polls every 10s</span>
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
                            <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
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

            {/* Quick Replies */}
            <div className='px-3 py-2 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto'>
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
