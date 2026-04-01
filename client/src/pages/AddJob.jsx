import React, { useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import { JobCategories, JobLocations } from '../assets/assets'
import axios from 'axios'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { toast } from 'react-toastify'

const AddJob = () => {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState(['Bangalore'])
  const [category, setCategory] = useState('Programming')
  const [level, setLevel] = useState('Beginner level')
  const [salary, setSalary] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [maxApplications, setMaxApplications] = useState('')
  const [useExpiryDate, setUseExpiryDate] = useState(false)
  const [useMaxApplications, setUseMaxApplications] = useState(false)
  const [customQuestions, setCustomQuestions] = useState([])
  const { backendUrl, companyToken } = useContext(AppContext)

  const editorRef = useRef(null)
  const quillRef = useRef(null)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const description = quillRef.current.root.innerHTML
      const jobData = { title, description, location: location.join(', '), salary, category, level, customQuestions }
      if (useExpiryDate && expiryDate) jobData.expiryDate = expiryDate
      if (useMaxApplications && maxApplications) jobData.maxApplications = parseInt(maxApplications)

      const { data } = await axios.post(backendUrl + '/api/company/post-job', jobData, {
        headers: { token: companyToken },
      })
      if (data.success) {
        toast.success(data.message)
        setTitle('')
        setSalary('')
        setExpiryDate('')
        setMaxApplications('')
        setUseExpiryDate(false)
        setUseMaxApplications(false)
        setCustomQuestions([])
        quillRef.current.root.innerHTML = ''
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const addCustomQuestion = () => {
    setCustomQuestions([...customQuestions, {
      question: '',
      required: true,
      type: 'text',
      options: []
    }])
  }

  const updateCustomQuestion = (index, field, value) => {
    const updated = [...customQuestions]
    updated[index][field] = value
    setCustomQuestions(updated)
  }

  const removeCustomQuestion = (index) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index))
  }

  const addOption = (questionIndex) => {
    const updated = [...customQuestions]
    updated[questionIndex].options.push('')
    setCustomQuestions(updated)
  }

  const updateOption = (questionIndex, optionIndex, value) => {
    const updated = [...customQuestions]
    updated[questionIndex].options[optionIndex] = value
    setCustomQuestions(updated)
  }

  const removeOption = (questionIndex, optionIndex) => {
    const updated = [...customQuestions]
    updated[questionIndex].options.splice(optionIndex, 1)
    setCustomQuestions(updated)
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
        <h1 className='text-3xl font-bold text-gray-800'>Post a New Job</h1>
        <p className='text-gray-600 text-base mt-1'>Fill in the details to attract the right candidates</p>
      </div>

      <form onSubmit={onSubmitHandler} className='space-y-6'>
        {/* Job Title */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <label className='block text-base font-semibold text-gray-800 mb-3'>Job Title</label>
          <input
            type='text'
            placeholder='e.g. Senior Frontend Developer'
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            required
            className='w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
          />
        </div>

        {/* Job Description */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <label className='block text-base font-semibold text-gray-800 mb-3'>Job Description</label>
          <div
            ref={editorRef}
            className='rounded-xl border border-gray-200 overflow-hidden'
            style={{ minHeight: '180px' }}
          ></div>
        </div>

        {/* Category / Location / Level */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div>
              <label className='block text-base font-semibold text-gray-800 mb-3'>Category</label>
              <select
                className='w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'
                onChange={(e) => setCategory(e.target.value)}
              >
                {JobCategories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='block text-base font-semibold text-gray-800 mb-3'>Location</label>
              <div className='flex flex-wrap gap-2 text-sm'>
                {JobLocations.map((loc, i) => {
                  const isSelected = location.includes(loc);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setLocation(prev => {
                          if (prev.includes(loc)) {
                            return prev.filter(l => l !== loc);
                          } else {
                            return [...prev, loc];
                          }
                        });
                      }}
                      className={`px-3 py-1.5 border rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className='block text-base font-semibold text-gray-800 mb-3'>Level</label>
              <select
                className='w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'
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
          <label className='block text-base font-semibold text-gray-800 mb-3'>Annual Salary (₹)</label>
          <div className='relative w-48'>
            <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-base'>₹</span>
            <input
              min={0}
              value={salary}
              className='w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
              onChange={(e) => setSalary(e.target.value)}
              type='number'
              placeholder='50000'
            />
          </div>
        </div>

        {/* Custom Questions */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='text-base font-semibold text-gray-800 flex items-center gap-2'>
                <svg className='w-5 h-5 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
                Custom Application Questions
                <span className='text-sm font-normal text-gray-500'>(Optional)</span>
              </h3>
              <p className='text-sm text-gray-600 mt-1'>Ask specific questions to candidates during application</p>
            </div>
            <button
              type='button'
              onClick={addCustomQuestion}
              className='flex items-center gap-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg transition-colors font-medium'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
              </svg>
              Add Question
            </button>
          </div>

          {customQuestions.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <svg className='w-12 h-12 mx-auto mb-3 text-gray-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
              <p className='text-base'>No custom questions added yet</p>
              <p className='text-sm'>Click "Add Question" to create application questions</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {customQuestions.map((question, index) => (
                <div key={index} className='p-4 border border-gray-200 rounded-lg bg-gray-50'>
                  <div className='flex items-start justify-between mb-3'>
                    <span className='text-base font-medium text-gray-800'>Question {index + 1}</span>
                    <button
                      type='button'
                      onClick={() => removeCustomQuestion(index)}
                      className='text-red-500 hover:text-red-700 text-base'
                    >
                      ✕
                    </button>
                  </div>

                  <div className='space-y-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>Question Text</label>
                      <input
                        type='text'
                        value={question.question}
                        onChange={(e) => updateCustomQuestion(index, 'question', e.target.value)}
                        placeholder='e.g., What is your immediate joining date?'
                        className='w-full px-3 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500'
                        required
                      />
                    </div>

                    <div className='flex gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>Question Type</label>
                        <select
                          value={question.type}
                          onChange={(e) => updateCustomQuestion(index, 'type', e.target.value)}
                          className='px-3 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
                        >
                          <option value='text'>Short Text</option>
                          <option value='textarea'>Long Text</option>
                          <option value='select'>Multiple Choice</option>
                        </select>
                      </div>

                      <div className='flex items-center gap-2 mt-6'>
                        <input
                          type='checkbox'
                          checked={question.required}
                          onChange={(e) => updateCustomQuestion(index, 'required', e.target.checked)}
                          className='w-4 h-4'
                        />
                        <label className='text-sm text-gray-700'>Required</label>
                      </div>
                    </div>

                    {question.type === 'select' && (
                      <div>
                        <div className='flex items-center justify-between mb-2'>
                          <label className='block text-sm font-medium text-gray-700'>Options</label>
                          <button
                            type='button'
                            onClick={() => addOption(index)}
                            className='text-sm text-blue-600 hover:text-blue-800'
                          >
                            + Add Option
                          </button>
                        </div>
                        <div className='space-y-2'>
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className='flex gap-2'>
                              <input
                                type='text'
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                className='flex-1 px-3 py-2 border border-gray-200 rounded text-base focus:outline-none focus:ring-1 focus:ring-blue-500'
                              />
                              <button
                                type='button'
                                onClick={() => removeOption(index, optionIndex)}
                                className='text-red-500 hover:text-red-700 text-base px-2'
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Availability Settings */}
        <div className='bg-white rounded-2xl border border-gray-100 shadow-sm p-6'>
          <h3 className='text-base font-semibold text-gray-800 mb-4 flex items-center gap-2'>
            <svg className='w-5 h-5 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
            Availability Settings
            <span className='text-sm font-normal text-gray-500'>(Optional)</span>
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
                  <p className='text-base font-medium text-gray-800'>Set expiry date</p>
                  <p className='text-sm text-gray-600'>Job auto-hides after this date</p>
                </div>
              </label>
              {useExpiryDate && (
                <input
                  type='date'
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className='mt-3 w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
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
                  <p className='text-base font-medium text-gray-800'>Limit applications</p>
                  <p className='text-sm text-gray-600'>Job auto-hides after reaching this count</p>
                </div>
              </label>
              {useMaxApplications && (
                <input
                  type='number'
                  value={maxApplications}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow positive integers
                    if (value === '' || (parseInt(value) > 0 && !isNaN(parseInt(value)))) {
                      setMaxApplications(value)
                    }
                  }}
                  min={1}
                  step={1}
                  placeholder='e.g. 50'
                  className='mt-3 w-40 px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
                  required={useMaxApplications}
                />
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type='submit'
          className='w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base transition-colors shadow-sm shadow-blue-200'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          Post Job
        </button>
      </form>
    </div>
  )
}

export default AddJob
