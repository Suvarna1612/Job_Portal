// src/components/PrivateRoute.jsx
import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const PrivateRoute = ({ children }) => {
  const { companyToken } = useContext(AppContext)

  if (!companyToken) {
    // Redirect to home/login page if not authenticated
    return <Navigate to='/' replace />
  }
  return children
}

export default PrivateRoute
