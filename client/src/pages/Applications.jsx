import React, { useContext, useEffect } from 'react'
import { jobsApplied } from '../assets/assets'
import Navbar from '../components/Navbar'
import moment from 'moment'
import Footer from '../components/Footer'
import { AppContext } from '../context/AppContext'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const Applications = () => {

  const { user } = useUser()
  const navigate = useNavigate()

  const {userApplications, fetchUserApplications} = useContext(AppContext)

  useEffect(() => {
    if(user){
      fetchUserApplications()
    }
  },[user])

  return (
    <>
      <Navbar />
      <div className='container px-4 min-h-[65vh] 2xl:px-20 mx-auto my-10'>
        <h2 className='text-xl font-semibold mb-4'>Applied Jobs</h2>
        <table className='min-w-full bg-white border rounded-lg'>
          <thead>
            <tr>
              <th className='py-3 px-4 border-b text-left '>Company</th>
              <th className='py-3 px-4 border-b text-left '>Job Title</th>
              <th className='py-3 px-4 border-b text-left max-sm:hidden'>Location</th>
              <th className='py-3 px-4 border-b text-left max-sm:hidden'>Date</th>
              <th className='py-3 px-4 border-b text-left '>Status</th>
              <th className='py-3 px-4 border-b text-left '>Action</th>
            </tr>
          </thead>
          <tbody>
            {userApplications.map((job, index) => true ? (
              <tr key={index}>
                <td className='py-3 px-4 flex items-center gap-2 border-b'>
                  <img className='w-8 h-8' src={job.companyId.image} alt="" />
                  {job.companyId.name}
                </td>
                <td className='px-4 py-2 border-b'>{job.jobId.title}</td>
                <td className='px-4 py-2 border-b max-sm:hidden'>{job.jobId.location}</td>
                <td className='px-4 py-2 border-b max-sm:hidden'>{moment(job.date).format('ll')}</td>
                <td className='px-4 py-2 border-b'>
                  <span className={`${job.status === 'Accepted' ? 'bg-green-100' : job.status === 'Rejected' ? 'bg-red-100' : 'bg-blue-100'} px-4 py-1.5 rounded font-semibold`}>
                    {job.status}
                  </span>
                </td>
                <td className='px-4 py-2 border-b'>
                  <button
                    onClick={() => navigate(`/prepare-interview/${job._id}`)}
                    className='bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm'
                  >
                    Prepare Interview
                  </button>
                </td>
              </tr>
            ) : (null))}
          </tbody>
        </table>
      </div>
      <Footer />
    </>
  )
}

export default Applications
