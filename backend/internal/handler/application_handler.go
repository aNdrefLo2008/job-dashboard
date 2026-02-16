package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"

	"job-dashboard-backend/internal/models"
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

func (h *ApplicationHandler) Create(w http.ResponseWriter, r *http.Request) {

	var app models.Application

	err := json.NewDecoder(r.Body).Decode(&app)
	if err != nil {
		http.Error(w, err.Error(), 400)
		return
	}

	err = h.service.Create(r.Context(), app)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (h *ApplicationHandler) GetByID(w http.ResponseWriter, r *http.Request) {

	id := chi.URLParam(r, "id")

	app, err := h.service.GetByID(r.Context(), id)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}

	json.NewEncoder(w).Encode(app)
}

func (h *ApplicationHandler) Update(w http.ResponseWriter, r *http.Request) {

	id := chi.URLParam(r, "id")

	var app models.Application
	json.NewDecoder(r.Body).Decode(&app)

	app.ID = id

	err := h.service.Update(r.Context(), app)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.WriteHeader(204)
}

func (h *ApplicationHandler) Delete(w http.ResponseWriter, r *http.Request) {

	id := chi.URLParam(r, "id")

	err := h.service.Delete(r.Context(), id)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.WriteHeader(204)
}
