import React, { useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ApplyJob from './pages/ApplyJob'
import Applications from './pages/Applications'
import Profile from './pages/Profile'
import PrepareInterview from './pages/PrepareInterview'
import SavedJobs from './pages/SavedJobs'
import FollowedCompanies from './pages/FollowedCompanies'
import EnhanceResume from './pages/EnhanceResume'
import RecruiterLogin from './components/RecruiterLogin'
import { AppContext } from './context/AppContext'
import Dashboard from './pages/Dashboard'
import AddJob from './pages/AddJob'
import ManageJobs from './pages/ManageJobs'
import ViewApplications from './pages/ViewApplications'
import ProtectedRoute from './components/ProtectedRoute'
import 'quill/dist/quill.snow.css'
import { ToastContainer } from 'react-toastify'
import PrivateRoute from './components/PrivateRoute'

const App = () => {
  const { showRecruiterLogin, companyToken } = useContext(AppContext)
  console.log("Company Token:", companyToken)
  return (
    <div>
      {showRecruiterLogin && <RecruiterLogin />}
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/apply-job/:id' element={<ApplyJob />} />
        <Route path='/applications' element={<Applications />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/prepare-interview/:id' element={<PrepareInterview />} />
        <Route path='/saved-jobs' element={<SavedJobs />} />
        <Route path='/followed-companies' element={<FollowedCompanies />} />
        <Route path='/enhance-resume' element={<EnhanceResume />} />
        
        <Route path='/dashboard' element={
          <PrivateRoute>
          <Dashboard />
          </PrivateRoute>
          }>
        

          <Route
            path='add-job'
            
            element={
              
              <ProtectedRoute isAllowed={companyToken}>
                <AddJob />
              </ProtectedRoute>
            }
          />
          <Route
            path='manage-jobs'
            element={
              <ProtectedRoute isAllowed={companyToken}>
                <ManageJobs />
              </ProtectedRoute>
            }
          />
          <Route
            path='view-applications'
            element={
              <ProtectedRoute isAllowed={companyToken}>
                <ViewApplications />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </div>
  )
}

export default App
