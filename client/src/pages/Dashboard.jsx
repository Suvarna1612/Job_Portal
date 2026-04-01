import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { companyData, setCompanyData, setCompanyToken } = useContext(AppContext)
  const [showDropdown, setShowDropdown] = useState(false)

  const logout = () => {
    setCompanyData(null)
    setCompanyToken(null)
    localStorage.removeItem('companyToken')
    navigate('/')
  }

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.profile-dropdown')) {
        setShowDropdown(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDropdown])

  useEffect(() => {
    if (companyData) {
      navigate('/dashboard/manage-jobs')
    }
  }, [companyData])

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Top Navbar */}
      <header className='bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm'>
        <button
          onClick={() => navigate('/')}
          className='focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-lg p-1'
        >
          <img
            className='h-8 cursor-pointer'
            src={assets.logo}
            alt='logo'
          />
        </button>
        {companyData && (
          <div className='flex items-center gap-4'>
            <div className='text-right hidden sm:block'>
              <p className='text-xs text-gray-500'>Recruiter Panel</p>
              <p className='text-sm font-semibold text-gray-800'>{companyData.name}</p>
            </div>
            <div className='relative profile-dropdown'>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className='w-9 h-9 rounded-full border-2 border-blue-500 object-cover cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all'
              >
                <img
                  className='w-full h-full rounded-full object-cover'
                  src={companyData.image}
                  alt='company'
                />
              </button>
              
              {showDropdown && (
                <div className='absolute top-full right-0 mt-2 z-30 animate-in fade-in-0 zoom-in-95 duration-100'>
                  <ul className='bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[160px]'>
                    <li className='px-4 py-1'>
                      <div className='text-xs text-gray-500 border-b border-gray-100 pb-2 mb-2'>
                        <p className='font-medium text-gray-800'>{companyData.name}</p>
                        <p className='truncate'>{companyData.email}</p>
                      </div>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setShowDropdown(false)
                          logout()
                        }}
                        className='w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2'
                      >
                        <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                        </svg>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <div className='flex flex-1'>
        {/* Sidebar */}
        <aside className='w-16 sm:w-56 bg-white border-r border-gray-200 flex flex-col py-6 gap-1 sticky top-[57px] h-[calc(100vh-57px)]'>
          <NavLink
            to='/dashboard/add-job'
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <img className='w-5 h-5 min-w-5' src={assets.add_icon} alt='' style={{ filter: 'none' }} />
            <span className='max-sm:hidden'>Add Job</span>
          </NavLink>

          <NavLink
            to='/dashboard/manage-jobs'
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <img className='w-5 h-5 min-w-5' src={assets.home_icon} alt='' />
            <span className='max-sm:hidden'>Manage Jobs</span>
          </NavLink>

          <NavLink
            to='/dashboard/view-applications'
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            <img className='w-5 h-5 min-w-5' src={assets.person_tick_icon} alt='' />
            <span className='max-sm:hidden'>Applications</span>
          </NavLink>

          {/* Spacer to push logout to bottom */}
          <div className='flex-1'></div>

          {/* Logout button in sidebar (especially useful on mobile) */}
          <button
            onClick={logout}
            className='flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-red-600 hover:bg-red-50 border-t border-gray-100 mt-2 pt-4'
          >
            <svg className='w-5 h-5 min-w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
            </svg>
            <span className='max-sm:hidden'>Logout</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-6 overflow-auto'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Dashboard
