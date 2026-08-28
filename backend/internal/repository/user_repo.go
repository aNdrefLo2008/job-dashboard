package repository

import (
	"context"
	"job-dashboard-backend/internal/models"

	"github.com/google/uuid"
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

func (r *UserRepository) GetOrCreateGoogleUser(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	// 1. Prüfen ob User existiert
	err := r.db.QueryRow(ctx, "SELECT id, email FROM users WHERE email = $1", email).Scan(&user.ID, &user.Email)
	if err == nil {
		return &user, nil
	}

	// 2. Falls nicht -> Neuen Google User anlegen
	newID := uuid.NewString()
	_, err = r.db.Exec(ctx,
		"INSERT INTO users (id, email, password_hash, provider) VALUES ($1, $2, $3, $4)",
		newID, email, "OAUTH_GOOGLE_USER", "google")
	if err != nil {
		return nil, err
	}

	user.ID = newID
	user.Email = email
	return &user, nil
}
