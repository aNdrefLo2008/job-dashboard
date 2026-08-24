/** @format */

"use client"

import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {motion} from "framer-motion"
import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication
} from "@/lib/api"
import {useAuth} from "@/lib/auth-context"

type Status = "beworben" | "interview" | "angebot"

interface Application {
  id: string
  company: string
  position: string
  status: Status
  daysInStatus: number
  createdAt: string
  notes?: string
  jobUrl?: string
}

const zoneStart: Record<Status, number> = {
  beworben: 12,
  interview: 46,
  angebot: 80
}

const zoneWidth = 20
const maxDaysForFullProgress = 21

function calculateDays(dateString?: string): number {
  if (!dateString) return 0
  const created = new Date(dateString).getTime()
  if (isNaN(created)) return 0
  const now = new Date().setHours(0, 0, 0, 0)
  const createdDay = new Date(created).setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((now - createdDay) / (1000 * 60 * 60 * 24)))
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

// -------------------------------------------------------------
// Desktop Karte (bleibt gleich, mit absoluter Positionierung)
// -------------------------------------------------------------
function DesktopApplicationCard({
  app,
  leftPercent,
  stackIndex,
  delay,
  onClick
}: {
  app: Application
  leftPercent: number
  stackIndex: number
  delay: number
  onClick: () => void
}) {
  const topOffset = 28 + stackIndex * 132

  return (
    <motion.div
      onClick={onClick}
      className='absolute -translate-x-1/2'
      style={{left: `${leftPercent}%`, top: `${topOffset}px`}}
      initial={{opacity: 0, y: 40, scale: 0.9}}
      animate={{opacity: 1, y: 0, scale: 1}}
      transition={{delay, type: "spring", stiffness: 260, damping: 20}}>
      <div className='relative'>
        {stackIndex === 0 && (
          <div className='absolute -top-7 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_#4f9dde]' />
        )}
        <motion.div
          className='relative w-56 rounded-xl border border-white/10 bg-surface p-4 cursor-pointer shadow-lg'
          whileHover={{
            scale: 1.03,
            borderColor: "rgba(79,157,222,0.5)",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)"
          }}
          transition={{type: "spring", stiffness: 400, damping: 25}}>
          <div className='font-display text-base font-semibold text-foreground'>
            {app.company}
          </div>
          <div className='mt-1 truncate text-sm text-muted'>{app.position}</div>
          <div className='mt-3 font-mono text-xs text-muted'>
            {app.daysInStatus}d · {statusLabel(app.status)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// -------------------------------------------------------------
// NEU: Mobile Karte (für die vertikale Liste)
// -------------------------------------------------------------
function MobileApplicationCard({
  app,
  delay,
  onClick
}: {
  app: Application
  delay: number
  onClick: () => void
}) {
  return (
    <motion.div
      onClick={onClick}
      className='relative pl-8'
      initial={{opacity: 0, x: -20}}
      animate={{opacity: 1, x: 0}}
      transition={{delay, type: "spring", stiffness: 260, damping: 20}}>
      {/* Blauer Punkt auf der vertikalen Linie */}
      <div className='absolute left-[-5px] top-6 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_#4f9dde]' />

      <div className='rounded-xl border border-white/10 bg-surface p-4 shadow-lg active:scale-95 transition-transform'>
        <div className='flex justify-between items-start'>
          <div className='font-display text-base font-semibold text-foreground'>
            {app.company}
          </div>
          <div className='font-mono text-xs text-accent'>
            {app.daysInStatus}d
          </div>
        </div>
        <div className='mt-1 text-sm text-muted'>{app.position}</div>
        <div className='mt-3 inline-block rounded bg-white/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted'>
          {statusLabel(app.status)}
        </div>
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

  const [selectedApp, setSelectedApp] = useState<Application | null>(null)

  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [status, setStatus] = useState<Status>("beworben")
  const [appliedDate, setAppliedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const [notes, setNotes] = useState("")
  const [jobUrl, setJobUrl] = useState("")

  const [tempNotes, setTempNotes] = useState("")

  const [tempUrl, setTempUrl] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (selectedApp) {
      setTempNotes(selectedApp.notes || "")
      setTempUrl(selectedApp.jobUrl || "")
    }
  }, [selectedApp])

  const handleSaveDetails = async () => {
    if (!selectedApp) return

    const apiPayload = {
      id: selectedApp.id,
      company: selectedApp.company,
      platform: selectedApp.position,
      status: selectedApp.status,
      notes: tempNotes,
      job_url: tempUrl
    }

    await updateApplication(selectedApp.id, apiPayload)

    const updatedData = {
      ...selectedApp,
      notes: tempNotes,
      jobUrl: tempUrl
    }

    setSelectedApp(updatedData)
    loadData()
  }
  const handleDelete = async () => {
    if (!selectedApp) return
    if (!confirm("Bewerbung wirklich löschen?")) return

    await deleteApplication(selectedApp.id)
    setSelectedApp(null)
    loadData()
  }

  const handleStatusChange = async (newStatus: Status) => {
    if (!selectedApp || selectedApp.status === newStatus) return

    const apiPayload = {
      id: selectedApp.id,
      company: selectedApp.company,
      platform: selectedApp.position,
      status: newStatus,
      notes: selectedApp.notes || "",
      job_url: selectedApp.jobUrl || ""
    }

    await updateApplication(selectedApp.id, apiPayload)

    setSelectedApp({...selectedApp, status: newStatus})
    loadData()
  }

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
          createdAt: item.created_at || item.createdAt,
          daysInStatus: calculateDays(item.created_at || item.createdAt),
          notes: item.notes || "",
          jobUrl: item.job_url || ""
        }
      })

      mapped.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

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

    const selectedDate = new Date(appliedDate)
    if (selectedDate > new Date()) {
      alert("Das Datum kann nicht in der Zukunft liegen.")
      return
    }

    await createApplication({
      company,
      platform: position,
      status,
      notes,
      job_url: jobUrl,
      created_at: new Date(appliedDate).toISOString()
    })

    setCompany("")
    setPosition("")
    setStatus("beworben")
    setNotes("")
    setJobUrl("")
    setAppliedDate(new Date().toISOString().split("T")[0])
    setIsModalOpen(false)
    loadData()
  }

  // NEU: Filtern nach Suchbegriff (Firma/Rolle) und Status
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || app.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Stacking Logik basierend auf den gefilterten Apps
  const positioned = filteredApplications
    .map((app) => ({app, left: computePosition(app)}))
    .sort((a, b) => a.left - b.left)

  const placedItems: {left: number; stackIndex: number}[] = []
  const withStacking = positioned.map((item) => {
    let stackIndex = 0
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
    return <div className='p-16 font-mono text-muted'>Lade Bewerbungen...</div>

  return (
    <div className='flex min-h-screen flex-col bg-background px-6 py-8 md:px-16 md:py-16 overflow-x-hidden'>
      {/* Header */}
      <div className='mb-12 md:mb-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6'>
        <motion.h1
          className='font-display text-3xl text-foreground'
          initial={{opacity: 0, y: -10}}
          animate={{opacity: 1, y: 0}}>
          Job Dashboard
        </motion.h1>
        <div className='flex w-full sm:w-auto gap-4'>
          <button
            onClick={() => setIsModalOpen(true)}
            className='flex-1 sm:flex-none rounded bg-accent px-4 py-2.5 font-mono text-xs font-semibold text-background hover:opacity-90 transition-opacity'>
            + Neue Bewerbung
          </button>
          <button
            onClick={logout}
            className='rounded border border-white/10 px-4 py-2.5 font-mono text-xs text-muted hover:text-foreground transition-colors'>
            Logout
          </button>
        </div>
      </div>

      {/* Such- und Filterleiste */}
      <div className='mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4'>
        {/* Suchfeld */}
        <div className='relative flex-1 max-w-md'>
          <input
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Suche nach Firma oder Rolle...'
            className='w-full rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
          />
        </div>

        {/* Status-Filter-Buttons */}
        <div className='flex gap-1.5 overflow-x-auto pb-1 sm:pb-0'>
          {[
            {id: "all", label: "Alle"},
            {id: "beworben", label: "Beworben"},
            {id: "interview", label: "Interviews"},
            {id: "angebot", label: "Angebote"}
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-2 rounded-lg font-mono text-xs transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-accent text-background font-semibold"
                  : "bg-surface border border-white/10 text-muted hover:text-foreground"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Metrics / Statistiken */}
      <div className='grid grid-cols-3 gap-4 mb-12'>
        <div className='rounded-xl border border-white/10 bg-surface p-4'>
          <div className='font-mono text-xs text-muted uppercase tracking-wider'>
            Gesamt
          </div>
          <div className='mt-2 font-display text-2xl text-foreground'>
            {applications.length}
          </div>
        </div>
        <div className='rounded-xl border border-white/10 bg-surface p-4'>
          <div className='font-mono text-xs text-muted uppercase tracking-wider'>
            Interviews
          </div>
          <div className='mt-2 font-display text-2xl text-accent'>
            {applications.filter((a) => a.status === "interview").length}
          </div>
        </div>
        <div className='rounded-xl border border-white/10 bg-surface p-4'>
          <div className='font-mono text-xs text-muted uppercase tracking-wider'>
            Angebote
          </div>
          <div className='mt-2 font-display text-2xl text-emerald-400'>
            {applications.filter((a) => a.status === "angebot").length}
          </div>
        </div>
      </div>

      {/* =========================================
          DESKTOP VIEW (Horizontale Timeline)
          Wird nur ab md (Tablet/Desktop) gezeigt
          ========================================= */}
      <div className='hidden md:block w-full'>
        <div
          className='relative mt-12 w-full'
          style={{height: `${(maxStack + 1) * 132 + 80}px`}}>
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

          <div className='relative'>
            {withStacking.map(({app, left, stackIndex}, i) => (
              <DesktopApplicationCard
                onClick={() => setSelectedApp(app)}
                key={app.id}
                app={app}
                leftPercent={left}
                stackIndex={stackIndex}
                delay={0.2 + i * 0.05}
              />
            ))}
          </div>
        </div>
      </div>

      {/* =========================================
          MOBILE VIEW (Vertikale Timeline)
          Wird nur auf kleinen Screens gezeigt
          ========================================= */}
      <div className='block md:hidden'>
        <div className='relative border-l border-white/10 ml-2 space-y-8 py-4'>
          {applications.map((app, i) => (
            <MobileApplicationCard
              onClick={() => setSelectedApp(app)}
              key={app.id}
              app={app}
              delay={i * 0.1}
            />
          ))}
          {applications.length === 0 && (
            <div className='pl-8 text-sm font-mono text-muted'>
              Noch keine Bewerbungen.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm'>
          <form
            onSubmit={handleCreate}
            className='w-full max-w-md rounded-xl border border-white/10 bg-surface p-6 shadow-2xl'>
            <h3 className='mb-6 font-display text-xl text-foreground'>
              Neue Bewerbung
            </h3>

            <div className='space-y-4'>
              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Firma
                </label>
                <input
                  type='text'
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors'
                  required
                />
              </div>

              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Rolle / Plattform
                </label>
                <input
                  type='text'
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors'
                  required
                />
              </div>

              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Bewerbungsdatum
                </label>
                <input
                  type='date'
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors [color-scheme:dark]'
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors'>
                  <option value='beworben'>Beworben</option>
                  <option value='interview'>Interview</option>
                  <option value='angebot'>Angebot</option>
                </select>
              </div>

              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Stellenanzeige (URL)
                </label>
                <input
                  type='url'
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder='https://...'
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors'
                />
              </div>

              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Notizen
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Erste Notizen...'
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent transition-colors resize-none h-20'
                />
              </div>
            </div>

            <div className='flex justify-end gap-3 mt-8'>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='px-4 py-2 font-mono text-xs text-muted hover:text-foreground transition-colors'>
                Abbrechen
              </button>
              <button
                type='submit'
                className='rounded-lg bg-accent px-5 py-2 font-mono text-xs font-semibold text-background hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20'>
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Detail Slide-Over */}
      {selectedApp && (
        /* 1. DAS BACKDROP: Füllt den ganzen Bildschirm und schließt bei Klick */
        <div
          onClick={() => setSelectedApp(null)}
          className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end'>
          {/* 2. DAS EIGENTLICHE SLIDE-OVER PANEL */}
          {/* WICHTIG: stopPropagation() verhindert, dass ein Klick INTIM DES PANELS das Fenster schließt! */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{x: "100%"}}
            animate={{x: 0}}
            exit={{x: "100%"}}
            transition={{type: "spring", stiffness: 300, damping: 30}}
            className='w-full max-w-md h-full bg-surface border-l border-white/10 p-6 overflow-y-auto flex flex-col shadow-2xl'>
            <div className='flex justify-between items-start mb-8'>
              <div>
                <h2 className='text-2xl font-display text-foreground'>
                  {selectedApp.company}
                </h2>
                <p className='text-muted font-mono text-sm mt-1'>
                  {selectedApp.position}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className='text-muted hover:text-white transition-colors'>
                ✕
              </button>
            </div>

            {/* Interaktive Status-Buttons */}
            <div className='mb-8 p-4 rounded-lg bg-background/50 border border-white/5'>
              <span className='font-mono text-xs text-muted uppercase block mb-3'>
                Status ändern
              </span>
              <div className='flex gap-2'>
                {(["beworben", "interview", "angebot"] as Status[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`flex-1 py-1.5 rounded-full font-mono text-xs transition-colors ${
                      selectedApp.status === s
                        ? "bg-accent text-background font-semibold shadow-[0_0_10px_rgba(79,157,222,0.4)]"
                        : "bg-white/5 text-muted hover:bg-white/10"
                    }`}>
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* URL-Feld */}
            <div className='mb-4'>
              <div className='flex justify-between items-center mb-2'>
                <h4 className='font-mono text-xs text-muted uppercase tracking-wider'>
                  Stellenanzeige (URL)
                </h4>
                {tempUrl && (
                  <a
                    href={tempUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-mono text-[11px] text-accent hover:underline flex items-center gap-1'>
                    Öffnen ↗
                  </a>
                )}
              </div>
              <input
                type='url'
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder='https://linkedin.com/jobs/...'
                className='w-full bg-background/50 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-accent focus:outline-none transition-colors'
              />
            </div>

            {/* Notizen-Feld */}
            <div className='flex-1'>
              <h4 className='font-mono text-xs text-muted mb-2 uppercase tracking-wider'>
                Notizen
              </h4>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder='Gesprächsnotizen, Gehalt, Ansprechpartner...'
                className='w-full h-32 bg-background/50 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-accent focus:outline-none resize-none transition-colors'
              />
              <button
                onClick={handleSaveDetails}
                className='mt-3 w-full py-2.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 rounded-lg font-mono text-xs font-semibold transition-all shadow-[0_0_10px_rgba(79,157,222,0.1)]'>
                Änderungen speichern
              </button>
            </div>

            <button
              onClick={handleDelete}
              className='mt-8 py-3 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg font-mono text-xs transition-colors border border-transparent hover:border-red-400/20'>
              Bewerbung löschen
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
