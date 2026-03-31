import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Loading from '../components/Loading'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useNavigate } from 'react-router-dom'

const FollowedCompanies = () => {
    const { backendUrl } = useContext(AppContext)
    const { getToken, isSignedIn } = useAuth()
    const [followedCompanies, setFollowedCompanies] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        if (isSignedIn) {
            fetchFollowedCompanies()
        } else {
            setIsLoading(false)
        }
    }, [isSignedIn])

    const fetchFollowedCompanies = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get(
                `${backendUrl}/api/users/followed-companies`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (data.success) {
                setFollowedCompanies(data.followedCompanies)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Error fetching followed companies')
        }
        setIsLoading(false)
    }

    const unfollowCompany = async (companyId, companyName) => {
        try {
            const token = await getToken()
            const { data } = await axios.post(
                `${backendUrl}/api/users/toggle-follow-company`,
                { companyId },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (data.success) {
                setFollowedCompanies(followedCompanies.filter(follow => follow.companyId._id !== companyId))
                toast.success(`Unfollowed ${companyName}`)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Error unfollowing company')
        }
    }

    if (!isSignedIn) {
        return (
            <>
                <Navbar />
                <div className='container mx-auto px-4 py-20 text-center'>
                    <h1 className='text-2xl font-bold mb-4'>Please Sign In</h1>
                    <p className='text-gray-600'>You need to sign in to view your followed companies.</p>
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
                    <h1 className='text-3xl font-bold mb-8'>Followed Companies</h1>
                    
                    {followedCompanies.length === 0 ? (
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
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="m19 8 2 2-2 2"/>
                                    <path d="m21 10-7.5 7.5L10 14"/>
                                </svg>
                            </div>
                            <h2 className='text-xl font-semibold mb-2'>No followed companies yet</h2>
                            <p className='text-gray-600 mb-6'>Follow companies you're interested in to get notified when they post new jobs.</p>
                            <button 
                                onClick={() => navigate('/')}
                                className='bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700'
                            >
                                Browse Jobs
                            </button>
                        </div>
                    ) : (
                        <div className='grid gap-6'>
                            {followedCompanies.map((follow) => (
                                <div key={follow._id} className='border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow'>
                                    <div className='flex justify-between items-center'>
                                        <div className='flex items-center gap-4'>
                                            <img 
                                                src={follow.companyId.image} 
                                                alt={follow.companyId.name}
                                                className='w-16 h-16 rounded object-cover'
                                            />
                                            <div>
                                                <h3 className='text-xl font-semibold'>{follow.companyId.name}</h3>
                                                <p className='text-gray-600 text-sm'>
                                                    Following since {new Date(follow.followedDate).toLocaleDateString()}
                                                </p>
                                                <div className='flex items-center gap-2 mt-2'>
                                                    <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                                                    <span className='text-sm text-green-600 font-medium'>
                                                        Email notifications active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => unfollowCompany(follow.companyId._id, follow.companyId.name)}
                                            className='bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition-colors'
                                        >
                                            Unfollow
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className='mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6'>
                        <h3 className='text-lg font-semibold text-blue-800 mb-2'>📧 Email Notifications</h3>
                        <p className='text-blue-700 text-sm'>
                            You'll receive email notifications whenever companies you follow post new job openings. 
                            Make sure to check your inbox regularly and add our email to your contacts to avoid missing opportunities!
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default FollowedCompanies