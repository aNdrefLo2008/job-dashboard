/** @format */

"use client"

import {useState} from "react"
import {login} from "@/lib/api"
import {useAuth} from "@/lib/auth-context"
import {GoogleOAuthProvider, GoogleLogin} from "@react-oauth/google"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://job-dashboard-5pzp.onrender.com"
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "140044066141-o2i676ttmv05k425kc5uoanh6fjphigt.apps.googleusercontent.com"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const {loginUser} = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const token = await login(email, password)
      loginUser(token)
    } catch {
      setError("Ungültige Anmeldedaten")
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError("")
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id_token: credentialResponse.credential})
      })

      if (!res.ok) throw new Error("Google Login fehlgeschlagen")

      const data = await res.json()
      loginUser(data.token) // Nutzt deinen AuthContext!
    } catch {
      setError("Google Login fehlgeschlagen")
    }
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className='flex min-h-screen items-center justify-center bg-background px-4'>
        <div className='w-full max-w-sm rounded-lg border border-white/10 bg-surface p-6 shadow-xl'>
          <h2 className='font-display text-2xl text-foreground mb-6'>
            Anmelden
          </h2>
          {error && <p className='mb-4 text-xs text-red-400'>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className='mb-4'>
              <label className='block font-mono text-xs text-muted mb-1'>
                E-Mail
              </label>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full rounded border border-white/10 bg-background p-2 text-sm text-foreground focus:outline-none focus:border-accent'
                required
              />
            </div>
            <div className='mb-6'>
              <label className='block font-mono text-xs text-muted mb-1'>
                Passwort
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full rounded border border-white/10 bg-background p-2 text-sm text-foreground focus:outline-none focus:border-accent'
                required
              />
            </div>
            <button
              type='submit'
              className='w-full rounded bg-accent py-2 font-mono text-sm text-background font-semibold hover:opacity-90'>
              Login
            </button>
          </form>

          {/* Trennlinie */}
          <div className='relative my-6 flex items-center justify-center'>
            <div className='w-full border-t border-white/10'></div>
            <span className='absolute bg-surface px-2 font-mono text-[10px] text-muted uppercase'>
              Oder
            </span>
          </div>

          {/* Google Button */}
          <div className='flex justify-center'>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Login abgebrochen")}
              theme='filled_black'
              shape='pill'
            />
          </div>

          <p className='mt-6 text-center font-mono text-xs text-muted'>
            Noch keinen Account?{" "}
            <a href='/register' className='text-accent hover:underline'>
              Hier registrieren
            </a>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}
