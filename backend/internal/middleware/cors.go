package middleware

import "net/http"

func CORS(next http.Handler) http.Handler {
	// 1. Liste aller erlaubten Domains (inkl. https:// nicht vergessen!)
	allowedOrigins := map[string]bool{
		"http://localhost:4000":                                             true,
		"https://job-dashboard-hazel.vercel.app":                            true,
		"https://job-dashboard-git-main-andreflo2008s-projects.vercel.app":  true,
		"https://job-dashboard-5eyqviyn0-andreflo2008s-projects.vercel.app": true,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 2. Den Origin der aktuellen Anfrage auslesen
		origin := r.Header.Get("Origin")

		// 3. Prüfen, ob der Origin in unserer Liste erlaubt ist
		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// WICHTIG: Falls dein Frontend Cookies oder Auth-Header mitsendet
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		// 4. Preflight-Anfragen (OPTIONS) direkt mit 200 OK beantworten
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
