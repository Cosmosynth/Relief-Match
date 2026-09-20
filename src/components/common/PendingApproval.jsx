import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoginscreenBG from '../../assets/LoginscreenBg.png'

export const PendingApproval = () => {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="text-on-surface min-h-screen flex antialiased relative w-full">
      {/* Full-Screen Background */}
      <div className="fixed inset-0 z-0">
        <img
          alt="Relief Operations"
          className="w-full h-full object-cover"
          src={LoginscreenBG}
        />
      </div>

      <main className="relative z-10 flex w-full min-h-screen flex-col items-center justify-center p-margin-mobile md:p-margin-desktop py-12">
        <div className="glass-panel w-full max-w-md rounded-2xl p-margin-mobile md:p-sm flex flex-col gap-md relative backdrop-blur-2xl bg-white/60">
          
          {/* Brand */}
          <div className="flex flex-col items-center text-center gap-xs">
            <div className="flex items-center gap-xs cursor-pointer select-none" onClick={() => navigate("/")}>
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>
                handshake
              </span>
              <h1 className="font-display-lg text-headline-lg md:text-headline-lg text-primary-container tracking-tight">
                Relief Match
              </h1>
            </div>
          </div>

          <div className="w-full h-px bg-outline-variant/30"></div>

          {/* Pending Status */}
          <div className="flex flex-col items-center text-center gap-sm py-6">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-700" style={{ fontSize: '32px' }}>
                hourglass_top
              </span>
            </div>

            <h2 className="font-headline-md text-headline-md text-primary-container">
              Awaiting Approval
            </h2>

            <p className="font-body-md text-body-md text-primary-container max-w-sm">
              Your account is pending approval by a Relief Coordinator (Admin). You'll be able to access the platform once your account has been reviewed.
            </p>

            <div className="bg-white/60 backdrop-blur-sm px-sm py-xs rounded-lg border border-white/50 mt-2">
              <span className="font-data-label text-data-label text-on-surface">
                {currentUser?.email || "user@reliefmatch.ai"}
              </span>
            </div>

            <div className="inline-flex items-center gap-sm bg-amber-50 border border-amber-200 px-sm py-xs rounded-lg mt-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="font-data-label text-data-label text-amber-800 uppercase tracking-wider">
                Status: Pending
              </span>
            </div>
          </div>

          <div className="w-full h-px bg-outline-variant/30"></div>

          {/* Actions */}
          <div className="flex flex-col gap-sm">
            <button
              onClick={handleLogout}
              className="w-full flex justify-center items-center gap-sm py-sm px-4 border border-outline-variant/60 rounded-lg bg-white/40 backdrop-blur-sm font-data-value text-data-value text-on-surface hover:bg-white/70 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Sign Out & Try Another Account
            </button>
          </div>

          {/* Footer */}
          <div className="pt-sm border-t border-outline-variant/30 text-center">
            <p className="font-data-label text-data-label text-primary-container">
              © 2024 RELIEF MATCH. SECURE NETWORK.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
