import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom"
import { Login } from "../common/Login"
import { PendingApproval } from "../common/PendingApproval"
import { ProtectedRoute } from "../common/ProtectedRoute"

import { HeroPage } from "../pages/HeroPage"
import { Dashboard } from "../pages/Dashboard"
import { AdminControlCenter } from "../pages/AdminControlCenter"
import { Requests } from "../pages/Requests"
import { Supply } from "../pages/Supply"
import { MatchesDeliveries } from "../pages/MatchesDeliveries"
import { CampDashboard } from "../pages/incharge/CampDashboard"
import { CampSupplies } from "../pages/incharge/CampSupplies"
import { CampRequestSupplies } from "../pages/incharge/CampRequestSupplies"
import { CampDeliveries } from "../pages/incharge/CampDeliveries"
import { CampDeliveryDetail } from "../pages/incharge/CampDeliveryDetail"
import { CampDonations } from "../pages/incharge/CampDonations"

const router = createBrowserRouter([
  {
    path: "/",
    element: <HeroPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/pending",
    element: <PendingApproval />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute allowedRoles={["admin1", "admin2", "logistics"]}>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/requests",
    element: (
      <ProtectedRoute allowedRoles={["admin1", "admin2", "logistics"]}>
        <Requests />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/supply",
    element: (
      <ProtectedRoute allowedRoles={["admin1", "admin2", "logistics"]}>
        <Supply />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/matches",
    element: (
      <ProtectedRoute allowedRoles={["admin1", "admin2", "logistics"]}>
        <MatchesDeliveries />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/matches/:id",
    element: (
      <ProtectedRoute allowedRoles={["admin1", "admin2", "logistics"]}>
        <MatchesDeliveries />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/control-center",
    element: (
      <ProtectedRoute allowedRoles={["admin1"]}>
        <AdminControlCenter />
      </ProtectedRoute>
    ),
  },
  // ─── Camp In-Charge Routes ───
  {
    path: "/incharge/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["incharge"]}>
        <CampDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/incharge/supplies",
    element: (
      <ProtectedRoute allowedRoles={["incharge"]}>
        <CampSupplies />
      </ProtectedRoute>
    ),
  },
  {
    path: "/incharge/request",
    element: (
      <ProtectedRoute allowedRoles={["incharge"]}>
        <CampRequestSupplies />
      </ProtectedRoute>
    ),
  },
  {
    path: "/incharge/deliveries",
    element: (
      <ProtectedRoute allowedRoles={["incharge"]}>
        <CampDeliveries />
      </ProtectedRoute>
    ),
  },
  {
    path: "/incharge/deliveries/:id",
    element: (
      <ProtectedRoute allowedRoles={["incharge"]}>
        <CampDeliveryDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/incharge/donations",
    element: (
      <ProtectedRoute allowedRoles={["incharge"]}>
        <CampDonations />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/control-center",
    element: (
      <ProtectedRoute allowedRoles={["admin1"]}>
        <AdminControlCenter />
      </ProtectedRoute>
    ),
  },
  // ─── Redirects for old routes ───
  { path: "/admin/incident", element: <Navigate to="/admin/matches" replace /> },
  { path: "/admin/incident/:id", element: <Navigate to="/admin/matches" replace /> },
  { path: "/admin/analytics", element: <Navigate to="/admin" replace /> },
  { path: "/admin/notifications", element: <Navigate to="/admin" replace /> },
  { path: "/admin/intelligence-feed", element: <Navigate to="/admin" replace /> },
  { path: "/admin/search", element: <Navigate to="/admin" replace /> },
  { path: "/how-it-works", element: <Navigate to="/" replace /> },
  { path: "/support", element: <Navigate to="/" replace /> },
  { path: "/signup", element: <Navigate to="/login" replace /> },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter