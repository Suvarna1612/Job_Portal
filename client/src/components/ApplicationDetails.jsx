import React from 'react'
import moment from 'moment'

const ApplicationDetails = ({ application, onClose }) => {
  if (!application) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <h2 className='text-xl font-bold text-gray-800'>Application Details</h2>
            <p className='text-sm text-gray-500 mt-1'>
              Applied {moment(application.date).format('MMMM DD, YYYY')}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 p-2'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        <div className='p-6 space-y-6'>
          {/* Candidate Info */}
          <div className='bg-gray-50 rounded-lg p-4'>
            <h3 className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
              <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
              </svg>
              Candidate Information
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-600'>Name</p>
                <p className='font-medium'>{application.userId.name}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Email</p>
                <p className='font-medium'>{application.userId.email}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Status</p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  application.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                  application.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    application.status === 'Accepted' ? 'bg-green-500' :
                    application.status === 'Rejected' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></span>
                  {application.status}
                </span>
              </div>
              <div>
                <p className='text-sm text-gray-600'>Job Title</p>
                <p className='font-medium'>{application.jobId.title}</p>
              </div>
            </div>
          </div>

          {/* Match Analytics */}
          {application.matchAnalytics && (
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
                Match Analytics
              </h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div className={`text-2xl font-bold ${
                    application.matchAnalytics.overallMatch >= 80 ? 'text-green-600' :
                    application.matchAnalytics.overallMatch >= 60 ? 'text-yellow-600' : 'text-red-500'
                  }`}>
                    {application.matchAnalytics.overallMatch}%
                  </div>
                  <p className='text-xs text-gray-600'>Overall</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {application.matchAnalytics.skillsMatch}%
                  </div>
                  <p className='text-xs text-gray-600'>Skills</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {application.matchAnalytics.experienceMatch}%
                  </div>
                  <p className='text-xs text-gray-600'>Experience</p>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {application.matchAnalytics.educationMatch}%
                  </div>
                  <p className='text-xs text-gray-600'>Education</p>
                </div>
              </div>
            </div>
          )}

          {/* Custom Question Answers */}
          {application.customAnswers && application.customAnswers.length > 0 && (
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Application Questions & Answers
              </h3>
              <div className='space-y-4'>
                {application.customAnswers.map((qa, index) => (
                  <div key={index} className='bg-white border border-gray-200 rounded-lg p-4'>
                    <p className='font-medium text-gray-800 mb-2'>{qa.question}</p>
                    <p className='text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-500'>
                      {qa.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Link */}
          {application.userId.resume && (
            <div className='bg-gray-50 rounded-lg p-4'>
              <h3 className='font-semibold text-gray-800 mb-3 flex items-center gap-2'>
                <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                Resume
              </h3>
              <a
                href={application.userId.resume}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                </svg>
                View Resume
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end p-6 border-t border-gray-200'>
          <button
            onClick={onClose}
            className='bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ApplicationDetails