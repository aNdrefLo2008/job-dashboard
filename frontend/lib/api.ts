const API_URL = process.env.NEXT_PUBLIC_API_URL

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

  if (res.status === 401) {
    localStorage.removeItem("token")
    window.location.href = "/login"
    throw new Error("Session abgelaufen. Bitte neu einloggen.")
  }

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
  notes?: string
  job_url?: string
  salary?: string
  cv_version?: string
}

export async function getApplications(page = 1, limit = 50): Promise<BackendApplication[]> {
  const res = await fetch(`${API_URL}/applications/?page=${page}&limit=${limit}`, {
    headers: { ...getAuthHeader() },
  })

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token") // Ungültigen Token löschen
      window.location.href = "/login"  // Automatisch zum Login schicken
    }
    throw new Error("Sitzung abgelaufen. Bitte neu einloggen.")
  }

  if (!res.ok) throw new Error("Fehler beim Laden der Bewerbungen")
  return res.json()
}

export async function createApplication(app: { 
  company: string; 
  platform: string; 
  status: string; 
  created_at?: string; 
  notes?: string;
  job_url?: string;
  salary?: string;
  cv_version?: string;
}): Promise<void> {
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

export const deleteApplication = async (id: string) => {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Fehler beim Löschen")
}

export const updateApplication = async (id: string, data: any) => {
  const token = localStorage.getItem("token")
  const res = await fetch(`${API_URL}/applications/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Fehler beim Update")
}