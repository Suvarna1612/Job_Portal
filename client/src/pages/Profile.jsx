import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { AppContext } from '../context/AppContext'
import { useAuth, useUser } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import axios from 'axios'

const Profile = () => {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [isEdit, setIsEdit] = useState(false)
  const [resume, setResume] = useState(null)
  const { backendUrl, userData, fetchUserData } = useContext(AppContext)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const updateResume = async () => {
    try {
      const formData = new FormData()
      formData.append('resume', resume)

      const token = await getToken()

      const { data } = await axios.post(
        backendUrl + '/api/users/update-resume',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        await fetchUserData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }

    setIsEdit(false)
    setResume(null)
  }

  if (!userData) {
    return (
      <>
        <Navbar />
        <div className='container px-4 min-h-[65vh] 2xl:px-20 mx-auto my-10 flex items-center justify-center'>
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className='container px-4 min-h-[65vh] 2xl:px-20 mx-auto my-10'>
        <h1 className='text-2xl font-bold mb-6'>My Profile</h1>

        {/* User Info Section */}
        <div className='bg-white border rounded-lg p-6 mb-6'>
          <div className='flex items-center gap-4 mb-4'>
            <img
              src={user?.imageUrl}
              alt='Profile'
              className='w-20 h-20 rounded-full'
            />
            <div>
              <h2 className='text-xl font-semibold'>
                {user?.firstName} {user?.lastName}
              </h2>
              <p className='text-gray-600'>{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        </div>

        {/* Resume Section */}
        <div className='bg-white border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Your Resume</h2>
          <p className='text-gray-600 text-sm mb-4'>
            Upload your default resume. You can use this resume when applying for jobs or choose a different one during application.
          </p>
          <div className='flex gap-2'>
            {isEdit || (userData && userData.resume === '') ? (
              <>
                <label className='flex items-center' htmlFor='resumeUpload'>
                  <p className='bg-blue-100 text-blue-600 px-4 py-2 rounded-lg mr-2 cursor-pointer'>
                    {resume ? resume.name : 'Select Resume'}
                  </p>
                  <input
                    type='file'
                    hidden
                    accept='application/pdf'
                    onChange={(e) => setResume(e.target.files[0])}
                    id='resumeUpload'
                  />
                  <img src={assets.profile_upload_icon} alt='' />
                </label>
                <button
                  onClick={updateResume}
                  className='bg-green-100 border border-green-400 rounded-lg px-4 py-2'
                >
                  Save
                </button>
                {userData && userData.resume !== '' && (
                  <button
                    onClick={() => {
                      setIsEdit(false)
                      setResume(null)
                    }}
                    className='text-gray-500 border border-gray-300 rounded-lg px-4 py-2'
                  >
                    Cancel
                  </button>
                )}
              </>
            ) : (
              <div className='flex gap-2'>
                <a
                  target='_blank'
                  href={userData.resume}
                  className='bg-blue-100 text-blue-600 px-4 py-2 rounded-lg'
                >
                  View Resume
                </a>
                <button
                  onClick={() => setIsEdit(true)}
                  className='text-gray-500 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer'
                >
                  Change Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Profile
