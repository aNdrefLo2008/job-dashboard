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

	"job-dashboard-backend/internal/database"
	"job-dashboard-backend/internal/handler"
	"job-dashboard-backend/internal/repository"
	"job-dashboard-backend/internal/service"
)

func main() {

	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: No .env file found or unable to load it")
	}

	r := chi.NewRouter()

	db, err := database.NewPostgres()

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	appRepo := repository.NewApplicationRepository(db)
	appService := service.NewApplicationService(appRepo)
	appHandler := handler.NewApplicationHandler(appService)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("OK"))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("OK"))
		log.Println("Health check endpoint hit")
		log.Println("Database connection status:", db.Ping(context.Background())) // Check DB connection
	})

	r.Get("/applications", appHandler.GetAll)

	log.Println("Routes registered")

	server := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	go func() {
		log.Println("Starting server on :8080")
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
