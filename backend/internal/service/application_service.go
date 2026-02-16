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

func (s *ApplicationService) GetAll(ctx context.Context) ([]models.Application, error) {
	return s.repo.GetAll(ctx)
}

func (s *ApplicationService) Create(ctx context.Context, a models.Application) error {
	return s.repo.Create(ctx, a)
}

func (s *ApplicationService) GetByID(ctx context.Context, id string) (*models.Application, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *ApplicationService) Update(ctx context.Context, a models.Application) error {
	return s.repo.Update(ctx, a)
}

func (s *ApplicationService) Delete(ctx context.Context, id string) error {
	return s.repo.Delete(ctx, id)
}
