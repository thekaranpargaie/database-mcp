/**
 * Common types for database metadata
 */

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

export interface ForeignKeyMetadata {
  name: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface TableMetadata {
  name: string;
  schema?: string;
  columns: ColumnMetadata[];
  foreignKeys: ForeignKeyMetadata[];
  primaryKey?: string[];
  rowCount?: number;
}

export interface DatabaseMetadata {
  name: string;
  schemas?: string[];
  tables: TableMetadata[];
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: Array<{ name: string; type: string }>;
}

export interface ConnectionConfig {
  type: 'postgresql' | 'mysql' | 'mssql' | 'sqlite';
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  filename?: string; // For SQLite
  options?: any;
}
