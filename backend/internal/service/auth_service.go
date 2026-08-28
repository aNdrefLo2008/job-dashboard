package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"job-dashboard-backend/internal/middleware"
	"job-dashboard-backend/internal/models"
	"job-dashboard-backend/internal/repository"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
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

type GoogleTokenInfo struct {
	Email string `json:"email"`
}

func (s *AuthService) GoogleLogin(ctx context.Context, idToken string) (string, error) {
	resp, err := http.Get(fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", idToken))
	if err != nil || resp.StatusCode != http.StatusOK {
		return "", errors.New("ungültiger Google Token")
	}
	defer resp.Body.Close()

	var gInfo GoogleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&gInfo); err != nil {
		return "", err
	}

	// s.repo statt s.userRepo nutzen:
	user, err := s.repo.GetOrCreateGoogleUser(ctx, gInfo.Email)
	if err != nil {
		return "", err
	}

	return middleware.GenerateToken(user.ID)
}
