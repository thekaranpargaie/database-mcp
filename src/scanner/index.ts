/**
 * Schema Scanner
 * 
 * Scans database schema and builds normalized metadata
 */

import { IDatabaseProvider } from '../providers/interface';
import { DatabaseMetadata, TableMetadata } from '../types';

export interface ScanProgress {
  stage: string;
  current: number;
  total: number;
  message: string;
}

export type ProgressCallback = (progress: ScanProgress) => void;

export class SchemaScanner {
  constructor(private provider: IDatabaseProvider) {}

  /**
   * Scan entire database schema
   */
  async scanDatabase(
    databaseName?: string,
    schemaName?: string,
    onProgress?: ProgressCallback
  ): Promise<DatabaseMetadata> {
    // Get list of schemas if not specified
    let schemas: string[] = [];
    if (schemaName) {
      schemas = [schemaName];
    } else {
      onProgress?.({
        stage: 'schemas',
        current: 0,
        total: 1,
        message: 'Fetching schemas...',
      });
      schemas = await this.provider.listSchemas();
    }

    // Scan tables from all schemas
    const allTables: TableMetadata[] = [];

    for (let i = 0; i < schemas.length; i++) {
      const schema = schemas[i];
      onProgress?.({
        stage: 'schemas',
        current: i + 1,
        total: schemas.length,
        message: `Scanning schema: ${schema}`,
      });

      const tables = await this.provider.listTables(schema);

      for (let j = 0; j < tables.length; j++) {
        const tableName = tables[j];
        onProgress?.({
          stage: 'tables',
          current: j + 1,
          total: tables.length,
          message: `Analyzing table: ${schema}.${tableName}`,
        });

        try {
          const tableMetadata = await this.provider.describeTable(tableName, schema);
          allTables.push(tableMetadata);
        } catch (error) {
          console.error(`Failed to describe table ${schema}.${tableName}:`, error);
        }
      }
    }

    onProgress?.({
      stage: 'complete',
      current: allTables.length,
      total: allTables.length,
      message: 'Schema scan complete',
    });

    return {
      name: databaseName || 'current',
      schemas,
      tables: allTables,
    };
  }

  /**
   * Build relationship graph from metadata
   */
  buildRelationshipGraph(metadata: DatabaseMetadata): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    for (const table of metadata.tables) {
      const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;

      if (!graph.has(tableName)) {
        graph.set(tableName, new Set());
      }

      // Add relationships based on foreign keys
      for (const fk of table.foreignKeys) {
        const referencedTable = table.schema
          ? `${table.schema}.${fk.referencedTable}`
          : fk.referencedTable;

        graph.get(tableName)!.add(referencedTable);

        if (!graph.has(referencedTable)) {
          graph.set(referencedTable, new Set());
        }
      }
    }

    return graph;
  }
}
