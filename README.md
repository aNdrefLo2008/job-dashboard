# Job Application Dashboard - Backend

A robust, scalable REST API built with **Golang** to manage job applications. This project follows **Clean Architecture** principles (Repository-Service-Pattern) and is designed for high performance and observability.

## 🚀 Features

- **Full CRUD API**: Manage job applications with ease.
- **Authentication**: Secure user registration and login using **JWT (JSON Web Tokens)**.
- **Clean Architecture**: Separation of concerns using Handlers, Services, and Repositories.
- **Observability**: Real-time metrics exported via **Prometheus**.
- **Infrastructure**: Ready for production with **Docker**, **docker-compose**, and **Nginx** as a reverse proxy.
- **Resilience**: Implements **Graceful Shutdown** and automated health checks.

## 🛠 Tech Stack

- **Language**: Go (Golang)
- **Router**: Chi (v5)
- **Database**: PostgreSQL
- **DevOps**: Docker, Nginx, Prometheus
- **Environment Management**: Godotenv

## 📁 Project Structure

```text
├── cmd/api/            # Entry point (main.go)
├── internal/           # Core logic (Handlers, Services, Repositories, Models)
├── migrations/         # SQL database migrations
├── nginx.conf          # Reverse proxy configuration
├── prometheus.yml      # Monitoring configuration
├── Dockerfile          # Containerization
└── docker-compose.yml  # Multi-container orchestration
