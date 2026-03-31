import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../components/Loading'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useNavigate } from 'react-router-dom'

const SavedJobs = () => {
    const { backendUrl } = useContext(AppContext)
    const { getToken, isSignedIn } = useAuth()
    const [savedJobs, setSavedJobs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        if (isSignedIn) {
            fetchSavedJobs()
        } else {
            setIsLoading(false)
        }
    }, [isSignedIn])

    const fetchSavedJobs = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get(
                `${backendUrl}/api/users/saved-jobs`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (data.success) {
                setSavedJobs(data.savedJobs)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Error fetching saved jobs')
        }
        setIsLoading(false)
    }

    const removeSavedJob = async (jobId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post(
                `${backendUrl}/api/users/toggle-save-job`,
                { jobId },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (data.success) {
                setSavedJobs(savedJobs.filter(savedJob => savedJob.jobId._id !== jobId))
                toast.success('Job removed from saved jobs')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Error removing saved job')
        }
    }

    if (!isSignedIn) {
        return (
            <>
                <Navbar />
                <div className='container mx-auto px-4 py-20 text-center'>
                    <h1 className='text-2xl font-bold mb-4'>Please Sign In</h1>
                    <p className='text-gray-600'>You need to sign in to view your saved jobs.</p>
                </div>
                <Footer />
            </>
        )
    }

    if (isLoading) {
        return <Loading />
    }

    return (
        <>
            <Navbar />
            <div className='container mx-auto px-4 py-8 min-h-[70vh]'>
                <div className='max-w-4xl mx-auto'>
                    <h1 className='text-3xl font-bold mb-8'>Saved Jobs</h1>
                    
                    {savedJobs.length === 0 ? (
                        <div className='text-center py-20'>
                            <div className='flex justify-center mb-4'>
                                <svg 
                                    width="64" 
                                    height="64" 
                                    viewBox="0 0 24 24" 
                                    fill="none"
                                    stroke="currentColor" 
                                    strokeWidth="1"
                                    className="text-gray-300"
                                >
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                </svg>
                            </div>
                            <h2 className='text-xl font-semibold mb-2'>No saved jobs yet</h2>
                            <p className='text-gray-600 mb-6'>Start saving jobs you're interested in to view them here.</p>
                            <button 
                                onClick={() => navigate('/')}
                                className='bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700'
                            >
                                Browse Jobs
                            </button>
                        </div>
                    ) : (
                        <div className='grid gap-6'>
                            {savedJobs.map((savedJob) => (
                                <div key={savedJob._id} className='border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'>
                                    <div className='flex justify-between items-start'>
                                        <div className='flex-1'>
                                            <div className='flex items-center gap-4 mb-3'>
                                                <img 
                                                    src={savedJob.jobId.companyId.image} 
                                                    alt={savedJob.jobId.companyId.name}
                                                    className='w-12 h-12 rounded object-cover'
                                                />
                                                <div>
                                                    <h3 className='text-xl font-semibold'>{savedJob.jobId.title}</h3>
                                                    <p className='text-gray-600'>{savedJob.jobId.companyId.name}</p>
                                                </div>
                                            </div>
                                            
                                            <div className='flex items-center gap-3 mb-3'>
                                                <span className='bg-blue-50 border border-blue-200 px-3 py-1 rounded text-sm'>
                                                    {savedJob.jobId.location}
                                                </span>
                                                <span className='bg-green-50 border border-green-200 px-3 py-1 rounded text-sm'>
                                                    {savedJob.jobId.level}
                                                </span>
                                                <span className='bg-purple-50 border border-purple-200 px-3 py-1 rounded text-sm'>
                                                    ${savedJob.jobId.salary}
                                                </span>
                                            </div>
                                            
                                            <p className='text-gray-700 mb-4' 
                                               dangerouslySetInnerHTML={{
                                                   __html: savedJob.jobId.description.slice(0, 200) + '...'
                                               }}>
                                            </p>
                                            
                                            <div className='flex gap-3'>
                                                <button 
                                                    onClick={() => navigate(`/apply-job/${savedJob.jobId._id}`)}
                                                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                                                >
                                                    Apply Now
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/apply-job/${savedJob.jobId._id}`)}
                                                    className='border border-gray-300 px-4 py-2 rounded hover:bg-gray-50'
                                                >
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className='flex flex-col items-end gap-2'>
                                            <button
                                                onClick={() => removeSavedJob(savedJob.jobId._id)}
                                                className='text-blue-600 hover:text-blue-700 p-2 rounded transition-colors'
                                                title='Remove from saved jobs'
                                            >
                                                <svg 
                                                    width="20" 
                                                    height="20" 
                                                    viewBox="0 0 24 24" 
                                                    fill="currentColor"
                                                    stroke="currentColor" 
                                                    strokeWidth="2"
                                                >
                                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                                </svg>
                                            </button>
                                            <span className='text-xs text-gray-500'>
                                                Saved {new Date(savedJob.savedDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    )
}

export default SavedJobs