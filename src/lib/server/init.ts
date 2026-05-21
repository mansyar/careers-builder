import { DatabaseManager } from './db';
import { runMigrations } from './migrations';

/**
 * Initializes the database on server startup.
 * Creates the DatabaseManager singleton and runs all migrations.
 * This module is only imported on the server side (guarded in router.tsx).
 */
export function initDatabase(): void {
  try {
    const db = DatabaseManager.getInstance();
    runMigrations(db);
    console.log('[db] Database initialized and migrations applied successfully.');
  } catch (error) {
    console.error('[db] Failed to initialize database:', error);
  }
}
