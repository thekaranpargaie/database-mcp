/**
 * PostgreSQL Database Provider
 */

import { Pool, PoolConfig } from 'pg';
import { IDatabaseProvider } from './interface';
import {
  TableMetadata,
  ForeignKeyMetadata,
  QueryResult,
  ConnectionConfig,
  ColumnMetadata,
} from '../types';

export class PostgreSQLProvider implements IDatabaseProvider {
  private pool: Pool | null = null;
  private currentDatabase: string = '';

  async connect(config: ConnectionConfig): Promise<void> {
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port || 5432,
      user: config.username,
      password: config.password,
      database: config.database || 'postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

    this.pool = new Pool(poolConfig);
    this.currentDatabase = config.database || 'postgres';

    // Test connection
    try {
      await this.pool.query('SELECT 1');
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  async listDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.query(
      `SELECT datname FROM pg_database 
       WHERE datistemplate = false 
       ORDER BY datname`
    );

    return result.rows.map((row) => row.datname);
  }

  async listSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.query(
      `SELECT schema_name FROM information_schema.schemata 
       WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
       ORDER BY schema_name`
    );

    return result.rows.map((row) => row.schema_name);
  }

  async listTables(schema: string = 'public'): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [schema]
    );

    return result.rows.map((row) => row.table_name);
  }

  async describeTable(tableName: string, schema: string = 'public'): Promise<TableMetadata> {
    if (!this.pool) throw new Error('Not connected');

    // Get columns
    const columnsResult = await this.pool.query(
      `SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
          AND tc.table_schema = ku.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.table_schema = $2
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_name = $1 AND c.table_schema = $2
      ORDER BY c.ordinal_position`,
      [tableName, schema]
    );

    const foreignKeys = await this.getForeignKeys(tableName, schema);

    const columns: ColumnMetadata[] = columnsResult.rows.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key,
      isForeignKey: foreignKeys.some((fk) => fk.column === row.column_name),
      maxLength: row.character_maximum_length,
      precision: row.numeric_precision,
      scale: row.numeric_scale,
    }));

    // Get row count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as count FROM "${schema}"."${tableName}"`
    );

    return {
      name: tableName,
      schema,
      columns,
      foreignKeys,
      primaryKey: columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
      rowCount: parseInt(countResult.rows[0].count),
    };
  }

  async getForeignKeys(tableName: string, schema: string = 'public'): Promise<ForeignKeyMetadata[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.query(
      `SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
        AND tc.table_schema = $2`,
      [tableName, schema]
    );

    return result.rows.map((row) => ({
      name: row.constraint_name,
      column: row.column_name,
      referencedTable: row.referenced_table,
      referencedColumn: row.referenced_column,
      onUpdate: row.update_rule,
      onDelete: row.delete_rule,
    }));
  }

  async runQuery(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.query(sql, params);

    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      fields: result.fields?.map((f) => ({
        name: f.name,
        type: (f as any).dataTypeID?.toString() || 'unknown',
      })),
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
