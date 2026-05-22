/**
 * Server-only helper for DB schema debugging.
 * Uses .server.ts convention — excluded from client bundles.
 */
import { DatabaseManager } from './server/db';
import { getDbSchema } from './server/db-schema';
import type Database from 'better-sqlite3';

/**
 * Returns a JSON response listing all database tables and their columns.
 */
export function handleDbSchema(db?: Database.Database): Response {
  const database = db ?? DatabaseManager.getInstance();
  const schema = getDbSchema(database);
  return Response.json(schema);
}
