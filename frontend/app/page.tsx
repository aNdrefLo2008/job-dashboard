/** @format */

"use client"

import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {motion} from "framer-motion"
import {getApplications, createApplication} from "@/lib/api"
import {useAuth} from "@/lib/auth-context"

type Status = "beworben" | "interview" | "angebot"

interface Application {
  id: string
  company: string
  position: string
  status: Status
  daysInStatus: number
}

const zoneStart: Record<Status, number> = {
  beworben: 0,
  interview: 32,
  angebot: 64
}

const zoneWidth = 24
const maxDaysForFullProgress = 21

function calculateDays(dateString?: string): number {
  if (!dateString) return 0
  const created = new Date(dateString).getTime()
  if (isNaN(created)) return 0
  const now = new Date().getTime()
  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)))
}

function computePosition(app: Application): number {
  const progress = Math.min(app.daysInStatus / maxDaysForFullProgress, 1)
  return zoneStart[app.status] + progress * zoneWidth
}

function statusLabel(s: Status) {
  return s === "beworben"
    ? "Beworben"
    : s === "interview"
      ? "Interview"
      : "Angebot"
}

function ApplicationCard({
  app,
  leftPercent,
  stackIndex,
  delay
}: {
  app: Application
  leftPercent: number
  stackIndex: number
  delay: number
}) {
  const isWaitingLong = app.status === "beworben" && app.daysInStatus > 14
  // Karten starten 28px unter der Linie und haben 132px Abstand zueinander
  const topOffset = 28 + stackIndex * 132

  return (
    <motion.div
      className='absolute -translate-x-1/2'
      style={{left: `${leftPercent}%`, top: `${topOffset}px`}}
      initial={{opacity: 0, y: 40, scale: 0.9}}
      animate={{opacity: 1, y: 0, scale: 1}}
      transition={{delay, type: "spring", stiffness: 260, damping: 20}}>
      <div className='relative'>
        {/* Blauer Punkt exakt auf der Zeitlinie (nur für die oberste Karte im Stack) */}
        {stackIndex === 0 && (
          <div className='absolute -top-[28px] left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_#4f9dde]' />
        )}

        {isWaitingLong && (
          <motion.div
            className='absolute inset-0 rounded-xl bg-accent/20'
            animate={{scale: [1, 1.08, 1], opacity: [0.5, 0, 0.5]}}
            transition={{duration: 3, repeat: Infinity, ease: "easeInOut"}}
          />
        )}

        <motion.div
          className='relative w-56 rounded-xl border border-white/10 bg-surface p-4 cursor-pointer shadow-lg'
          whileHover={{
            scale: 1.03,
            borderColor: "rgba(79,157,222,0.5)",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)"
          }}
          transition={{type: "spring", stiffness: 400, damping: 25}}>
          <div className='font-display text-base text-foreground font-semibold'>
            {app.company}
          </div>
          <div className='mt-1 text-sm text-muted'>{app.position}</div>
          <div className='mt-3 font-mono text-xs text-muted'>
            {app.daysInStatus}d · {statusLabel(app.status)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function Home() {
  const {token, logout} = useAuth()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [status, setStatus] = useState<Status>("beworben")

  const loadData = async () => {
    try {
      const data = await getApplications()
      const safeData = Array.isArray(data) ? data : []

      const mapped = safeData.map((item: any) => {
        const rawStatus = String(item.status || "beworben").toLowerCase()
        const validStatus = ["beworben", "interview", "angebot"].includes(
          rawStatus
        )
          ? (rawStatus as Status)
          : "beworben"

        return {
          id: String(item.id),
          company: item.company || "Unbekannte Firma",
          position: item.platform || item.position || "N/A",
          status: validStatus,
          daysInStatus: calculateDays(item.created_at || item.createdAt)
        }
      })

      setApplications(mapped)
    } catch (err) {
      console.error("Fehler beim Laden:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      router.push("/login")
      return
    }
    loadData()
  }, [token])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createApplication({company, platform: position, status})
    setCompany("")
    setPosition("")
    setIsModalOpen(false)
    loadData()
  }

  // Präzises Stacking ohne Überlappungen
  const positioned = applications
    .map((app) => ({app, left: computePosition(app)}))
    .sort((a, b) => a.left - b.left)

  const placedItems: {left: number; stackIndex: number}[] = []
  const withStacking = positioned.map((item) => {
    let stackIndex = 0
    // Weise den ersten freien vertikalen Slot zu, der mindestens 18% horizontalen Abstand hat
    while (
      placedItems.some(
        (p) => p.stackIndex === stackIndex && Math.abs(p.left - item.left) < 18
      )
    ) {
      stackIndex++
    }
    placedItems.push({left: item.left, stackIndex})
    return {...item, stackIndex}
  })

  const maxStack = Math.max(...withStacking.map((w) => w.stackIndex), 0)

  if (loading)
    return <div className='p-16 text-muted font-mono'>Lade Bewerbungen...</div>

  return (
    <div className='flex min-h-screen flex-col bg-background px-16 py-16'>
      <div className='mb-16 flex items-center justify-between'>
        <motion.h1
          className='font-display text-3xl text-foreground'
          initial={{opacity: 0, y: -10}}
          animate={{opacity: 1, y: 0}}>
          Job Dashboard
        </motion.h1>
        <div className='flex gap-4'>
          <button
            onClick={() => setIsModalOpen(true)}
            className='rounded bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90'>
            + Neue Bewerbung
          </button>
          <button
            onClick={logout}
            className='rounded border border-white/10 px-3 py-2 font-mono text-xs text-muted hover:text-foreground'>
            Logout
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div
        className='relative mt-12'
        style={{height: `${(maxStack + 1) * 132 + 80}px`}}>
        {/* Die horizontale Zeitlinie (y = 0) */}
        <svg
          className='absolute left-0 top-0 h-px w-full overflow-visible'
          preserveAspectRatio='none'>
          <motion.line
            x1='0'
            y1='0'
            x2='100%'
            y2='0'
            stroke='rgba(79,157,222,0.4)'
            strokeWidth='1.5'
            initial={{pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{duration: 1.2, ease: "easeInOut"}}
          />
        </svg>

        {/* Zonen Beschriftungen über der Linie */}
        {(["beworben", "interview", "angebot"] as Status[]).map((s, i) => (
          <motion.div
            key={s}
            className='absolute -top-10 font-mono text-xs uppercase tracking-wider text-muted'
            style={{left: `${zoneStart[s]}%`}}
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            transition={{delay: 0.6 + i * 0.15}}>
            {s}
          </motion.div>
        ))}

        {/* Render der Bewerbungskarten */}
        <div className='relative'>
          {withStacking.map(({app, left, stackIndex}, i) => (
            <ApplicationCard
              key={app.id}
              app={app}
              leftPercent={left}
              stackIndex={stackIndex}
              delay={0.2 + i * 0.05}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60'>
          <form
            onSubmit={handleCreate}
            className='w-full max-w-md rounded-lg border border-white/10 bg-surface p-6'>
            <h3 className='mb-4 font-display text-xl text-foreground'>
              Neue Bewerbung hinzufügen
            </h3>
            <div className='mb-3'>
              <label className='mb-1 block font-mono text-xs text-muted'>
                Firma
              </label>
              <input
                type='text'
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className='w-full rounded border border-white/10 bg-background p-2 text-sm text-foreground focus:outline-none'
                required
              />
            </div>
            <div className='mb-3'>
              <label className='mb-1 block font-mono text-xs text-muted'>
                Plattform / Rolle
              </label>
              <input
                type='text'
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className='w-full rounded border border-white/10 bg-background p-2 text-sm text-foreground focus:outline-none'
                required
              />
            </div>
            <div className='mb-6'>
              <label className='mb-1 block font-mono text-xs text-muted'>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className='w-full rounded border border-white/10 bg-background p-2 text-sm text-foreground focus:outline-none'>
                <option value='beworben'>Beworben</option>
                <option value='interview'>Interview</option>
                <option value='angebot'>Angebot</option>
              </select>
            </div>
            <div className='flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='px-4 py-2 font-mono text-xs text-muted hover:text-foreground'>
                Abbrechen
              </button>
              <button
                type='submit'
                className='rounded bg-accent px-4 py-2 font-mono text-xs font-semibold text-background'>
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
