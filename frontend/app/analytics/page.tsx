/** @format */

"use client"

import {useEffect, useState, useMemo} from "react"
import {getApplications, BackendApplication} from "@/lib/api"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import Link from "next/link"
import {ArrowLeft} from "lucide-react"

// Diese Werte müssen als Hex vorliegen, weil Recharts (fill/stroke) keine
// CSS-Variablen oder Tailwind-Klassen akzeptiert. Sie entsprechen 1:1 den
// Theme-Farben aus tailwind.config / :root — bei Änderung dort bitte hier
// mit aktualisieren.
const THEME = {
  background: "#0E1116",
  surface: "#181D26",
  foreground: "#E8EAED",
  muted: "#6B7280",
  accent: "#4F9DDE"
}

const STATUS_COLORS: Record<string, string> = {
  offen: THEME.muted,
  beworben: THEME.accent,
  interview: "#8B7FDE", // dezentes Violett, an --accent angelehnt statt Tailwind-Indigo
  angebot: "#4ADE80", // entspricht --success
  absage: "#E5786B" // gedämpftes Rot, passt zur restlichen Sättigung
}

export default function AnalyticsPage() {
  const [apps, setApps] = useState<BackendApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getApplications()
        setApps(data)
      } catch (err) {
        console.error("Fehler beim Laden der Analytics-Daten:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // --- KPI BERECHNUNGEN ---
  const stats = useMemo(() => {
    const total = apps.length
    if (total === 0)
      return {total: 0, interviewRate: 0, rejectionRate: 0, avgSalary: 0}

    const interviews = apps.filter(
      (a) => a.status === "interview" || a.status === "angebot"
    ).length
    const rejections = apps.filter((a) => a.status === "absage").length

    const salaries = apps
      .map((a) => {
        if (!a.salary) return 0
        const num = parseInt(a.salary.replace(/[^0-9]/g, ""), 10)
        return isNaN(num) ? 0 : num
      })
      .filter((s) => s > 0)

    const avgSalary =
      salaries.length > 0
        ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
        : 0

    return {
      total,
      interviewRate: Math.round((interviews / total) * 100),
      rejectionRate: Math.round((rejections / total) * 100),
      avgSalary
    }
  }, [apps])

  // --- CHART 1: STATUS VERTEILUNG ---
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {}
    apps.forEach((a) => {
      const s = a.status || "offen"
      counts[s] = (counts[s] || 0) + 1
    })

    return Object.entries(counts).map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: count,
      color: STATUS_COLORS[name] || THEME.muted
    }))
  }, [apps])

  // --- CHART 2: CV-VERSION PERFORMANCE ---
  const cvData = useMemo(() => {
    const cvMap: Record<
      string,
      {name: string; total: number; interviews: number}
    > = {}

    apps.forEach((a) => {
      const cv = a.cv_version || "Standard"
      if (!cvMap[cv]) cvMap[cv] = {name: cv, total: 0, interviews: 0}
      cvMap[cv].total += 1
      if (a.status === "interview" || a.status === "angebot") {
        cvMap[cv].interviews += 1
      }
    })

    return Object.values(cvMap)
  }, [apps])

  // Tooltip-Design an das Dashboard-Theme angeglichen (--surface / --foreground / --muted)
  const customTooltipStyle = {
    backgroundColor: THEME.surface,
    border: "1px solid rgba(255,255,255,0.1)",
    color: THEME.foreground,
    borderRadius: "8px",
    fontSize: "12px",
    padding: "8px 12px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)"
  }

  if (loading) {
    return <div className='p-8 text-muted font-mono text-sm'>Lade Daten...</div>
  }

  return (
    <div className='min-h-screen bg-background text-foreground p-6 md:p-10'>
      {/* Header */}
      <div className='max-w-6xl mx-auto mb-10'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 text-muted hover:text-foreground font-mono text-xs mb-6 transition-colors duration-200'>
          <ArrowLeft size={16} /> Zurück zum Dashboard
        </Link>
        <h1 className='font-display text-2xl text-foreground'>Analytics</h1>
      </div>

      <div className='max-w-6xl mx-auto'>
        {/* KPI Cards — identisches Muster wie die Quick-Metrics im Dashboard */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
          <div className='rounded-xl border border-white/10 bg-surface p-5'>
            <p className='font-mono text-xs text-muted uppercase tracking-wider mb-3'>
              Gesamt
            </p>
            <p className='font-display text-3xl text-foreground'>
              {stats.total}
            </p>
          </div>

          <div className='rounded-xl border border-white/10 bg-surface p-5'>
            <p className='font-mono text-xs text-muted uppercase tracking-wider mb-3'>
              Interview-Quote
            </p>
            <p className='font-display text-3xl text-accent'>
              {stats.interviewRate}%
            </p>
          </div>

          <div className='rounded-xl border border-white/10 bg-surface p-5'>
            <p className='font-mono text-xs text-muted uppercase tracking-wider mb-3'>
              Ø Gehalt
            </p>
            <p className='font-display text-3xl text-emerald-400'>
              {stats.avgSalary > 0
                ? `${stats.avgSalary.toLocaleString("de-DE")} €`
                : "N/A"}
            </p>
          </div>

          <div className='rounded-xl border border-white/10 bg-surface p-5'>
            <p className='font-mono text-xs text-muted uppercase tracking-wider mb-3'>
              Absage-Quote
            </p>
            <p className='font-display text-3xl text-red-400'>
              {stats.rejectionRate}%
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Chart 1: Donut Chart */}
          <div className='rounded-xl border border-white/10 bg-surface p-6'>
            <h2 className='font-mono text-xs text-muted uppercase tracking-wider mb-6'>
              Status-Verteilung
            </h2>
            <div className='h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey='value'
                    nameKey='name'
                    cx='50%'
                    cy='45%'
                    innerRadius={70}
                    outerRadius={90}
                    stroke='none'>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    itemStyle={{color: THEME.foreground}}
                  />
                  <Legend
                    verticalAlign='bottom'
                    height={36}
                    iconType='circle'
                    wrapperStyle={{fontSize: "12px", color: THEME.muted}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Bar Chart */}
          <div className='rounded-xl border border-white/10 bg-surface p-6'>
            <h2 className='font-mono text-xs text-muted uppercase tracking-wider mb-6'>
              CV Version A/B Test
            </h2>
            <div className='h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={cvData}
                  margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <XAxis
                    dataKey='name'
                    stroke={THEME.muted}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke={THEME.muted}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{fill: THEME.foreground, opacity: 0.05}}
                    contentStyle={customTooltipStyle}
                  />
                  <Bar
                    dataKey='total'
                    name='Gesamt'
                    fill='rgba(255,255,255,0.1)'
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                  <Bar
                    dataKey='interviews'
                    name='Interviews'
                    fill={THEME.accent}
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
