CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    provider TEXT,
    provider_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);