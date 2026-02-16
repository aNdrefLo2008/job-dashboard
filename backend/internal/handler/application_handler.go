package handler

import (
	"encoding/json"
	"net/http"

	"job-dashboard-backend/internal/service"
)

type ApplicationHandler struct {
	service *service.ApplicationService
}

func NewApplicationHandler(service *service.ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{service: service}
}

func (h *ApplicationHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	apps, err := h.service.GetAll(r.Context())

	if err != nil {
		http.Error(w, "Failed to retrieve applications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apps)
}
