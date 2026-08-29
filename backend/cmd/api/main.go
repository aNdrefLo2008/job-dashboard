package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"job-dashboard-backend/internal/database"
	"job-dashboard-backend/internal/handler"
	"job-dashboard-backend/internal/middleware"
	"job-dashboard-backend/internal/repository"
	"job-dashboard-backend/internal/service"
)

func main() {
	_ = godotenv.Load()

	// 1. Datenbank-Verbindung aufbauen
	db, err := database.NewPostgres()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 2. Repositories, Services & Handler ERST initialisieren
	appRepo := repository.NewApplicationRepository(db)
	appService := service.NewApplicationService(appRepo)
	appHandler := handler.NewApplicationHandler(appService)

	userRepo := repository.NewUserRepository(db)
	authService := service.NewAuthService(userRepo)
	authHandler := handler.NewAuthHandler(authService)

	// 3. Chi Router initialisieren
	r := chi.NewRouter()

	r.Use(middleware.CORS)
	r.Use(middleware.MetricsMiddleware)

	// 4. Routen registrieren
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("OK"))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("OK"))
		log.Println("Health check endpoint hit")
		log.Println("Database connection status:", db.Ping(context.Background()))
	})

	r.Handle("/metrics", promhttp.Handler())

	// Auth-Routen
	r.Post("/auth/register", authHandler.Register)
	r.Post("/auth/login", authHandler.Login)
	r.Post("/auth/google", authHandler.GoogleLogin) // <-- Saubere Chi-Route

	// Geschützte Application-Routen
	r.Route("/applications", func(r chi.Router) {
		r.Use(middleware.JWTMiddleware)

		r.Post("/", appHandler.Create)
		r.Get("/", appHandler.GetAll)
		r.Get("/{id}", appHandler.GetByID)
		r.Put("/{id}", appHandler.Update)
		r.Delete("/{id}", appHandler.Delete)
	})

	log.Println("Routes registered successfully")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:    ":" + port,
		Handler: r,
	}

	go func() {
		log.Printf("Starting server on port %s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	log.Println("Server stopped")
}
