import type Database from 'better-sqlite3';

const STRUCTURAL_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  target_settings TEXT
);

CREATE TABLE IF NOT EXISTS cv_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  active_version_id INTEGER REFERENCES cv_profile_versions(id)
);

CREATE TABLE IF NOT EXISTS cv_profile_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cv_profile_id INTEGER NOT NULL REFERENCES cv_profiles(id),
  version_number INTEGER NOT NULL,
  version_label TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  full_cv_json TEXT
);

CREATE TABLE IF NOT EXISTS job_postings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_url TEXT UNIQUE NOT NULL,
  title TEXT,
  company TEXT,
  location TEXT,
  description_raw TEXT,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const VECTOR_TABLES = `
CREATE VIRTUAL TABLE IF NOT EXISTS vec_cv_profile_versions USING vec0(
  cv_version_id INTEGER PRIMARY KEY,
  biography_embedding float[384]
);

CREATE VIRTUAL TABLE IF NOT EXISTS vec_job_postings USING vec0(
  job_id INTEGER PRIMARY KEY,
  description_embedding float[384]
);
`;

/** Applies structural table migrations (works without sqlite-vec extension). */
export function runStructuralMigrations(db: Database.Database): void {
  db.exec(STRUCTURAL_TABLES);
}

/** Applies vector table migrations (requires sqlite-vec extension to be loaded). */
export function runVectorMigrations(db: Database.Database): void {
  db.exec(VECTOR_TABLES);
}

/** Applies all migrations in sequence. */
export function runMigrations(db: Database.Database): void {
  runStructuralMigrations(db);
  runVectorMigrations(db);
}
