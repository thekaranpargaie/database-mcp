/**
 * MySQL/MariaDB Database Provider
 */

import mysql from 'mysql2/promise';
import { IDatabaseProvider } from './interface';
import {
  TableMetadata,
  ForeignKeyMetadata,
  QueryResult,
  ConnectionConfig,
  ColumnMetadata,
} from '../types';

export class MySQLProvider implements IDatabaseProvider {
  private connection: mysql.Connection | null = null;
  private currentDatabase: string = '';

  async connect(config: ConnectionConfig): Promise<void> {
    this.connection = await mysql.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.username,
      password: config.password,
      database: config.database,
    });

    this.currentDatabase = config.database || '';

    // Test connection
    try {
      await this.connection.query('SELECT 1');
    } catch (error) {
      throw new Error(`Failed to connect to MySQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async listDatabases(): Promise<string[]> {
    if (!this.connection) throw new Error('Not connected');

    const [rows] = await this.connection.query('SHOW DATABASES');
    return (rows as any[]).map((row) => row.Database);
  }

  async listSchemas(): Promise<string[]> {
    // In MySQL, schemas are databases
    return this.listDatabases();
  }

  async listTables(schema?: string): Promise<string[]> {
    if (!this.connection) throw new Error('Not connected');

    const dbToUse = schema || this.currentDatabase;
    const [rows] = await this.connection.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [dbToUse]
    );

    return (rows as any[]).map((row) => row.TABLE_NAME);
  }

  async describeTable(tableName: string, schema?: string): Promise<TableMetadata> {
    if (!this.connection) throw new Error('Not connected');

    const dbToUse = schema || this.currentDatabase;

    // Get columns
    const [columnsRows] = await this.connection.query(
      `SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH,
        NUMERIC_PRECISION,
        NUMERIC_SCALE,
        COLUMN_KEY
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION`,
      [dbToUse, tableName]
    );

    const foreignKeys = await this.getForeignKeys(tableName, schema);

    const columns: ColumnMetadata[] = (columnsRows as any[]).map((row) => ({
      name: row.COLUMN_NAME,
      type: row.DATA_TYPE,
      nullable: row.IS_NULLABLE === 'YES',
      defaultValue: row.COLUMN_DEFAULT,
      isPrimaryKey: row.COLUMN_KEY === 'PRI',
      isForeignKey: foreignKeys.some((fk) => fk.column === row.COLUMN_NAME),
      maxLength: row.CHARACTER_MAXIMUM_LENGTH,
      precision: row.NUMERIC_PRECISION,
      scale: row.NUMERIC_SCALE,
    }));

    // Get row count
    const [countRows] = await this.connection.query(
      `SELECT COUNT(*) as count FROM \`${dbToUse}\`.\`${tableName}\``
    );

    return {
      name: tableName,
      schema: dbToUse,
      columns,
      foreignKeys,
      primaryKey: columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
      rowCount: (countRows as any[])[0].count,
    };
  }

  async getForeignKeys(tableName: string, schema?: string): Promise<ForeignKeyMetadata[]> {
    if (!this.connection) throw new Error('Not connected');

    const dbToUse = schema || this.currentDatabase;

    const [rows] = await this.connection.query(
      `SELECT
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [dbToUse, tableName]
    );

    return (rows as any[]).map((row) => ({
      name: row.CONSTRAINT_NAME,
      column: row.COLUMN_NAME,
      referencedTable: row.REFERENCED_TABLE_NAME,
      referencedColumn: row.REFERENCED_COLUMN_NAME,
    }));
  }

  async runQuery(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.connection) throw new Error('Not connected');

    const [rows, fields] = await this.connection.query(sql, params);

    return {
      rows: rows as any[],
      rowCount: Array.isArray(rows) ? rows.length : 0,
      fields: (fields as any[])?.map((f) => ({
        name: f.name,
        type: f.type?.toString() || 'unknown',
      })),
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.connection) return false;

    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
