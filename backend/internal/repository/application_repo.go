package repository

import (
	"context"
	"job-dashboard-backend/internal/models"

	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ApplicationRepository struct {
	db *pgxpool.Pool
}

func NewApplicationRepository(db *pgxpool.Pool) *ApplicationRepository {
	return &ApplicationRepository{db: db}
}

func (r *ApplicationRepository) GetAll(ctx context.Context) ([]models.Application, error) {
	// We only select the columns that exist in your Application struct
	rows, err := r.db.Query(ctx, "SELECT id, company, platform, status, created_at FROM applications")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []models.Application
	for rows.Next() {
		var a models.Application
		// The number of arguments in Scan MUST match the number of columns in SELECT
		err := rows.Scan(&a.ID, &a.Company, &a.Platform, &a.Status, &a.CreatedAt)
		if err != nil {
			log.Printf("Scan error: %v", err) // Log this so you see it in the console
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, nil
}
