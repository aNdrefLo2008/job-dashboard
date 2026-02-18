package handler

import (
	"encoding/json"
	"job-dashboard-backend/internal/models"
	"job-dashboard-backend/internal/service"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ApplicationHandler struct {
	service *service.ApplicationService
}

func NewApplicationHandler(s *service.ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{service: s}
}

func (h *ApplicationHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	apps, err := h.service.GetAll(r.Context(), userID)
	if err != nil {
		http.Error(w, "server error", 500)
		return
	}
	json.NewEncoder(w).Encode(apps)
}

func (h *ApplicationHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	var app models.Application
	if err := json.NewDecoder(r.Body).Decode(&app); err != nil {
		http.Error(w, "bad request", 400)
		return
	}

	app.ID = uuid.NewString() // Generate ID here
	app.UserID = userID       // Link to User

	if err := h.service.Create(r.Context(), app); err != nil {
		http.Error(w, "server error", 500)
		return
	}
	w.WriteHeader(201)
}

func (h *ApplicationHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	id := chi.URLParam(r, "id")
	app, err := h.service.GetByID(r.Context(), id, userID)
	if err != nil {
		http.Error(w, "not found", 404)
		return
	}
	json.NewEncoder(w).Encode(app)
}

func (h *ApplicationHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	id := chi.URLParam(r, "id")
	var app models.Application
	json.NewDecoder(r.Body).Decode(&app)
	app.ID = id

	if err := h.service.Update(r.Context(), app, userID); err != nil {
		http.Error(w, "server error", 500)
		return
	}
	w.WriteHeader(204)
}

func (h *ApplicationHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(string)
	id := chi.URLParam(r, "id")
	if err := h.service.Delete(r.Context(), id, userID); err != nil {
		http.Error(w, "server error", 500)
		return
	}
	w.WriteHeader(204)
}
