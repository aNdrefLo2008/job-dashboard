package database

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgres() (*pgxpool.Pool, error) {

	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	// Füge diese Zeilen hinzu:
	config.MaxConns = 50 // Erlaube bis zu 50 parallele Verbindungen für Load Tests
	config.MinConns = 10 // Halte 10 Verbindungen immer warm
	config.MaxConnIdleTime = 15 * time.Minute

	return pgxpool.NewWithConfig(context.Background(), config)
}
