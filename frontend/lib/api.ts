const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost"

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) throw new Error("Login fehlgeschlagen")
  const data = await res.json()
  return data.token
}

export interface BackendApplication {
  id: string
  company: string
  platform: string
  status: string
  user_id: string
  created_at: string
}

export async function getApplications(page = 1, limit = 50): Promise<BackendApplication[]> {
  const res = await fetch(`${API_URL}/applications/?page=${page}&limit=${limit}`, {
    headers: { ...getAuthHeader() },
  })

  if (!res.ok) throw new Error("Fehler beim Laden der Bewerbungen")
  return res.json()
}

export async function createApplication(app: { company: string; platform: string; status: string; created_at?: string }): Promise<void> {
  const res = await fetch(`${API_URL}/applications/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
    body: JSON.stringify(app),
  })

  if (!res.ok) throw new Error("Fehler beim Erstellen der Bewerbung")
}