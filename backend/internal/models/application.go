package models

import "time"

type Application struct {
	ID        string    `json:"id"`
	Company   string    `json:"company"`
	Platform  string    `json:"platform"`
	Status    string    `json:"status"`
	UserID    string    `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
	Notes     string    `json:"notes"`
	JobURL    string    `json:"job_url"`
	Salary    string    `json:"salary,omitempty" db:"salary"`
	CvVersion string    `json:"cv_version,omitempty" db:"cv_version"`
}
