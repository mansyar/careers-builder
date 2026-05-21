import type Database from 'better-sqlite3';

export interface ColumnInfo {
  name: string;
  type: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface DbSchemaResult {
  tables: TableInfo[];
}

/**
 * Queries the database schema and returns table/column information.
 * Used by the debug endpoint and automated tests.
 */
export function getDbSchema(db: Database.Database): DbSchemaResult {
  const tableRows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];

  const tables: TableInfo[] = tableRows.map((row) => {
    const columns = db.prepare(`PRAGMA table_info(${row.name})`).all() as {
      name: string;
      type: string;
    }[];

    return {
      name: row.name,
      columns: columns.map((col) => ({
        name: col.name,
        type: col.type,
      })),
    };
  });

  return { tables };
}
