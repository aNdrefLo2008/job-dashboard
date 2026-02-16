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

func (r *ApplicationRepository) Create(ctx context.Context, a models.Application) error {

	_, err := r.db.Exec(ctx,
		`INSERT INTO applications (id, company, platform, status) 
		 VALUES ($1,$2,$3,$4)`,
		a.ID, a.Company, a.Platform, a.Status,
	)

	if err != nil {
		log.Printf("Create application error: %v", err) // Log this so you see it in the console
		return err
	}

	return err
}

func (r *ApplicationRepository) GetByID(ctx context.Context, id string) (*models.Application, error) {

	row := r.db.QueryRow(ctx,
		`SELECT id, company, platform, status, created_at
		 FROM applications WHERE id=$1`, id)

	var a models.Application

	err := row.Scan(&a.ID, &a.Company, &a.Platform, &a.Status, &a.CreatedAt)
	if err != nil {
		return nil, err
	}

	return &a, nil
}

func (r *ApplicationRepository) Update(ctx context.Context, a models.Application) error {

	_, err := r.db.Exec(ctx,
		`UPDATE applications 
		 SET company=$1, platform=$2, status=$3 
		 WHERE id=$4`,
		a.Company, a.Platform, a.Status, a.ID)

	return err
}

func (r *ApplicationRepository) Delete(ctx context.Context, id string) error {

	_, err := r.db.Exec(ctx,
		`DELETE FROM applications WHERE id=$1`, id)

	return err
}
