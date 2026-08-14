package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	// 1. Track every HTTP request (Method, Path, and Status Code)
	HttpRequestsTotal = promauto.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests processed by the API",
		},
		[]string{"method", "path", "status"},
	)

	// 2. Track a core business metric: Jobs Created
	ApplicationsCreatedTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "applications_created_total",
			Help: "Total number of job applications created across all users",
		},
	)

	// 3. Track how long each request takes
	HttpRequestDuration = promauto.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "Duration of HTTP requests in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path"},
	)
)
