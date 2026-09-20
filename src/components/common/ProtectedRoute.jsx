import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { loading, userRole, userStatus, pendingApproval } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F3EC] p-6 text-center">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl border border-[#E7DED2] shadow-sm">
          <span className="w-5 h-5 border-2 border-[#D98B3A] border-t-transparent rounded-full animate-spin"></span>
          <span className="text-sm font-semibold text-[#001d36]">Loading Dashboard...</span>
        </div>
      </div>
    )
  }

  // If user is pending approval, redirect to pending screen
  if (pendingApproval || userStatus === "pending") {
    return <Navigate to="/pending" replace />
  }

  // If user is suspended, redirect to login
  if (userStatus === "suspended") {
    return <Navigate to="/login" replace />
  }

  // Check role access if allowedRoles specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/admin" replace />
  }

  return children
}

