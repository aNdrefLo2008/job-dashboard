package middleware

import (
	"net/http"
	"strconv"

	"job-dashboard-backend/internal/metrics"
)

// statusRecorder is a clever Go trick. We wrap the standard ResponseWriter
// so we can "catch" the status code the handler decides to send.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

// MetricsMiddleware intercepts the request and counts it
func MetricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// We don't want to track Prometheus scraping itself, it creates noise
		if r.URL.Path == "/metrics" {
			next.ServeHTTP(w, r)
			return
		}

		// Wrap the writer
		recorder := &statusRecorder{
			ResponseWriter: w,
			status:         http.StatusOK, // Default to 200
		}

		// Let the actual handler process the request
		next.ServeHTTP(recorder, r)

		// Record the metric based on what happened
		metrics.HttpRequestsTotal.WithLabelValues(
			r.Method,
			r.URL.Path,
			strconv.Itoa(recorder.status),
		).Inc()
	})
}
