// src/components/ProtectedRoute.jsx
import React from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ isAllowed, children }) => {
  return isAllowed ? children : <Navigate to="/" />
}

export default ProtectedRoute
