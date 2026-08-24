/** @format */

"use client"

import {useState} from "react"
import {useRouter} from "next/navigation"
import {motion} from "framer-motion"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
      })

      if (!res.ok) throw new Error("Registrierung fehlgeschlagen")

      // Direkt nach erfolgreicher Registrierung zum Login weiterleiten
      router.push("/login")
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten")
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4'>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className='w-full max-w-md rounded-xl border border-white/10 bg-surface p-8 shadow-2xl'>
        <h1 className='mb-2 font-display text-2xl text-foreground'>
          Account erstellen
        </h1>
        <p className='mb-6 font-mono text-xs text-muted'>
          Starte mit deinem Job-Tracker
        </p>

        {error && (
          <div className='mb-4 rounded-lg bg-red-400/10 border border-red-400/20 p-3 text-xs font-mono text-red-400'>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className='space-y-4'>
          <div>
            <label className='mb-1.5 block font-mono text-xs text-muted'>
              E-Mail
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='w-full rounded-lg border border-white/10 bg-background/50 p-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors'
              required
            />
          </div>

          <div>
            <label className='mb-1.5 block font-mono text-xs text-muted'>
              Passwort
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full rounded-lg border border-white/10 bg-background/50 p-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors'
              required
            />
          </div>

          <button
            type='submit'
            className='w-full rounded-lg bg-accent py-3 font-mono text-xs font-semibold text-background hover:opacity-90 transition-opacity shadow-lg shadow-accent/20'>
            Registrieren
          </button>
        </form>

        <p className='mt-6 text-center font-mono text-xs text-muted'>
          Bereits einen Account?{" "}
          <a href='/login' className='text-accent hover:underline'>
            Einloggen
          </a>
        </p>
      </motion.div>
    </div>
  )
}
