import React, { useState } from 'react'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useAuth } from '@clerk/clerk-react'

const ScoreRing = ({ score, label, color }) => {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className='flex flex-col items-center gap-1'>
      <svg width='72' height='72' viewBox='0 0 72 72'>
        <circle cx='36' cy='36' r={radius} fill='none' stroke='#e5e7eb' strokeWidth='6' />
        <circle
          cx='36' cy='36' r={radius} fill='none'
          stroke={color} strokeWidth='6'
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap='round'
          transform='rotate(-90 36 36)'
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x='36' y='40' textAnchor='middle' fontSize='14' fontWeight='700' fill='#1f2937'>{score}</text>
      </svg>
      <span className='text-xs text-gray-500 font-medium'>{label}</span>
    </div>
  )
}

const EnhanceResume = () => {
  const { backendUrl } = useContext(AppContext)
  const { getToken } = useAuth()

  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setResult(null)
    } else {
      toast.error('Please upload a PDF file')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const analyzeResume = async () => {
    if (!file) return toast.error('Please select a resume PDF')
    setLoading(true)
    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('resume', file)
      const { data } = await axios.post(backendUrl + '/api/users/enhance-resume', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (data.success) {
        setResult(data.analysis)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  const scoreColor = (s) => s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444'
  const scoreBg = (s) => s >= 80 ? 'bg-green-50 border-green-200 text-green-700' : s >= 60 ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-600'

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navbar />
      <div className='container mx-auto px-4 2xl:px-20 py-10 max-w-4xl'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <div className='inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-2xl mb-4'>
            <svg className='w-7 h-7 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
          </div>
          <h1 className='text-3xl font-bold text-gray-800'>Enhance Your Resume</h1>
          <p className='text-gray-500 mt-2'>Upload your resume and get an ATS score, detailed feedback, and rephrasing suggestions</p>
        </div>

        {/* Upload Card */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6'>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('resume-input').click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <input
              id='resume-input'
              type='file'
              accept='application/pdf'
              className='hidden'
              onChange={(e) => handleFile(e.target.files[0])}
            />
            {file ? (
              <div className='flex flex-col items-center gap-2'>
                <svg className='w-10 h-10 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                <p className='font-semibold text-green-700'>{file.name}</p>
                <p className='text-xs text-gray-400'>Click to change file</p>
              </div>
            ) : (
              <div className='flex flex-col items-center gap-2'>
                <svg className='w-10 h-10 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                </svg>
                <p className='text-gray-600 font-medium'>Drag & drop your resume here</p>
                <p className='text-sm text-gray-400'>or click to browse — PDF only</p>
              </div>
            )}
          </div>

          <button
            onClick={analyzeResume}
            disabled={!file || loading}
            className={`mt-4 w-full py-3 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
              !file || loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <svg className='animate-spin w-5 h-5' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z'></path>
                </svg>
                Analyzing Resume...
              </>
            ) : (
              <>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
                Analyze Resume
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className='space-y-6'>
            {/* ATS Score Banner */}
            <div className={`rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-6 ${scoreBg(result.atsScore)}`}>
              <div className='flex-shrink-0'>
                <ScoreRing score={result.atsScore} label='ATS Score' color={scoreColor(result.atsScore)} />
              </div>
              <div>
                <h2 className='text-xl font-bold'>
                  {result.atsScore >= 80 ? 'Great ATS Compatibility!' : result.atsScore >= 60 ? 'Moderate ATS Compatibility' : 'Low ATS Compatibility'}
                </h2>
                <p className='text-sm mt-1 opacity-80'>{result.atsSummary}</p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
              <h3 className='font-bold text-gray-800 mb-5'>Score Breakdown</h3>
              <div className='flex flex-wrap justify-around gap-6'>
                <ScoreRing score={result.scores.formatting} label='Formatting' color={scoreColor(result.scores.formatting)} />
                <ScoreRing score={result.scores.keywords} label='Keywords' color={scoreColor(result.scores.keywords)} />
                <ScoreRing score={result.scores.readability} label='Readability' color={scoreColor(result.scores.readability)} />
                <ScoreRing score={result.scores.impact} label='Impact' color={scoreColor(result.scores.impact)} />
              </div>
            </div>

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
                <h3 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
                  <span className='w-6 h-6 bg-green-100 rounded-full flex items-center justify-center'>
                    <svg className='w-3.5 h-3.5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  </span>
                  Strengths
                </h3>
                <ul className='space-y-2'>
                  {result.strengths.map((s, i) => (
                    <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                      <span className='text-green-500 mt-0.5'>✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {result.issues?.length > 0 && (
              <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
                <h3 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
                  <span className='w-6 h-6 bg-red-100 rounded-full flex items-center justify-center'>
                    <svg className='w-3.5 h-3.5 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </span>
                  Issues Found
                </h3>
                <ul className='space-y-2'>
                  {result.issues.map((issue, i) => (
                    <li key={i} className='flex items-start gap-2 text-sm text-gray-700'>
                      <span className='text-red-400 mt-0.5'>✗</span> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rephrasing Suggestions */}
            {result.rephrasingSuggestions?.length > 0 && (
              <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
                <h3 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
                  <span className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center'>
                    <svg className='w-3.5 h-3.5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                    </svg>
                  </span>
                  Rephrasing Suggestions
                </h3>
                <div className='space-y-4'>
                  {result.rephrasingSuggestions.map((item, i) => (
                    <div key={i} className='rounded-xl border border-gray-100 overflow-hidden'>
                      <div className='bg-red-50 px-4 py-3 border-b border-gray-100'>
                        <p className='text-xs font-semibold text-red-500 uppercase tracking-wide mb-1'>Original</p>
                        <p className='text-sm text-gray-700 italic'>"{item.original}"</p>
                      </div>
                      <div className='bg-green-50 px-4 py-3'>
                        <p className='text-xs font-semibold text-green-600 uppercase tracking-wide mb-1'>Suggested</p>
                        <p className='text-sm text-gray-700 font-medium'>"{item.improved}"</p>
                      </div>
                      {item.reason && (
                        <div className='bg-gray-50 px-4 py-2'>
                          <p className='text-xs text-gray-500'>{item.reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Tips */}
            {result.actionTips?.length > 0 && (
              <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
                <h3 className='font-bold text-gray-800 mb-4 flex items-center gap-2'>
                  <span className='w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center'>
                    <svg className='w-3.5 h-3.5 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                    </svg>
                  </span>
                  Quick Action Tips
                </h3>
                <ol className='space-y-2'>
                  {result.actionTips.map((tip, i) => (
                    <li key={i} className='flex items-start gap-3 text-sm text-gray-700'>
                      <span className='flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold'>{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

export default EnhanceResume
