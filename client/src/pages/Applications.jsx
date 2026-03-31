import React, { useContext, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import moment from 'moment'
import Footer from '../components/Footer'
import { AppContext } from '../context/AppContext'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import ChatPanel from '../components/ChatPanel'

const Applications = () => {
  const { user } = useUser()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const { userApplications, fetchUserApplications, backendUrl } = useContext(AppContext)
  const [openChatId, setOpenChatId] = useState(null)
  const [authToken, setAuthToken] = useState(null)

  useEffect(() => {
    if (user) {
      fetchUserApplications()
      getToken().then(setAuthToken)
    }
  }, [user])

  const toggleChat = (appId) => {
    setOpenChatId(prev => prev === appId ? null : appId)
  }

  return (
    <>
      <Navbar />
      <div className='container px-4 min-h-[65vh] 2xl:px-20 mx-auto my-10'>
        <h2 className='text-xl font-semibold mb-4'>Applied Jobs</h2>
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white border rounded-lg'>
            <thead>
              <tr>
                <th className='py-3 px-4 border-b text-left'>Company</th>
                <th className='py-3 px-4 border-b text-left'>Job Title</th>
                <th className='py-3 px-4 border-b text-left max-sm:hidden'>Location</th>
                <th className='py-3 px-4 border-b text-left max-sm:hidden'>Date</th>
                <th className='py-3 px-4 border-b text-left'>Status</th>
                <th className='py-3 px-4 border-b text-left'>Action</th>
              </tr>
            </thead>
            <tbody>
              {userApplications.map((job, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td className='py-3 px-4 flex items-center gap-2 border-b'>
                      <img className='w-8 h-8' src={job.companyId.image} alt='' />
                      {job.companyId.name}
                    </td>
                    <td className='px-4 py-2 border-b'>{job.jobId.title}</td>
                    <td className='px-4 py-2 border-b max-sm:hidden'>{job.jobId.location}</td>
                    <td className='px-4 py-2 border-b max-sm:hidden'>{moment(job.date).format('ll')}</td>
                    <td className='px-4 py-2 border-b'>
                      <span className={`${
                        job.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                        job.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-700'
                      } px-3 py-1 rounded-full text-xs font-semibold`}>
                        {job.status}
                      </span>
                    </td>
                    <td className='px-4 py-2 border-b'>
                      <div className='flex items-center gap-2'>
                        {job.status === 'Accepted' && (
                          <>
                            <button
                              onClick={() => navigate(`/prepare-interview/${job._id}`)}
                              className='bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-xs font-medium'
                            >
                              Prepare
                            </button>
                            <button
                              onClick={() => toggleChat(job._id)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                openChatId === job._id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600'
                              }`}
                            >
                              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                              </svg>
                              Chat
                            </button>
                          </>
                        )}
                        {job.status === 'Pending' && (
                          <span className='text-gray-400 text-xs'>Awaiting Response</span>
                        )}
                        {job.status === 'Rejected' && (
                          <span className='text-gray-400 text-xs'>Not Available</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* Chat Panel Row */}
                  {openChatId === job._id && (
                    <tr>
                      <td colSpan={6} className='px-4 py-3 bg-gray-50 border-b'>
                        <ChatPanel
                          applicationId={job._id}
                          role='candidate'
                          senderId={user?.id}
                          backendUrl={backendUrl}
                          authToken={authToken}
                          getToken={getToken}
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
      <Footer />
    </>
  )
}

export default Applications
