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
    const {backendUrl, companyToken} = useContext(AppContext)

    const editorRef = useRef(null)
    const quillRef = useRef(null) 

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            const description = quillRef.current.root.innerHTML
            
            const jobData = {
                title, 
                description, 
                location, 
                salary, 
                category, 
                level
            }

            // Add optional fields only if enabled
            if (useExpiryDate && expiryDate) {
                jobData.expiryDate = expiryDate
            }
            if (useMaxApplications && maxApplications) {
                jobData.maxApplications = parseInt(maxApplications)
            }

            const {data} = await axios.post(backendUrl + '/api/company/post-job',
                jobData,
                {headers:{token: companyToken}}
            ) 
            if(data.success){
                toast.success(data.message)
                setTitle('')
                setSalary(0)
                setExpiryDate('')
                setMaxApplications('')
                setUseExpiryDate(false)
                setUseMaxApplications(false)
                quillRef.current.root.innerHTML = '' 

            }else{
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }

    }

    useEffect(()=>{
        //Initiate Quill only once
        if(!quillRef.current && editorRef.current){
            quillRef.current = new Quill(editorRef.current, {
                theme:'snow', 
            })
        }
    },[])

  return (
    
    <form onSubmit={onSubmitHandler} className='container p-4 flex flex-col w-full items-start gap-3'>
        <div className='w-full '>
            <p className='mb-2 '>Job Title</p>
            <input type="text" placeholder='Type here'
            onChange={e => setTitle(e.target.value)} value={title}
            required 
            className='w-full max-w-lg px-3 py-2 border-2 border-gray-300 rounded'
            />
        </div>
        <div className='w-full max-w-lg'>
            <p className='my-2'>Job Description</p>
            <div ref={editorRef}>

            </div>
        </div>

        <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
            <div>
                <p className='mb-2'>Job Category</p>
                <select className='w-full px-3 py-2 border-2 border-gray-300 rounded' onChange={e=> setCategory(e.target.value)}>
                    {JobCategories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                    ))}
                </select>
            </div>
            <div>
                <p className='mb-2'>Job Location</p>
                <select className='w-full px-3 py-2 border-2 border-gray-300 rounded' onChange={e=> setLocation(e.target.value)}>
                    {JobLocations.map((location, index) => (
                        <option key={index} value={location}>{location}</option>
                    ))}
                </select>
            </div>
            <div>
                <p className='mb-2'>Job Level</p>
                <select className='w-full px-3 py-2 border-2 border-gray-300 rounded' onChange={e=> setLevel(e.target.value)}>
                    <option value="Beginner level">Beginner level</option>
                    <option value="Intermediate level">Intermediate level</option>
                    <option value="Senior level">Senior level</option>
                </select>
            </div>

        </div>
        <div>
            <p className='mb-2'>Job Salary</p>
            <input min={0} className='w-full px-3 py-2 border-2 border-gray-300 rounded sm:w-[120px]' onChange={e => setSalary(e.target.value)} type="Number" placeholder='2500' />
        </div>

        {/* Job Availability Options */}
        <div className='w-full max-w-lg border-2 border-gray-200 rounded p-4 mt-4'>
            <p className='font-semibold mb-3'>Job Availability Settings (Optional)</p>
            
            {/* Expiry Date Option */}
            <div className='mb-4'>
                <label className='flex items-center gap-2 mb-2'>
                    <input 
                        type='checkbox' 
                        checked={useExpiryDate}
                        onChange={(e) => setUseExpiryDate(e.target.checked)}
                        className='w-4 h-4'
                    />
                    <span>Set job expiry date</span>
                </label>
                {useExpiryDate && (
                    <input 
                        type='date' 
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className='w-full px-3 py-2 border-2 border-gray-300 rounded'
                        required={useExpiryDate}
                    />
                )}
                <p className='text-sm text-gray-500 mt-1'>Job will automatically become invisible after this date</p>
            </div>

            {/* Max Applications Option */}
            <div>
                <label className='flex items-center gap-2 mb-2'>
                    <input 
                        type='checkbox' 
                        checked={useMaxApplications}
                        onChange={(e) => setUseMaxApplications(e.target.checked)}
                        className='w-4 h-4'
                    />
                    <span>Limit number of applications</span>
                </label>
                {useMaxApplications && (
                    <input 
                        type='number' 
                        value={maxApplications}
                        onChange={(e) => setMaxApplications(e.target.value)}
                        min={1}
                        placeholder='e.g., 50'
                        className='w-full px-3 py-2 border-2 border-gray-300 rounded sm:w-[200px]'
                        required={useMaxApplications}
                    />
                )}
                <p className='text-sm text-gray-500 mt-1'>Job will automatically become invisible after reaching this number</p>
            </div>
        </div>

        <button className='w-28 py-3 mt-4 bg-black text-white rounded'>Add</button>
    </form>
  )
}

export default AddJob
