CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    applied_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);