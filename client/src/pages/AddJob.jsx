import React, { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import { JobCategories, JobLocations } from '../assets/assets'
import axios from 'axios'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'

const AddJob = () => {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('Bangalore')
  const [category, setCategory] = useState('Programming')
  const [level, setLevel] = useState('Beginner level')
  const [salary, setSalary] = useState(0)
  const [expiryDate, setExpiryDate] = useState('')
  const [maxApplications, setMaxApplications] = useState('')
  const [useExpiryDate, setUseExpiryDate] = useState(false)
  const [useMaxApplications, setUseMaxApplications] = useState(false)
  const { backendUrl, companyToken } = useContext(AppContext)

  const editorRef = useRef(null)
  const quillRef = useRef(null)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const description = quillRef.current.root.innerHTML
      const jobData = { title, description, location, salary, category, level }
      if (useExpiryDate && expiryDate) jobData.expiryDate = expiryDate
      if (useMaxApplications && maxApplications) jobData.maxApplications = parseInt(maxApplications)

      const { data } = await axios.post(backendUrl + '/api/company/post-job', jobData, {
        headers: { token: companyToken },
      })
      if (data.success) {
        toast.success(data.message)
        setTitle('')
        setSalary(0)
        setExpiryDate('')
        setMaxApplications('')
        setUseExpiryDate(false)
        setUseMaxApplications(false)
        quillRef.current.root.innerHTML = ''
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, { theme: 'snow' })
    }
  }, [])

  return (
    <div className='max-w-3xl mx-auto'>
      {/* Page Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Post a New Job</h1>
        <p className='text-gray-500 text-sm mt-0.5'>Fill in the details to attract the right candidates</p>
      </div>

      <form onSubmit={onSubmitHandler} className='space-y-6'>
        {/* Job Title */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Job Title</label>
          <input
            type='text'
            placeholder='e.g. Senior Frontend Developer'
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            required
            className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
          />
        </div>

        {/* Job Description */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Job Description</label>
          <div
            ref={editorRef}
            className='rounded-xl border border-gray-200 overflow-hidden'
            style={{ minHeight: '160px' }}
          ></div>
        </div>

        {/* Category / Location / Level */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Category</label>
              <select
                className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'
                onChange={(e) => setCategory(e.target.value)}
              >
                {JobCategories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Location</label>
              <select
                className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'
                onChange={(e) => setLocation(e.target.value)}
              >
                {JobLocations.map((loc, i) => (
                  <option key={i} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-2'>Level</label>
              <select
                className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value='Beginner level'>Beginner</option>
                <option value='Intermediate level'>Intermediate</option>
                <option value='Senior level'>Senior</option>
              </select>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <label className='block text-sm font-semibold text-gray-700 mb-2'>Annual Salary (₹)</label>
          <div className='relative w-48'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium'>₹</span>
            <input
              min={0}
              className='w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
              onChange={(e) => setSalary(e.target.value)}
              type='number'
              placeholder='50000'
            />
          </div>
        </div>

        {/* Availability Settings */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <h3 className='text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2'>
            <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
            Availability Settings
            <span className='text-xs font-normal text-gray-400'>(Optional)</span>
          </h3>

          <div className='space-y-4'>
            {/* Expiry Date */}
            <div className='p-4 rounded-xl border border-gray-100 bg-gray-50'>
              <label className='flex items-center gap-3 cursor-pointer'>
                <div
                  onClick={() => setUseExpiryDate(!useExpiryDate)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${useExpiryDate ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useExpiryDate ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Set expiry date</p>
                  <p className='text-xs text-gray-400'>Job auto-hides after this date</p>
                </div>
              </label>
              {useExpiryDate && (
                <input
                  type='date'
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className='mt-3 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
                  required={useExpiryDate}
                />
              )}
            </div>

            {/* Max Applications */}
            <div className='p-4 rounded-xl border border-gray-100 bg-gray-50'>
              <label className='flex items-center gap-3 cursor-pointer'>
                <div
                  onClick={() => setUseMaxApplications(!useMaxApplications)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${useMaxApplications ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useMaxApplications ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Limit applications</p>
                  <p className='text-xs text-gray-400'>Job auto-hides after reaching this count</p>
                </div>
              </label>
              {useMaxApplications && (
                <input
                  type='number'
                  value={maxApplications}
                  onChange={(e) => setMaxApplications(e.target.value)}
                  min={1}
                  placeholder='e.g. 50'
                  className='mt-3 w-40 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
                  required={useMaxApplications}
                />
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type='submit'
          className='w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-blue-200'
        >
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          Post Job
        </button>
      </form>
    </div>
  )
}

export default AddJob
