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
		[]string{"method", "path", "status"}, // These are the "labels" we can filter by in Grafana
	)

	// 2. Track a core business metric: Jobs Created
	ApplicationsCreatedTotal = promauto.NewCounter(
		prometheus.CounterOpts{
			Name: "applications_created_total",
			Help: "Total number of job applications created across all users",
		},
	)
)
