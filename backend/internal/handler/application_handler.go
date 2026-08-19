package handler

import (
	"encoding/json"
	"job-dashboard-backend/internal/metrics"
	"job-dashboard-backend/internal/models"
	"job-dashboard-backend/internal/service"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"job-dashboard-backend/internal/middleware"
	"strconv"

	"context"
	"time"
)

type ApplicationHandler struct {
	service *service.ApplicationService
}

func NewApplicationHandler(s *service.ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{service: s}
}

func (h *ApplicationHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	// User-ID aus dem JWT-Kontext holen
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// Query-Parameter auslesen
	limitStr := r.URL.Query().Get("limit")
	pageStr := r.URL.Query().Get("page")

	// Standards für Pagination
	limit := 10
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	page := 1
	if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
		page = p
	}

	offset := (page - 1) * limit

	// Service aufrufen
	apps, err := h.service.GetAll(r.Context(), userID, limit, offset)
	if err != nil {
		http.Error(w, "failed to get applications", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apps)
}

func (h *ApplicationHandler) Create(w http.ResponseWriter, r *http.Request) {
	// 1. Richtigen Kontext-Key nutzen (typsicher wie in GetAll)
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var app models.Application
	if err := json.NewDecoder(r.Body).Decode(&app); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	app.ID = uuid.NewString()
	app.UserID = userID

	// 2. 5-Sekunden Timeout für den DB-Schreibvorgang erstellen
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// 3. 'ctx' mit Timeout an die Datenbank weiterreichen
	if err := h.service.Create(ctx, app); err != nil {
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}

	metrics.ApplicationsCreatedTotal.Inc()

	w.WriteHeader(http.StatusCreated)
}

func (h *ApplicationHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	id := chi.URLParam(r, "id")
	app, err := h.service.GetByID(r.Context(), id, userID)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(app)
}

func (h *ApplicationHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
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
