package models

import "time"

type Application struct {
	ID        string    `json:"id"`
	Company   string    `json:"company"`
	Platform  string    `json:"platform"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
