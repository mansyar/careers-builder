import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';

export interface DatabaseConfig {
  path: string;
}

export class DatabaseManager {
  private static instance: DatabaseType | undefined;

  private constructor() {
    // Singleton — use getInstance()
  }

  static getInstance(config?: DatabaseConfig): DatabaseType {
    if (!DatabaseManager.instance) {
      const dbPath = config?.path ?? './data/local_vault.db';
      DatabaseManager.instance = new Database(dbPath);
      DatabaseManager.instance.pragma('journal_mode = WAL');
      DatabaseManager.instance.pragma('foreign_keys = ON');
    }
    return DatabaseManager.instance;
  }

  static resetInstance(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.close();
      DatabaseManager.instance = undefined;
    }
  }
}
