package repository

import (
	"context"
	"job-dashboard-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, u models.User) error {
	query := `INSERT INTO users (id, email, password_hash, provider) VALUES ($1, $2, $3, $4)`
	_, err := r.db.Exec(ctx, query, u.ID, u.Email, u.PasswordHash, u.Provider)
	return err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	u := &models.User{}
	query := `SELECT id, email, password_hash FROM users WHERE email = $1`
	err := r.db.QueryRow(ctx, query, email).Scan(&u.ID, &u.Email, &u.PasswordHash)
	return u, err
}
