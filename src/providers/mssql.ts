/**
 * MSSQL Database Provider
 */

import * as sql from 'mssql';
import { IDatabaseProvider } from './interface';
import {
  TableMetadata,
  ForeignKeyMetadata,
  QueryResult,
  ConnectionConfig,
  ColumnMetadata,
} from '../types';

export class MSSQLProvider implements IDatabaseProvider {
  private pool: sql.ConnectionPool | null = null;
  private currentDatabase: string = '';

  async connect(config: ConnectionConfig): Promise<void> {
    const sqlConfig: sql.config = {
      server: config.host || 'localhost',
      port: config.port || 1433,
      user: config.username,
      password: config.password,
      database: config.database,
      options: {
        encrypt: false, // Change to true for Azure
        trustServerCertificate: true,
        ...config.options,
      },
    };

    this.pool = await new sql.ConnectionPool(sqlConfig).connect();
    this.currentDatabase = config.database || 'master';

    // Test connection
    try {
      await this.pool.request().query('SELECT 1');
    } catch (error) {
      throw new Error(`Failed to connect to MSSQL: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }

  async listDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.request().query(`
      SELECT name FROM sys.databases 
      WHERE name NOT IN ('master', 'tempdb', 'model', 'msdb')
      ORDER BY name
    `);

    return result.recordset.map((row) => row.name);
  }

  async listSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.request().query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name NOT IN ('db_owner', 'db_accessadmin', 'db_securityadmin', 
                                  'db_ddladmin', 'db_backupoperator', 'db_datareader', 
                                  'db_datawriter', 'db_denydatareader', 'db_denydatawriter',
                                  'sys', 'INFORMATION_SCHEMA')
      ORDER BY schema_name
    `);

    return result.recordset.map((row) => row.schema_name);
  }

  async listTables(schema: string = 'dbo'): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.request().query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = '${schema}' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    return result.recordset.map((row) => row.table_name);
  }

  async describeTable(tableName: string, schema: string = 'dbo'): Promise<TableMetadata> {
    if (!this.pool) throw new Error('Not connected');

    // Get columns
    const columnsResult = await this.pool.request().query(`
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku
          ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = '${tableName}'
          AND tc.table_schema = '${schema}'
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_name = '${tableName}' AND c.table_schema = '${schema}'
      ORDER BY c.ordinal_position
    `);

    const foreignKeys = await this.getForeignKeys(tableName, schema);

    const columns: ColumnMetadata[] = columnsResult.recordset.map((row) => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      isPrimaryKey: row.is_primary_key === 1,
      isForeignKey: foreignKeys.some((fk) => fk.column === row.column_name),
      maxLength: row.character_maximum_length,
      precision: row.numeric_precision,
      scale: row.numeric_scale,
    }));

    // Get row count
    const countResult = await this.pool
      .request()
      .query(`SELECT COUNT(*) as count FROM [${schema}].[${tableName}]`);

    return {
      name: tableName,
      schema,
      columns,
      foreignKeys,
      primaryKey: columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
      rowCount: countResult.recordset[0].count,
    };
  }

  async getForeignKeys(tableName: string, schema: string = 'dbo'): Promise<ForeignKeyMetadata[]> {
    if (!this.pool) throw new Error('Not connected');

    const result = await this.pool.request().query(`
      SELECT
        fk.name AS constraint_name,
        COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS column_name,
        OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
        COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS referenced_column,
        fk.delete_referential_action_desc AS delete_rule,
        fk.update_referential_action_desc AS update_rule
      FROM sys.foreign_keys fk
      INNER JOIN sys.foreign_key_columns fkc
        ON fk.object_id = fkc.constraint_object_id
      WHERE OBJECT_NAME(fk.parent_object_id) = '${tableName}'
        AND OBJECT_SCHEMA_NAME(fk.parent_object_id) = '${schema}'
    `);

    return result.recordset.map((row) => ({
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

    const request = this.pool.request();

    // Bind parameters if provided
    if (params) {
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
    }

    const result = await request.query(sql);

    return {
      rows: result.recordset || [],
      rowCount: result.rowsAffected[0] || 0,
      fields: result.recordset?.columns
        ? Object.keys(result.recordset.columns).map((name) => ({
            name,
            type: 'unknown',
          }))
        : undefined,
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      await this.pool.request().query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
