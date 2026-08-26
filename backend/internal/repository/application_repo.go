package repository

import (
	"context"
	"job-dashboard-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ApplicationRepository struct {
	db *pgxpool.Pool
}

func NewApplicationRepository(db *pgxpool.Pool) *ApplicationRepository {
	return &ApplicationRepository{db: db}
}

func (r *ApplicationRepository) GetAll(ctx context.Context, userID string, limit, offset int) ([]models.Application, error) {
	query := `
        SELECT id, company, platform, status, user_id, created_at, notes, job_url, salary, cv_version
        FROM applications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `

	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []models.Application
	for rows.Next() {
		var app models.Application
		if err := rows.Scan(&app.ID, &app.Company, &app.Platform, &app.Status, &app.UserID, &app.CreatedAt, &app.Notes, &app.JobURL, &app.Salary, &app.CvVersion); err != nil {
			return nil, err
		}
		apps = append(apps, app)
	}

	return apps, nil
}

func (r *ApplicationRepository) Create(ctx context.Context, a models.Application) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO applications (id, company, platform, status, created_at, user_id, notes, job_url, salary, cv_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		a.ID, a.Company, a.Platform, a.Status, a.CreatedAt, a.UserID, a.Notes, a.JobURL, a.Salary, a.CvVersion)
	return err
}

func (r *ApplicationRepository) GetByID(ctx context.Context, id, userID string) (*models.Application, error) {
	var a models.Application
	err := r.db.QueryRow(ctx,
		`SELECT id, company, platform, status, created_at, notes, job_url, salary, cv_version FROM applications WHERE id=$1 AND user_id=$2`,
		id, userID).Scan(&a.ID, &a.Company, &a.Platform, &a.Status, &a.CreatedAt, &a.Notes, &a.JobURL, &a.Salary, &a.CvVersion)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *ApplicationRepository) Update(ctx context.Context, a models.Application, userID string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE applications SET company=$1, platform=$2, status=$3, notes=$4, job_url=$5, salary=$6, cv_version=$7 WHERE id=$8 AND user_id=$9`,
		a.Company, a.Platform, a.Status, a.Notes, a.JobURL, a.Salary, a.CvVersion, a.ID, userID)
	return err
}

func (r *ApplicationRepository) Delete(ctx context.Context, id, userID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM applications WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}
