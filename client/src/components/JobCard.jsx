import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

const JobCard = ({ job }) => {

    const navigate = useNavigate()
    const { backendUrl } = useContext(AppContext)
    const { getToken, isSignedIn } = useAuth()
    const [isSaved, setIsSaved] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [isFollowLoading, setIsFollowLoading] = useState(false)

    // Check if job is saved when component mounts
    useEffect(() => {
        if (isSignedIn) {
            checkIfJobSaved()
            checkIfCompanyFollowed()
        }
    }, [job._id, isSignedIn])

    const checkIfJobSaved = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.post(
                `${backendUrl}/api/users/check-saved-jobs`,
                { jobIds: [job._id] },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (data.success) {
                setIsSaved(data.savedJobIds.includes(job._id))
            }
        } catch (error) {
            console.error('Error checking saved job:', error)
        }
    }

    const checkIfCompanyFollowed = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.post(
                `${backendUrl}/api/users/check-followed-companies`,
                { companyIds: [job.companyId._id] },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            if (data.success) {
                setIsFollowing(data.followedCompanyIds.includes(job.companyId._id))
            }
        } catch (error) {
            console.error('Error checking followed company:', error)
        }
    }

    const toggleFollowCompany = async (e) => {
        e.stopPropagation()
        
        if (!isSignedIn) {
            toast.error('Please sign in to follow companies')
            return
        }

        setIsFollowLoading(true)
        try {
            const token = await getToken()
            const { data } = await axios.post(
                `${backendUrl}/api/users/toggle-follow-company`,
                { companyId: job.companyId._id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (data.success) {
                setIsFollowing(data.following)
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Error following company')
        }
        setIsFollowLoading(false)
    }
    const toggleSaveJob = async (e) => {
        e.stopPropagation() // Prevent card click when clicking save button
        
        if (!isSignedIn) {
            toast.error('Please sign in to save jobs')
            return
        }

        setIsLoading(true)
        try {
            const token = await getToken()
            const { data } = await axios.post(
                `${backendUrl}/api/users/toggle-save-job`,
                { jobId: job._id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (data.success) {
                setIsSaved(data.saved)
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Error saving job')
        }
        setIsLoading(false)
    }
    
    return (
        <div className='border p-6 shadow rounded relative'>
            <div className='flex justify-between items-center'>
                <img className='h-8' src={job.companyId.image} alt="" />
                {isSignedIn && (
                    <div className='flex gap-2'>
                        <button
                            onClick={toggleFollowCompany}
                            disabled={isFollowLoading}
                            className={`p-2 rounded transition-colors ${
                                isFollowing 
                                    ? 'text-green-600 hover:text-green-700' 
                                    : 'text-gray-400 hover:text-green-500'
                            } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isFollowing ? 'Unfollow company' : 'Follow company for job alerts'}
                        >
                            <svg 
                                width="18" 
                                height="18" 
                                viewBox="0 0 24 24" 
                                fill={isFollowing ? 'currentColor' : 'none'}
                                stroke="currentColor" 
                                strokeWidth="2"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="m19 8 2 2-2 2"/>
                                <path d="m21 10-7.5 7.5L10 14"/>
                            </svg>
                        </button>
                        <button
                            onClick={toggleSaveJob}
                            disabled={isLoading}
                            className={`p-2 rounded transition-colors ${
                                isSaved 
                                    ? 'text-blue-600 hover:text-blue-700' 
                                    : 'text-gray-400 hover:text-blue-500'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isSaved ? 'Remove from saved jobs' : 'Save job'}
                        >
                            <svg 
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill={isSaved ? 'currentColor' : 'none'}
                                stroke="currentColor" 
                                strokeWidth="2"
                                className="transition-all duration-200"
                            >
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
            <h4 className='font-medium text-xl mt-2'>{job.title}</h4>
            <div className='flex items-center gap-3 mt-2 text-xs'>
                <span className='bg-blue-50 border border-blue-200 px-4 py-1.5 rounded'>{job.location}</span>
                <span className='bg-red-50 border border-red-200 px-4 py-1.5 rounded'>{job.level}</span>
            </div>
            <p className='text-gray-500 text-sm mt-4' dangerouslySetInnerHTML={{__html:job.description.slice(0,150)}}></p>
            <div className='mt-4 flex gap-4 text-sm'>
               <button onClick={() => {navigate(`/apply-job/${job._id}`); scrollTo(0, 0)}} className='bg-blue-600 text-white px-4 py-2 rounded cursor-pointer'>Apply now</button> 
               <button onClick={() => {navigate(`/apply-job/${job._id}`); scrollTo(0, 0)}} className='text-gray-500 border border-gray-500 rounded px-4 py-2 cursor-pointer'>Learn more</button>
            </div>
        </div>
    )
}

export default JobCard