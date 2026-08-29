package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgres() (*pgxpool.Pool, error) {
	// 1. Zuerst prüfen, ob die fertige URL existiert (Render / Docker Compose)
	dsn := os.Getenv("DATABASE_URL")

	// 2. Fallback: Nur wenn sie leer ist, baue sie aus den Einzel-Variablen zusammen
	if dsn == "" {
		dsn = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s",
			os.Getenv("DB_USER"),
			os.Getenv("DB_PASSWORD"),
			os.Getenv("DB_HOST"),
			os.Getenv("DB_PORT"),
			os.Getenv("DB_NAME"),
		)
	}

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	config.MaxConns = 50 // Erlaube bis zu 50 parallele Verbindungen für Load Tests
	config.MinConns = 10 // Halte 10 Verbindungen immer warm
	config.MaxConnIdleTime = 15 * time.Minute

	return pgxpool.NewWithConfig(context.Background(), config)
}
