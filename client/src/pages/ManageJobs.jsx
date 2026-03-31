import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import moment from 'moment'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../components/Loading'

const ManageJobs = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(false)
  const { backendUrl, companyToken } = useContext(AppContext)

  const fetchCompanyJobs = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/company/list-jobs', {
        headers: { token: companyToken },
      })
      if (data.success) {
        setJobs(data.jobsData.reverse())
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const changeJobVisibility = async (id) => {
    try {
      const { data } = await axios.post(
        backendUrl + '/api/company/change-visibility',
        { id },
        { headers: { token: companyToken } }
      )
      if (data.success) {
        toast.success(data.message)
        fetchCompanyJobs()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (companyToken) fetchCompanyJobs()
  }, [companyToken])

  if (!jobs) return <Loading />

  if (jobs.length === 0)
    return (
      <div className='flex flex-col items-center justify-center h-[60vh] gap-4'>
        <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center'>
          <svg className='w-8 h-8 text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
          </svg>
        </div>
        <p className='text-gray-500 text-lg'>No jobs posted yet</p>
        <button
          onClick={() => navigate('/dashboard/add-job')}
          className='bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium'
        >
          Post Your First Job
        </button>
      </div>
    )

  const activeCount = jobs.filter(j => j.visible && !(j.expiryDate && new Date(j.expiryDate) < new Date())).length
  const expiredCount = jobs.filter(j => j.expiryDate && new Date(j.expiryDate) < new Date()).length
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicationCount || 0), 0)

  return (
    <div className='max-w-6xl mx-auto'>
      {/* Page Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-800'>Manage Jobs</h1>
          <p className='text-gray-500 text-sm mt-0.5'>Track and manage your job postings</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/add-job')}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-blue-200'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          Add New Job
        </button>
      </div>

      {/* Stats Row */}
      <div className='grid grid-cols-3 gap-4 mb-6'>
        <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
          <p className='text-xs text-gray-500 uppercase tracking-wide'>Total Jobs</p>
          <p className='text-3xl font-bold text-gray-800 mt-1'>{jobs.length}</p>
        </div>
        <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
          <p className='text-xs text-gray-500 uppercase tracking-wide'>Active</p>
          <p className='text-3xl font-bold text-green-600 mt-1'>{activeCount}</p>
        </div>
        <div className='bg-white rounded-2xl p-4 border border-gray-100 shadow-sm'>
          <p className='text-xs text-gray-500 uppercase tracking-wide'>Total Applicants</p>
          <p className='text-3xl font-bold text-blue-600 mt-1'>{totalApplicants}</p>
        </div>
      </div>

      {/* Jobs Table */}
      <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 border-b border-gray-100'>
                <th className='py-3.5 px-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide max-sm:hidden'>#</th>
                <th className='py-3.5 px-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide'>Job Title</th>
                <th className='py-3.5 px-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide max-sm:hidden'>Posted</th>
                <th className='py-3.5 px-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide max-sm:hidden'>Location</th>
                <th className='py-3.5 px-5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide'>Applicants</th>
                <th className='py-3.5 px-5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide max-sm:hidden'>Status</th>
                <th className='py-3.5 px-5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide'>Visible</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-50'>
              {jobs.map((job, index) => {
                const isExpired = job.expiryDate && new Date(job.expiryDate) < new Date()
                const isMaxReached = job.maxApplications && job.applicationCount >= job.maxApplications

                return (
                  <tr key={index} className='hover:bg-gray-50 transition-colors group'>
                    <td className='py-4 px-5 text-gray-400 max-sm:hidden'>{index + 1}</td>
                    <td className='py-4 px-5'>
                      <span className='font-semibold text-gray-800 group-hover:text-blue-600 transition-colors'>
                        {job.title}
                      </span>
                    </td>
                    <td className='py-4 px-5 text-gray-500 max-sm:hidden'>{moment(job.date).format('MMM D, YYYY')}</td>
                    <td className='py-4 px-5 max-sm:hidden'>
                      <span className='inline-flex items-center gap-1 text-gray-600'>
                        <svg className='w-3.5 h-3.5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                        </svg>
                        {job.location}
                      </span>
                    </td>
                    <td className='py-4 px-5 text-center'>
                      <span className='inline-flex items-center justify-center bg-blue-50 text-blue-700 font-semibold text-xs px-3 py-1 rounded-full'>
                        {job.applicationCount || 0}
                        {job.maxApplications && <span className='text-blue-400 font-normal'>/{job.maxApplications}</span>}
                      </span>
                    </td>
                    <td className='py-4 px-5 max-sm:hidden'>
                      {isExpired ? (
                        <span className='inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 rounded-full'>
                          <span className='w-1.5 h-1.5 bg-red-500 rounded-full'></span>Expired
                        </span>
                      ) : isMaxReached ? (
                        <span className='inline-flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full'>
                          <span className='w-1.5 h-1.5 bg-orange-500 rounded-full'></span>Limit Reached
                        </span>
                      ) : job.expiryDate ? (
                        <span className='inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full'>
                          <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
                          Expires {moment(job.expiryDate).format('MMM D')}
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full'>
                          <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>Active
                        </span>
                      )}
                    </td>
                    <td className='py-4 px-5 text-center'>
                      <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          className='sr-only peer'
                          checked={job.visible}
                          onChange={() => changeJobVisibility(job._id)}
                          disabled={isExpired || isMaxReached}
                        />
                        <div className={`w-9 h-5 rounded-full peer transition-colors ${
                          isExpired || isMaxReached
                            ? 'bg-gray-200 cursor-not-allowed'
                            : 'bg-gray-200 peer-checked:bg-blue-600'
                        } peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all`}></div>
                      </label>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ManageJobs
