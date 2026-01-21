/**
 * Database Provider Interface
 * 
 * All database providers must implement this interface
 */

import { 
  TableMetadata, 
  ForeignKeyMetadata, 
  QueryResult, 
  ConnectionConfig 
} from '../types';

export interface IDatabaseProvider {
  /**
   * Connect to the database
   */
  connect(config: ConnectionConfig): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * List all databases
   */
  listDatabases(): Promise<string[]>;

  /**
   * List all schemas in a database
   */
  listSchemas(): Promise<string[]>;

  /**
   * List all tables in a schema
   */
  listTables(schema?: string): Promise<string[]>;

  /**
   * Describe a table's structure
   */
  describeTable(tableName: string, schema?: string): Promise<TableMetadata>;

  /**
   * Get foreign keys for a table
   */
  getForeignKeys(tableName: string, schema?: string): Promise<ForeignKeyMetadata[]>;

  /**
   * Execute a SQL query
   */
  runQuery(sql: string, params?: any[]): Promise<QueryResult>;

  /**
   * Test if connection is alive
   */
  testConnection(): Promise<boolean>;
}
