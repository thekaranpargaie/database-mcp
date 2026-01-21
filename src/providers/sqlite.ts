/**
 * SQLite Database Provider
 */

import Database from 'better-sqlite3';
import { IDatabaseProvider } from './interface';
import {
  TableMetadata,
  ForeignKeyMetadata,
  QueryResult,
  ConnectionConfig,
  ColumnMetadata,
} from '../types';

export class SQLiteProvider implements IDatabaseProvider {
  private db: Database.Database | null = null;
  private filename: string = '';

  async connect(config: ConnectionConfig): Promise<void> {
    if (!config.filename) {
      throw new Error('SQLite requires filename parameter');
    }

    this.filename = config.filename;
    this.db = new Database(config.filename, { fileMustExist: false });

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Test connection
    try {
      this.db.prepare('SELECT 1').get();
    } catch (error) {
      throw new Error(`Failed to connect to SQLite: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async listDatabases(): Promise<string[]> {
    // SQLite has only one database per file
    return [this.filename];
  }

  async listSchemas(): Promise<string[]> {
    // SQLite doesn't have schemas (or main is the only schema)
    return ['main'];
  }

  async listTables(schema?: string): Promise<string[]> {
    if (!this.db) throw new Error('Not connected');

    const tables = this.db
      .prepare(
        `SELECT name FROM sqlite_master 
         WHERE type='table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`
      )
      .all();

    return tables.map((t: any) => t.name);
  }

  async describeTable(tableName: string, schema?: string): Promise<TableMetadata> {
    if (!this.db) throw new Error('Not connected');

    // Get columns
    const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();

    const foreignKeys = await this.getForeignKeys(tableName, schema);

    const columnMetadata: ColumnMetadata[] = (columns as any[]).map((col) => ({
      name: col.name,
      type: col.type,
      nullable: col.notnull === 0,
      defaultValue: col.dflt_value,
      isPrimaryKey: col.pk === 1,
      isForeignKey: foreignKeys.some((fk) => fk.column === col.name),
    }));

    // Get row count
    const countResult = this.db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();

    return {
      name: tableName,
      schema: 'main',
      columns: columnMetadata,
      foreignKeys,
      primaryKey: columnMetadata.filter((c) => c.isPrimaryKey).map((c) => c.name),
      rowCount: (countResult as any).count,
    };
  }

  async getForeignKeys(tableName: string, schema?: string): Promise<ForeignKeyMetadata[]> {
    if (!this.db) throw new Error('Not connected');

    const fks = this.db.prepare(`PRAGMA foreign_key_list(${tableName})`).all();

    return (fks as any[]).map((fk) => ({
      name: `fk_${tableName}_${fk.from}`,
      column: fk.from,
      referencedTable: fk.table,
      referencedColumn: fk.to,
      onUpdate: fk.on_update,
      onDelete: fk.on_delete,
    }));
  }

  async runQuery(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected');

    const stmt = this.db.prepare(sql);

    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const rows = params ? stmt.all(...params) : stmt.all();
        return {
          rows: rows as any[],
          rowCount: rows.length,
        };
      } else {
        const info = params ? stmt.run(...params) : stmt.run();
        return {
          rows: [],
          rowCount: info.changes,
        };
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.db) return false;

    try {
      this.db.prepare('SELECT 1').get();
      return true;
    } catch {
      return false;
    }
  }
}
