/** @format */

"use client"

import {useState} from "react"
import {login} from "@/lib/api"
import {useAuth} from "@/lib/auth-context"

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

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <form
        onSubmit={handleSubmit}
        className='w-full max-w-sm rounded-lg border border-white/10 bg-surface p-6 shadow-xl'>
        <h2 className='font-display text-2xl text-foreground mb-6'>Anmelden</h2>
        {error && <p className='mb-4 text-xs text-red-400'>{error}</p>}
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

        <p className='mt-4 text-center font-mono text-xs text-muted'>
          Noch keinen Account?{" "}
          <a href='/register' className='text-accent hover:underline'>
            Hier registrieren
          </a>
        </p>
      </form>
    </div>
  )
}
