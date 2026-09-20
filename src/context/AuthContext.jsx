import React, { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db, isFirebaseConfigured } from "../firebase/firebase"

const AuthContext = createContext()

export const useAuth = () => {
  return useContext(AuthContext)
}

const DEFAULT_DEMO_USER = {
  uid: "demo-admin-123",
  email: "admin@reliefmatch.ai",
  displayName: "Demo Administrator",
  photoURL: ""
}

const DEFAULT_DEMO_PROFILE = {
  uid: "demo-admin-123",
  name: "Demo Administrator",
  email: "admin@reliefmatch.ai",
  role: "admin1",
  status: "active",
  campId: null
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(DEFAULT_DEMO_USER)
  const [userProfile, setUserProfile] = useState(DEFAULT_DEMO_PROFILE)
  const [loading, setLoading] = useState(false)
  const [pendingApproval, setPendingApproval] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Check users/{uid}
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const profile = userSnap.data()

            if (profile.status === "active") {
              // Active user — proceed with role
              setCurrentUser(user)
              setUserProfile({ uid: user.uid, ...profile })
              setPendingApproval(false)
              localStorage.setItem("userEmail", user.email || "")
              localStorage.setItem("role", profile.role || "admin1")
            } else if (profile.status === "suspended") {
              // Suspended user — treat as pending
              setCurrentUser(user)
              setUserProfile({ uid: user.uid, ...profile })
              setPendingApproval(true)
            } else {
              // Pending user
              setCurrentUser(user)
              setUserProfile({ uid: user.uid, ...profile })
              setPendingApproval(true)
            }
          } else {
            // No document — check invites, then create as pending
            let inviteRole = null
            let inviteCampId = null
            try {
              const inviteRef = doc(db, "invites", user.email)
              const inviteSnap = await getDoc(inviteRef)
              if (inviteSnap.exists() && !inviteSnap.data().claimed) {
                inviteRole = inviteSnap.data().role
                inviteCampId = inviteSnap.data().campId || null
                // Claim the invite
                await setDoc(inviteRef, { claimed: true, claimedBy: user.uid }, { merge: true })
              }
            } catch (e) {
              console.warn("Invite check failed:", e)
            }

            const newProfile = {
              email: user.email || "",
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              role: inviteRole || null,
              status: inviteRole ? "active" : "pending",
              campId: inviteCampId,
              createdAt: serverTimestamp(),
            }

            try {
              await setDoc(userRef, newProfile)
            } catch (e) {
              console.warn("User doc creation failed:", e)
            }

            setCurrentUser(user)
            setUserProfile({ uid: user.uid, ...newProfile })
            setPendingApproval(!inviteRole)
            localStorage.setItem("userEmail", user.email || "")
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error)
          setCurrentUser(user)
          setUserProfile(DEFAULT_DEMO_PROFILE)
          setPendingApproval(false)
        }
      } else {
        // Not signed in — fallback to Demo User for seamless access
        setCurrentUser(DEFAULT_DEMO_USER)
        setUserProfile(DEFAULT_DEMO_PROFILE)
        setPendingApproval(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth)
      } catch (e) {
        console.warn("SignOut error:", e)
      }
    }
    localStorage.clear()
    setCurrentUser(DEFAULT_DEMO_USER)
    setUserProfile(DEFAULT_DEMO_PROFILE)
    setPendingApproval(false)
  }

  const value = {
    currentUser,
    userProfile,
    userRole: userProfile?.role || localStorage.getItem("role") || "admin1",
    userStatus: userProfile?.status || "active",
    userCampId: userProfile?.campId || null,
    pendingApproval,
    loading,
    logout,
    setCurrentUser,
    setUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

