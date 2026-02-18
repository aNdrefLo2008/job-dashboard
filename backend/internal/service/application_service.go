package service

import (
	"context"
	"job-dashboard-backend/internal/models"
	"job-dashboard-backend/internal/repository"
)

type ApplicationService struct {
	repo *repository.ApplicationRepository
}

func NewApplicationService(repo *repository.ApplicationRepository) *ApplicationService {
	return &ApplicationService{repo: repo}
}

func (s *ApplicationService) GetAll(ctx context.Context, userID string) ([]models.Application, error) {
	return s.repo.GetAll(ctx, userID)
}

func (s *ApplicationService) Create(ctx context.Context, a models.Application) error {
	return s.repo.Create(ctx, a)
}

func (s *ApplicationService) GetByID(ctx context.Context, id, userID string) (*models.Application, error) {
	return s.repo.GetByID(ctx, id, userID)
}

func (s *ApplicationService) Update(ctx context.Context, a models.Application, userID string) error {
	return s.repo.Update(ctx, a, userID)
}

func (s *ApplicationService) Delete(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}
