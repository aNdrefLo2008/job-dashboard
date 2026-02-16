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
