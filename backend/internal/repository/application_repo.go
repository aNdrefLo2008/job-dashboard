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

func (r *ApplicationRepository) GetAll(ctx context.Context, userID string) ([]models.Application, error) {
	rows, err := r.db.Query(ctx,
		"SELECT id, company, platform, status, created_at FROM applications WHERE user_id = $1", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var apps []models.Application
	for rows.Next() {
		var a models.Application
		if err := rows.Scan(&a.ID, &a.Company, &a.Platform, &a.Status, &a.CreatedAt); err != nil {
			return nil, err
		}
		apps = append(apps, a)
	}
	return apps, nil
}

func (r *ApplicationRepository) Create(ctx context.Context, a models.Application) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO applications (id, company, platform, status, user_id) VALUES ($1,$2,$3,$4,$5)`,
		a.ID, a.Company, a.Platform, a.Status, a.UserID)
	return err
}

func (r *ApplicationRepository) GetByID(ctx context.Context, id, userID string) (*models.Application, error) {
	var a models.Application
	err := r.db.QueryRow(ctx,
		`SELECT id, company, platform, status, created_at FROM applications WHERE id=$1 AND user_id=$2`,
		id, userID).Scan(&a.ID, &a.Company, &a.Platform, &a.Status, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *ApplicationRepository) Update(ctx context.Context, a models.Application, userID string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE applications SET company=$1, platform=$2, status=$3 WHERE id=$4 AND user_id=$5`,
		a.Company, a.Platform, a.Status, a.ID, userID)
	return err
}

func (r *ApplicationRepository) Delete(ctx context.Context, id, userID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM applications WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}
