/** @format */

"use client"

import {useEffect, useState} from "react"
import {useRouter} from "next/navigation"
import {motion, AnimatePresence} from "framer-motion"
import {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication
} from "@/lib/api"
import {useAuth} from "@/lib/auth-context"

type Status = "beworben" | "interview" | "angebot" | "absage"
type ViewMode = "timeline" | "kanban"

interface Application {
  id: string
  company: string
  position: string
  status: Status
  daysInStatus: number
  createdAt: string
  notes?: string
  jobUrl?: string
  salary?: string
  cvVersion?: string
}

const zoneStart: Record<Exclude<Status, "absage">, number> = {
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
  if (app.status === "absage") return 0
  const progress = Math.min(app.daysInStatus / maxDaysForFullProgress, 1)
  return zoneStart[app.status] + progress * zoneWidth
}

function statusLabel(s: Status) {
  switch (s) {
    case "beworben":
      return "Beworben"
    case "interview":
      return "Interview"
    case "angebot":
      return "Angebot"
    case "absage":
      return "Absage"
  }
}

// Desktop Timeline Karte
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
  const topOffset = 28 + stackIndex * 138

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
          <div className='flex justify-between items-start'>
            <div className='font-display text-base font-semibold text-foreground truncate pr-2'>
              {app.company}
            </div>
            {app.status === "beworben" && app.daysInStatus >= 10 && (
              <span
                className='px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[9px] whitespace-nowrap'
                title='Seit über 10 Tagen keine Rückmeldung'>
                ⚠️ Follow-up
              </span>
            )}
          </div>
          <div className='mt-1 truncate text-sm text-muted'>{app.position}</div>
          <div className='mt-3 font-mono text-xs text-muted flex justify-between items-center'>
            <span>
              {app.daysInStatus}d · {statusLabel(app.status)}
            </span>
            {app.salary && (
              <span className='text-accent text-[11px]'>{app.salary}</span>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// Mobile Karte
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
      <div
        className={`absolute left-[-5px] top-6 h-2.5 w-2.5 rounded-full ${app.status === "absage" ? "bg-red-400" : "bg-accent"} shadow-[0_0_8px_#4f9dde]`}
      />

      <div className='rounded-xl border border-white/10 bg-surface p-4 shadow-lg active:scale-95 transition-transform'>
        <div className='flex justify-between items-start'>
          <div className='font-display text-base font-semibold text-foreground'>
            {app.company}
          </div>
          <div className='flex items-center gap-2'>
            {app.status === "beworben" && app.daysInStatus >= 10 && (
              <span className='px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[9px]'>
                ⚠️ Follow-up
              </span>
            )}
            <div className='font-mono text-xs text-accent'>
              {app.daysInStatus}d
            </div>
          </div>
        </div>
        <div className='mt-1 text-sm text-muted'>{app.position}</div>
        <div className='mt-3 flex justify-between items-center font-mono text-[10px] text-muted'>
          <span className='uppercase tracking-wider'>
            {statusLabel(app.status)}
          </span>
          {app.salary && <span className='text-accent'>{app.salary}</span>}
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

  // Layout & Filter States
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Form States (New Application)
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [status, setStatus] = useState<Status>("beworben")
  const [appliedDate, setAppliedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [notes, setNotes] = useState("")
  const [jobUrl, setJobUrl] = useState("")
  const [salary, setSalary] = useState("")
  const [cvVersion, setCvVersion] = useState("")

  // Slide-Over Editable States
  const [tempNotes, setTempNotes] = useState("")
  const [tempUrl, setTempUrl] = useState("")
  const [tempSalary, setTempSalary] = useState("")
  const [tempCvVersion, setTempCvVersion] = useState("")

  useEffect(() => {
    if (selectedApp) {
      setTempNotes(selectedApp.notes || "")
      setTempUrl(selectedApp.jobUrl || "")
      setTempSalary(selectedApp.salary || "")
      setTempCvVersion(selectedApp.cvVersion || "")
    }
  }, [selectedApp])

  const loadData = async () => {
    try {
      const data = await getApplications()
      const safeData = Array.isArray(data) ? data : []

      const mapped = safeData.map((item: any) => {
        const rawStatus = String(item.status || "beworben").toLowerCase()
        const validStatus = [
          "beworben",
          "interview",
          "angebot",
          "absage"
        ].includes(rawStatus)
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
          jobUrl: item.job_url || "",
          salary: item.salary || "",
          cvVersion: item.cv_version || item.cvVersion || ""
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
      salary,
      cv_version: cvVersion,
      created_at: new Date(appliedDate).toISOString()
    } as any)

    setCompany("")
    setPosition("")
    setStatus("beworben")
    setNotes("")
    setJobUrl("")
    setSalary("")
    setCvVersion("")
    setAppliedDate(new Date().toISOString().split("T")[0])
    setIsModalOpen(false)
    loadData()
  }

  const handleSaveDetails = async () => {
    if (!selectedApp) return

    const apiPayload = {
      id: selectedApp.id,
      company: selectedApp.company,
      platform: selectedApp.position,
      status: selectedApp.status,
      notes: tempNotes,
      job_url: tempUrl,
      salary: tempSalary,
      cv_version: tempCvVersion
    }

    await updateApplication(selectedApp.id, apiPayload as any)

    setSelectedApp({
      ...selectedApp,
      notes: tempNotes,
      jobUrl: tempUrl,
      salary: tempSalary,
      cvVersion: tempCvVersion
    })
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
      job_url: selectedApp.jobUrl || "",
      salary: selectedApp.salary || "",
      cv_version: selectedApp.cvVersion || ""
    }

    await updateApplication(selectedApp.id, apiPayload as any)
    setSelectedApp({...selectedApp, status: newStatus})
    loadData()
  }

  // Filter & Search
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const timelineApps = filteredApplications.filter((a) => a.status !== "absage")
  const positioned = timelineApps
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
    <div className='flex min-h-screen flex-col bg-background px-6 py-8 md:px-16 md:py-12 overflow-x-hidden'>
      {/* Header */}
      <div className='mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6'>
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

      {/* Quick Metrics */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
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
        <div className='rounded-xl border border-white/10 bg-surface p-4'>
          <div className='font-mono text-xs text-muted uppercase tracking-wider'>
            Absagen
          </div>
          <div className='mt-2 font-display text-2xl text-red-400'>
            {applications.filter((a) => a.status === "absage").length}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className='mb-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-2 rounded-xl bg-surface/50 border border-white/10 backdrop-blur-sm'>
        <div className='flex flex-1 flex-col sm:flex-row gap-3 items-stretch sm:items-center'>
          <div className='relative flex-1 max-w-md'>
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Suche nach Firma oder Rolle...'
              className='w-full rounded-lg border border-white/10 bg-background/50 px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors'
            />
          </div>

          <div className='flex rounded-lg bg-background/50 p-1 border border-white/10 self-start sm:self-auto'>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1 rounded font-mono text-xs transition-colors ${
                viewMode === "timeline"
                  ? "bg-accent text-background font-semibold"
                  : "text-muted hover:text-foreground"
              }`}>
              Timeline
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1 rounded font-mono text-xs transition-colors ${
                viewMode === "kanban"
                  ? "bg-accent text-background font-semibold"
                  : "text-muted hover:text-foreground"
              }`}>
              Kanban
            </button>
          </div>
        </div>

        <div className='flex gap-1 overflow-x-auto pb-1 lg:pb-0'>
          {[
            {id: "all", label: "Alle"},
            {id: "beworben", label: "Beworben"},
            {id: "interview", label: "Interviews"},
            {id: "angebot", label: "Angebote"},
            {id: "absage", label: "Absagen"}
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-white/10 text-foreground font-semibold border border-white/20"
                  : "text-muted hover:text-foreground"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE VIEW */}
      {viewMode === "timeline" && (
        <>
          <div className='hidden md:block w-full'>
            <div
              className='relative mt-12 w-full'
              style={{height: `${(maxStack + 1) * 138 + 80}px`}}>
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

              {(["beworben", "interview", "angebot"] as Status[]).map(
                (s, i) => (
                  <motion.div
                    key={s}
                    className='absolute -top-10 font-mono text-xs uppercase tracking-wider text-muted'
                    style={{left: `${zoneStart[s as keyof typeof zoneStart]}%`}}
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.6 + i * 0.15}}>
                    {s}
                  </motion.div>
                )
              )}

              <div className='relative'>
                {withStacking.map(({app, left, stackIndex}, i) => (
                  <DesktopApplicationCard
                    onClick={() => setSelectedApp(app)}
                    key={app.id}
                    app={app}
                    leftPercent={left}
                    stackIndex={stackIndex}
                    delay={0.1 + i * 0.05}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className='block md:hidden'>
            <div className='relative border-l border-white/10 ml-2 space-y-6 py-4'>
              {filteredApplications.map((app, i) => (
                <MobileApplicationCard
                  onClick={() => setSelectedApp(app)}
                  key={app.id}
                  app={app}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start'>
          {(["beworben", "interview", "angebot", "absage"] as Status[]).map(
            (colStatus) => {
              const colApps = filteredApplications.filter(
                (a) => a.status === colStatus
              )
              return (
                <div
                  key={colStatus}
                  className='rounded-xl border border-white/10 bg-surface/30 p-4 flex flex-col gap-3 min-h-[300px]'>
                  <div className='flex justify-between items-center border-b border-white/10 pb-3 mb-1'>
                    <h3 className='font-mono text-xs uppercase tracking-wider text-muted flex items-center gap-2'>
                      <span
                        className={`h-2 w-2 rounded-full ${colStatus === "absage" ? "bg-red-400" : "bg-accent"}`}
                      />
                      {statusLabel(colStatus)}
                    </h3>
                    <span className='font-mono text-xs text-muted bg-white/5 px-2 py-0.5 rounded'>
                      {colApps.length}
                    </span>
                  </div>

                  <div className='flex flex-col gap-3'>
                    {colApps.map((app) => (
                      <motion.div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        whileHover={{scale: 1.02}}
                        className='rounded-lg border border-white/10 bg-surface p-4 cursor-pointer hover:border-accent/40 transition-all shadow-md'>
                        <div className='flex justify-between items-start'>
                          <h4 className='font-display text-sm font-semibold text-foreground'>
                            {app.company}
                          </h4>
                          {app.status === "beworben" &&
                            app.daysInStatus >= 10 && (
                              <span className='px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-[9px]'>
                                ⚠️ Follow-up
                              </span>
                            )}
                        </div>
                        <p className='text-xs text-muted mt-1'>
                          {app.position}
                        </p>
                        <div className='mt-3 flex justify-between items-center font-mono text-[10px] text-muted'>
                          <span>{app.daysInStatus} Tage</span>
                          {app.salary && (
                            <span className='text-accent font-semibold'>
                              {app.salary}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {colApps.length === 0 && (
                      <div className='p-8 text-center font-mono text-xs text-muted/50 border border-dashed border-white/5 rounded-lg'>
                        Keine Einträge
                      </div>
                    )}
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}

      {/* Modal: Neue Bewerbung */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm'>
          <form
            onSubmit={handleCreate}
            className='w-full max-w-md rounded-xl border border-white/10 bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto'>
            <h3 className='font-display text-xl text-foreground mb-4'>
              Neue Bewerbung
            </h3>

            <div>
              <label className='mb-1.5 block font-mono text-xs text-muted'>
                Firma
              </label>
              <input
                type='text'
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent'
                required
              />
            </div>

            <div>
              <label className='mb-1.5 block font-mono text-xs text-muted'>
                Rolle / Position
              </label>
              <input
                type='text'
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent'
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Bewerbungsdatum
                </label>
                <input
                  type='date'
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent [color-scheme:dark]'
                  required
                />
              </div>
              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent'>
                  <option value='beworben'>Beworben</option>
                  <option value='interview'>Interview</option>
                  <option value='angebot'>Angebot</option>
                  <option value='absage'>Absage</option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Gehalt / Budget
                </label>
                <input
                  type='text'
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder='z.B. 65k - 75k'
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent'
                />
              </div>
              <div>
                <label className='mb-1.5 block font-mono text-xs text-muted'>
                  Lebenslauf-Version
                </label>
                <input
                  type='text'
                  value={cvVersion}
                  onChange={(e) => setCvVersion(e.target.value)}
                  placeholder='z.B. CV_Tech_2026.pdf'
                  className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent'
                />
              </div>
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
                className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent'
              />
            </div>

            <div>
              <label className='mb-1.5 block font-mono text-xs text-muted'>
                Notizen & Interview Prep
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Erste Notizen, Ansprechpartner, Tech-Stack...'
                className='w-full rounded-lg border border-white/10 bg-background/50 p-2.5 text-sm text-foreground focus:outline-none focus:border-accent resize-none h-20'
              />
            </div>

            <div className='flex justify-end gap-3 pt-4'>
              <button
                type='button'
                onClick={() => setIsModalOpen(false)}
                className='px-4 py-2 font-mono text-xs text-muted hover:text-foreground'>
                Abbrechen
              </button>
              <button
                type='submit'
                className='rounded-lg bg-accent px-5 py-2 font-mono text-xs font-semibold text-background hover:bg-accent/90 shadow-lg shadow-accent/20'>
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Slide-Over Details / Career Hub */}
      {selectedApp && (
        <div
          onClick={() => setSelectedApp(null)}
          className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end'>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{x: "100%"}}
            animate={{x: 0}}
            exit={{x: "100%"}}
            transition={{type: "spring", stiffness: 300, damping: 30}}
            className='w-full max-w-lg h-full bg-surface border-l border-white/10 p-6 overflow-y-auto flex flex-col shadow-2xl'>
            <div className='flex justify-between items-start mb-6'>
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
                className='text-muted hover:text-white'>
                ✕
              </button>
            </div>

            {/* Status Change Buttons */}
            <div className='mb-6 p-4 rounded-lg bg-background/50 border border-white/5'>
              <span className='font-mono text-xs text-muted uppercase block mb-3'>
                Status ändern
              </span>
              <div className='grid grid-cols-2 gap-2'>
                {(
                  ["beworben", "interview", "angebot", "absage"] as Status[]
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`py-1.5 rounded-lg font-mono text-xs transition-colors ${
                      selectedApp.status === s
                        ? "bg-accent text-background font-semibold shadow-[0_0_10px_rgba(79,157,222,0.4)]"
                        : "bg-white/5 text-muted hover:bg-white/10"
                    }`}>
                    {statusLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            {/* Salary & CV Version Hub */}
            <div className='grid grid-cols-2 gap-3 mb-6'>
              <div>
                <label className='font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5'>
                  Gehalt / Budget
                </label>
                <input
                  type='text'
                  value={tempSalary}
                  onChange={(e) => setTempSalary(e.target.value)}
                  placeholder='z.B. 70.000 €'
                  className='w-full bg-background/50 border border-white/10 rounded-lg p-2.5 text-xs text-foreground focus:border-accent focus:outline-none'
                />
              </div>
              <div>
                <label className='font-mono text-[10px] text-muted uppercase tracking-wider block mb-1.5'>
                  Lebenslauf-Version
                </label>
                <input
                  type='text'
                  value={tempCvVersion}
                  onChange={(e) => setTempCvVersion(e.target.value)}
                  placeholder='z.B. CV_Dev_v3.pdf'
                  className='w-full bg-background/50 border border-white/10 rounded-lg p-2.5 text-xs text-foreground focus:border-accent focus:outline-none'
                />
              </div>
            </div>

            {/* Job URL */}
            <div className='mb-6'>
              <div className='flex justify-between items-center mb-1.5'>
                <h4 className='font-mono text-[10px] text-muted uppercase tracking-wider'>
                  Stellenanzeige (URL)
                </h4>
                {tempUrl && (
                  <a
                    href={tempUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='font-mono text-[11px] text-accent hover:underline'>
                    Öffnen ↗
                  </a>
                )}
              </div>
              <input
                type='url'
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder='https://...'
                className='w-full bg-background/50 border border-white/10 rounded-lg p-2.5 text-xs text-foreground focus:border-accent focus:outline-none'
              />
            </div>

            {/* Interview Prep & Notes Hub */}
            <div className='flex-1 flex flex-col mb-4'>
              <h4 className='font-mono text-[10px] text-muted mb-1.5 uppercase tracking-wider'>
                Gesprächsnotizen & Interview-Prep
              </h4>
              <textarea
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder='Fragen fürs Gespräch, Tech-Stack, HR-Kontakt, Feedback...'
                className='w-full flex-1 min-h-[140px] bg-background/50 border border-white/10 rounded-lg p-3 text-sm text-foreground focus:border-accent focus:outline-none resize-none'
              />
              <button
                onClick={handleSaveDetails}
                className='mt-3 w-full py-2.5 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 rounded-lg font-mono text-xs font-semibold shadow-[0_0_10px_rgba(79,157,222,0.1)] transition-colors'>
                Änderungen im Karriere-Hub speichern
              </button>
            </div>

            <button
              onClick={handleDelete}
              className='mt-auto py-3 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg font-mono text-xs transition-colors border border-transparent hover:border-red-400/20'>
              Bewerbung löschen
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
