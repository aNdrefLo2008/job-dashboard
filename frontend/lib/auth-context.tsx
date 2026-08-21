/** @format */

"use client"

import React, {createContext, useContext, useEffect, useState} from "react"
import {useRouter} from "next/navigation"

interface AuthContextType {
  token: string | null
  loginUser: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const savedToken = localStorage.getItem("token")
    if (savedToken) setToken(savedToken)
    setLoading(false)
  }, [])

  const loginUser = (newToken: string) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)
    router.push("/")
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    router.push("/login")
  }

  if (loading) return null

  return (
    <AuthContext.Provider value={{token, loginUser, logout}}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context)
    throw new Error("useAuth muss innerhalb von AuthProvider genutzt werden")
  return context
}
