import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../components/Loading'
import { useAuth } from '@clerk/clerk-react'

const PrepareInterview = () => {
  const { id } = useParams() // job application id
  const { backendUrl } = useContext(AppContext)
  const { getToken } = useAuth()
  const navigate = useNavigate()

  const [jobData, setJobData] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState(null)

  // Fetch job details
  const fetchJobDetails = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(
        `${backendUrl}/api/users/application/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setJobData(data.application.jobId)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Start interview preparation
  const startInterview = async () => {
    setIsLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/users/generate-question`,
        { jobId: jobData._id, questionNumber: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setCurrentQuestion(data.question)
        setQuestionNumber(1)
        setSessionStarted(true)
        setFeedback(null)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setIsLoading(false)
  }

  // Submit answer for evaluation
  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      return toast.error('Please provide an answer')
    }

    setIsLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/users/evaluate-answer`,
        {
          jobId: jobData._id,
          question: currentQuestion,
          answer: userAnswer,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setFeedback(data.evaluation)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setIsLoading(false)
  }

  // Get next question
  const nextQuestion = async () => {
    setIsLoading(true)
    setUserAnswer('')
    setFeedback(null)

    try {
      const token = await getToken()
      const { data } = await axios.post(
        `${backendUrl}/api/users/generate-question`,
        { jobId: jobData._id, questionNumber: questionNumber + 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setCurrentQuestion(data.question)
        setQuestionNumber(questionNumber + 1)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchJobDetails()
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setUserAnswer(prev => prev + finalTranscript)
        }
      }
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access to use voice input.')
        } else {
          toast.error('Speech recognition error. Please try again.')
        }
      }
      
      recognitionInstance.onend = () => {
        setIsRecording(false)
      }
      
      setRecognition(recognitionInstance)
    }
  }, [id])

  // Start voice recording
  const startRecording = () => {
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser')
      return
    }
    
    try {
      recognition.start()
      setIsRecording(true)
      toast.info('Listening... Speak your answer')
    } catch (error) {
      console.error('Error starting recognition:', error)
      toast.error('Could not start voice recording')
    }
  }

  // Stop voice recording
  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop()
      setIsRecording(false)
      toast.success('Voice recording stopped')
    }
  }

  // Clear answer
  const clearAnswer = () => {
    setUserAnswer('')
    if (isRecording) {
      stopRecording()
    }
  }

  if (!jobData) {
    return <Loading />
  }

  return (
    <>
      <Navbar />
      <div className='container px-4 min-h-[70vh] 2xl:px-20 mx-auto my-10'>
        <div className='max-w-4xl mx-auto'>
          {/* Header */}
          <div className='mb-8'>
            <button
              onClick={() => navigate('/applications')}
              className='text-blue-600 hover:underline mb-4'
            >
              ← Back to Applications
            </button>
            <h1 className='text-3xl font-bold mb-2'>Interview Preparation</h1>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h2 className='text-xl font-semibold'>{jobData.title}</h2>
              <p className='text-gray-600'>
                {jobData.companyId?.name} • {jobData.location}
              </p>
            </div>
          </div>

          {/* Interview Session */}
          {!sessionStarted ? (
            <div className='bg-white border rounded-lg p-8 text-center'>
              <h3 className='text-2xl font-semibold mb-4'>
                Ready to Practice?
              </h3>
              <p className='text-gray-600 mb-6'>
                Get AI-powered interview questions based on the job description.
                Answer them and receive instant feedback to improve your skills.
              </p>
              <button
                onClick={startInterview}
                disabled={isLoading}
                className='bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400'
              >
                {isLoading ? 'Loading...' : 'Start Practice Session'}
              </button>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Question Card */}
              <div className='bg-white border rounded-lg p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-lg font-semibold text-gray-700'>
                    Question {questionNumber}
                  </h3>
                </div>
                <p className='text-lg text-gray-800 mb-6'>{currentQuestion}</p>

                {/* Answer Input */}
                {!feedback && (
                  <div>
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Your Answer (Type or Speak):
                      </label>
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder='Type your answer here or use the microphone button to speak...'
                        className='w-full border-2 border-gray-300 rounded-lg p-4 min-h-[150px] focus:outline-none focus:border-blue-500'
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* Voice Controls */}
                    <div className='flex flex-wrap gap-3 mb-4'>
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          disabled={isLoading}
                          className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2'
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                          Start Speaking
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 animate-pulse'
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                          </svg>
                          Stop Recording
                        </button>
                      )}
                      
                      {userAnswer && (
                        <button
                          type="button"
                          onClick={clearAnswer}
                          disabled={isLoading}
                          className='border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:bg-gray-100'
                        >
                          Clear Answer
                        </button>
                      )}
                    </div>

                    {isRecording && (
                      <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          <div className='w-3 h-3 bg-red-500 rounded-full animate-pulse'></div>
                          <span className='text-green-800 font-medium'>Recording... Speak clearly</span>
                        </div>
                        <p className='text-sm text-green-600 mt-1'>
                          Your speech will be automatically added to the text area above
                        </p>
                      </div>
                    )}

                    <button
                      onClick={submitAnswer}
                      disabled={isLoading || !userAnswer.trim()}
                      className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400'
                    >
                      {isLoading ? 'Evaluating...' : 'Submit Answer'}
                    </button>
                  </div>
                )}
              </div>

              {/* Feedback Card */}
              {feedback && (
                <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
                  <h3 className='text-lg font-semibold text-green-800 mb-4'>
                    Evaluation & Feedback
                  </h3>
                  
                  <div className='mb-4'>
                    <span className='text-sm font-medium text-gray-700'>Your Answer:</span>
                    <p className='text-gray-600 mt-1 bg-white p-3 rounded border'>{userAnswer}</p>
                  </div>

                  <div className='mb-4'>
                    <span className='text-sm font-medium text-gray-700'>Score:</span>
                    <p className='text-2xl font-bold text-green-600 mt-1'>
                      {feedback.score}/10
                    </p>
                  </div>

                  <div className='mb-4'>
                    <span className='text-sm font-medium text-gray-700'>Feedback:</span>
                    <p className='text-gray-700 mt-1 whitespace-pre-line'>{feedback.feedback}</p>
                  </div>

                  {feedback.suggestions && (
                    <div className='mb-4'>
                      <span className='text-sm font-medium text-gray-700'>Suggestions:</span>
                      <p className='text-gray-700 mt-1 whitespace-pre-line'>{feedback.suggestions}</p>
                    </div>
                  )}

                  <div className='flex gap-3 mt-6'>
                    <button
                      onClick={nextQuestion}
                      disabled={isLoading}
                      className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400'
                    >
                      {isLoading ? 'Loading...' : 'Next Question'}
                    </button>
                    <button
                      onClick={() => navigate('/applications')}
                      className='border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50'
                    >
                      End Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default PrepareInterview
