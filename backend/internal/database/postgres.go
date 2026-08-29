package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgres() (*pgxpool.Pool, error) {
	// 1. DSN zusammenbauen
	dsn := os.Getenv("DATABASE_URL")
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

	// 2. Config parsen
	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, err
	}

	config.MaxConns = 50
	config.MinConns = 10
	config.MaxConnIdleTime = 15 * time.Minute

	// 3. WICHTIG: Zuerst den Pool (Verbindung) erstellen!
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	// 4. DANN die Tabellen anlegen
	// Wenn init.sql im Repo-Root liegt und du im backend-Ordner bist, nutze "../init.sql"
	// Wenn du sie in den backend-Ordner verschoben hast, nutze "init.sql"
	sqlBytes, err := os.ReadFile("init.sql")
	if err != nil {
		log.Printf("Konnte init.sql nicht lesen (Tabellen wurden nicht angelegt): %v", err)
	} else {
		_, err = pool.Exec(context.Background(), string(sqlBytes))
		if err != nil {
			log.Printf("Fehler beim Ausführen von init.sql: %v", err)
		} else {
			log.Println("✅ Datenbank-Tabellen erfolgreich initialisiert!")
		}
	}

	// 5. Den fertigen Pool zurückgeben
	return pool, nil
}
