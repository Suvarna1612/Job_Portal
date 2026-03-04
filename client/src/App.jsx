import React, { useContext } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ApplyJob from './pages/ApplyJob'
import Applications from './pages/Applications'
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
