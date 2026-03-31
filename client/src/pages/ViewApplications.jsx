import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../components/Loading'
import ChatPanel from '../components/ChatPanel'

const ScoreBar = ({ value, color }) => (
  <div className='flex items-center gap-2'>
    <div className='w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden'>
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${value || 0}%` }}></div>
    </div>
    <span className='text-xs font-semibold text-gray-600 w-8'>{value || 0}%</span>
  </div>
)

const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext)
  const [applicants, setApplicants] = useState(false)
  const [filteredApplicants, setFilteredApplicants] = useState([])
  const [selectedJob, setSelectedJob] = useState('All')
  const [jobTitles, setJobTitles] = useState([])
  const [sortBy, setSortBy] = useState('date')
  const [openChatId, setOpenChatId] = useState(null)
  const [unreadCounts, setUnreadCounts] = useState({})

  const getViewableResumeUrl = (url) => {
    if (!url) return '#'
    return `${backendUrl}/api/company/resume-proxy?url=${encodeURIComponent(url)}`
  }

  const sortApplications = (apps, criteria) => {
    return [...apps].sort((a, b) => {
      switch (criteria) {
        case 'overall': return (b.matchAnalytics?.overallMatch || 0) - (a.matchAnalytics?.overallMatch || 0)
        case 'skills': return (b.matchAnalytics?.skillsMatch || 0) - (a.matchAnalytics?.skillsMatch || 0)
        case 'experience': return (b.matchAnalytics?.experienceMatch || 0) - (a.matchAnalytics?.experienceMatch || 0)
        case 'education': return (b.matchAnalytics?.educationMatch || 0) - (a.matchAnalytics?.educationMatch || 0)
        default: return b.date - a.date
      }
    })
  }

  const fetchCompanyJobApplications = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/company/applicants', {
        headers: { token: companyToken },
      })
      if (data.success) {
        const applications = data.applications.reverse()
        setApplicants(applications)
        setFilteredApplicants(sortApplications(applications, sortBy))
        const uniqueJobs = [...new Set(applications.filter(a => a.jobId).map(a => a.jobId.title))]
        setJobTitles(uniqueJobs)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleJobFilter = (jobTitle) => {
    setSelectedJob(jobTitle)
    const filtered = jobTitle === 'All'
      ? applicants
      : applicants.filter(a => a.jobId && a.jobId.title === jobTitle)
    setFilteredApplicants(sortApplications(filtered, sortBy))
  }

  const handleSortChange = (criteria) => {
    setSortBy(criteria)
    setFilteredApplicants(sortApplications(filteredApplicants, criteria))
  }

  const changeJobApplicationStatus = async (id, status) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/company/change-status',
        { id, status },
        { headers: { token: companyToken } }
      )
      if (data.success) fetchCompanyJobApplications()
      else toast.error(data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteApplication = async (id, candidateName) => {
    if (!window.confirm(`Delete application from ${candidateName}? This cannot be undone.`)) return
    try {
      const { data } = await axios.post(
        backendUrl + '/api/company/delete-application',
        { id },
        { headers: { token: companyToken } }
      )
      if (data.success) {
        toast.success(data.message)
        fetchCompanyJobApplications()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobApplications()
      // Fetch unread counts and poll every 15s
      fetchUnreadCounts()
      const interval = setInterval(fetchUnreadCounts, 15000)
      return () => clearInterval(interval)
    }
  }, [companyToken])

  const fetchUnreadCounts = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/chat/recruiter/unread/counts', {
        headers: { token: companyToken }
      })
      if (data.success) setUnreadCounts(data.counts)
    } catch (e) { /* silent */ }
  }

  if (!applicants) return <Loading />

  if (applicants.length === 0)
    return (
      <div className='flex flex-col items-center justify-center h-[60vh] gap-4'>
        <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center'>
          <svg className='w-8 h-8 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
        </div>
        <p className='text-gray-500 text-lg'>No applications yet</p>
      </div>
    )

  const pendingCount = applicants.filter(a => a.status === 'Pending').length
  const acceptedCount = applicants.filter(a => a.status === 'Accepted').length
  const rejectedCount = applicants.filter(a => a.status === 'Rejected').length
  const visible = filteredApplicants.filter(item => item.jobId && item.userId)

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Applications</h1>
        <p className='text-gray-500 text-sm mt-0.5'>Review and manage candidate applications</p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
        {[
          { label: 'Total', value: applicants.length, color: 'text-gray-800' },
          { label: 'Pending', value: pendingCount, color: 'text-yellow-500' },
          { label: 'Accepted', value: acceptedCount, color: 'text-green-600' },
          { label: 'Rejected', value: rejectedCount, color: 'text-red-500' },
        ].map((stat) => (
          <div key={stat.label} className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
            <p className='text-xs text-gray-500 uppercase tracking-wide'>{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap items-center gap-4'>
        <div className='flex items-center gap-2'>
          <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Job</label>
          <select
            value={selectedJob}
            onChange={(e) => handleJobFilter(e.target.value)}
            className='px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
          >
            <option value='All'>All Jobs ({applicants.length})</option>
            {jobTitles.map((title, i) => {
              const count = applicants.filter(a => a.jobId && a.jobId.title === title).length
              return <option key={i} value={title}>{title} ({count})</option>
            })}
          </select>
        </div>
        <div className='flex items-center gap-2'>
          <label className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Sort</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className='px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
          >
            <option value='date'>Application Date</option>
            <option value='overall'>Overall Match</option>
            <option value='skills'>Skills Match</option>
            <option value='experience'>Experience Match</option>
            <option value='education'>Education Match</option>
          </select>
        </div>
        {selectedJob !== 'All' && (
          <button onClick={() => handleJobFilter('All')} className='text-xs text-blue-600 hover:text-blue-800 underline'>
            Clear filter
          </button>
        )}
        <span className='ml-auto text-xs text-gray-400'>{visible.length} results</span>
      </div>

      {/* Table */}
      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 border-b border-gray-100'>
                {['#', 'Candidate', 'Job', 'Location', 'Match Analytics', 'Resume', 'Action', 'Chat'].map((h, i) => (
                  <th key={h} className={`py-3.5 px-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 2 || i === 3 ? 'max-sm:hidden' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {visible.map((applicant, index) => (
                <React.Fragment key={index}>
                <tr className='hover:bg-gray-50 transition-colors'>
                  <td className='py-4 px-5 text-gray-400 text-xs'>{index + 1}</td>
                  <td className='py-4 px-5'>
                    <div className='flex items-center gap-3'>
                      {applicant.userId.image ? (
                        <img className='w-9 h-9 rounded-full object-cover border border-gray-100 max-sm:hidden' src={applicant.userId.image} alt='' />
                      ) : (
                        <div className='w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center max-sm:hidden'>
                          <span className='text-blue-600 font-semibold text-sm'>{applicant.userId.name?.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className='font-medium text-gray-800'>{applicant.userId.name}</span>
                    </div>
                  </td>
                  <td className='py-4 px-5 max-sm:hidden'>
                    <span className='font-medium text-gray-700'>{applicant.jobId.title}</span>
                  </td>
                  <td className='py-4 px-5 max-sm:hidden'>
                    <span className='inline-flex items-center gap-1 text-gray-500 text-xs'>
                      <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                      </svg>
                      {applicant.jobId.location}
                    </span>
                  </td>
                  <td className='py-4 px-5'>
                    {applicant.matchAnalytics ? (
                      <div className='space-y-1.5 min-w-[170px]'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-500 w-10'>Overall</span>
                          <div className='flex items-center gap-2 flex-1'>
                            <div className='flex-1 bg-gray-100 rounded-full h-2 overflow-hidden'>
                              <div
                                className={`h-2 rounded-full ${
                                  applicant.matchAnalytics.overallMatch >= 80 ? 'bg-green-500' :
                                  applicant.matchAnalytics.overallMatch >= 60 ? 'bg-yellow-500' : 'bg-red-400'
                                }`}
                                style={{ width: `${applicant.matchAnalytics.overallMatch}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-bold w-8 ${
                              applicant.matchAnalytics.overallMatch >= 80 ? 'text-green-600' :
                              applicant.matchAnalytics.overallMatch >= 60 ? 'text-yellow-600' : 'text-red-500'
                            }`}>{applicant.matchAnalytics.overallMatch}%</span>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-400 w-10'>Skills</span>
                          <ScoreBar value={applicant.matchAnalytics.skillsMatch} color='bg-blue-500' />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-400 w-10'>Exp</span>
                          <ScoreBar value={applicant.matchAnalytics.experienceMatch} color='bg-purple-500' />
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-gray-400 w-10'>Edu</span>
                          <ScoreBar value={applicant.matchAnalytics.educationMatch} color='bg-orange-400' />
                        </div>
                      </div>
                    ) : (
                      <span className='text-xs text-gray-400 italic'>No data</span>
                    )}
                  </td>
                  <td className='py-4 px-5'>
                    <a
                      href={getViewableResumeUrl(applicant.userId.resume)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors'
                    >
                      <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                      </svg>
                      Resume
                    </a>
                  </td>
                  <td className='py-4 px-5'>
                    {applicant.status === 'Pending' ? (
                      <div className='relative inline-block group'>
                        <button className='w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors'>
                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24'>
                            <circle cx='5' cy='12' r='2'/><circle cx='12' cy='12' r='2'/><circle cx='19' cy='12' r='2'/>
                          </svg>
                        </button>
                        <div className='z-10 hidden absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg group-hover:block overflow-hidden'>
                          <button
                            onClick={() => changeJobApplicationStatus(applicant._id, 'Accepted')}
                            className='flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-green-600 hover:bg-green-50 transition-colors'
                          >
                            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                            </svg>
                            Accept
                          </button>
                          <button
                            onClick={() => changeJobApplicationStatus(applicant._id, 'Rejected')}
                            className='flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors'
                          >
                            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                            Reject
                          </button>
                          <div className='border-t border-gray-100'></div>
                          <button
                            onClick={() => deleteApplication(applicant._id, applicant.userId.name)}
                            className='flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors'
                          >
                            <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center gap-2'>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                          applicant.status === 'Accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${applicant.status === 'Accepted' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {applicant.status}
                        </span>
                        <button
                          onClick={() => deleteApplication(applicant._id, applicant.userId.name)}
                          className='w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors'
                          title='Delete'
                        >
                          <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                          </svg>
                        </button>
                      </div>
                    )}
                  </td>
                  {/* Chat button cell */}
                  <td className='py-4 px-5'>
                    {applicant.status === 'Accepted' ? (
                      <button
                        onClick={() => setOpenChatId(prev => prev === applicant._id ? null : applicant._id)}
                        className={`relative flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          openChatId === applicant._id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                        </svg>
                        Chat
                        {unreadCounts[applicant._id] > 0 && openChatId !== applicant._id && (
                          <span className='absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center'>
                            {unreadCounts[applicant._id] > 9 ? '9+' : unreadCounts[applicant._id]}
                          </span>
                        )}
                      </button>
                    ) : (
                      <span className='text-xs text-gray-300'>Locked</span>
                    )}
                  </td>
                </tr>
                {/* Chat Panel Row */}
                {openChatId === applicant._id && (
                  <tr>
                    <td colSpan={8} className='px-5 py-3 bg-gray-50 border-b'>
                      <ChatPanel
                        applicationId={applicant._id}
                        role='recruiter'
                        senderId={applicant.companyId?._id || applicant.companyId}
                        backendUrl={backendUrl}
                        companyToken={companyToken}
                        companyName={applicant.companyId?.name || ''}
                      />
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ViewApplications
