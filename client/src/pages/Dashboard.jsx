import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { companyData, setCompanyData, setCompanyToken } = useContext(AppContext)

  const logout = () => {
    setCompanyData(null)
    setCompanyToken(null)
    localStorage.removeItem('companyToken')
    navigate('/')
  }

  useEffect(() => {
    if (companyData) {
      navigate('/dashboard/manage-jobs')
    }
  }, [companyData])

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
      {/* Top Navbar */}
      <header className='bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-20 shadow-sm'>
        <img
          onClick={() => navigate('/')}
          className='h-8 cursor-pointer'
          src={assets.logo}
          alt='logo'
        />
        {companyData && (
          <div className='flex items-center gap-4'>
            <div className='text-right hidden sm:block'>
              <p className='text-xs text-gray-500'>Recruiter Panel</p>
              <p className='text-sm font-semibold text-gray-800'>{companyData.name}</p>
            </div>
            <div className='relative group'>
              <img
                className='w-9 h-9 rounded-full border-2 border-blue-500 object-cover cursor-pointer'
                src={companyData.image}
                alt='company'
              />
              <div className='absolute hidden group-hover:block top-full right-0 mt-2 z-10'>
                <ul className='bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[130px]'>
                  <li
                    onClick={logout}
                    className='px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer rounded-xl'
                  >
                    Logout
                  </li>
                </ul>
              </div>
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
