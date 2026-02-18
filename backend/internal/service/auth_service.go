package service

import (
	"context"
	"errors"

	"job-dashboard-backend/internal/middleware"
	"job-dashboard-backend/internal/models"
	"job-dashboard-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"

	"github.com/google/uuid"
)

type AuthService struct {
	repo *repository.UserRepository
}

func NewAuthService(r *repository.UserRepository) *AuthService {
	return &AuthService{repo: r}
}

func (s *AuthService) Register(ctx context.Context, email, password string) error {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)
	user := models.User{
		ID:           uuid.NewString(),
		Email:        email,
		PasswordHash: string(hash),
		Provider:     "local",
	}
	return s.repo.Create(ctx, user)
}

func (s *AuthService) Login(ctx context.Context, email, password string) (string, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return "", errors.New("user not found")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", errors.New("wrong password")
	}

	token, err := middleware.GenerateToken(user.ID)
	return token, err
}
