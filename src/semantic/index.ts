/**
 * Schema Semantic Layer
 * 
 * Converts raw metadata into human-readable schema context for LLM
 */

import { DatabaseMetadata, TableMetadata, ColumnMetadata } from '../types';

export class SchemaSemanticLayer {
  /**
   * Generate a human-readable schema summary for LLM context
   */
  generateSchemaSummary(metadata: DatabaseMetadata): string {
    const lines: string[] = [];

    lines.push('# Database Schema Summary');
    lines.push('');
    lines.push(`Database: ${metadata.name}`);
    lines.push(`Total Tables: ${metadata.tables.length}`);
    lines.push('');

    // Group tables by schema
    const tablesBySchema = this.groupTablesBySchema(metadata.tables);

    for (const [schema, tables] of tablesBySchema.entries()) {
      lines.push(`## Schema: ${schema}`);
      lines.push('');

      for (const table of tables) {
        lines.push(this.generateTableSummary(table));
        lines.push('');
      }
    }

    // Add relationship summary
    lines.push('## Relationships');
    lines.push('');
    lines.push(this.generateRelationshipSummary(metadata.tables));

    return lines.join('\n');
  }

  /**
   * Generate compact schema description for tool context
   */
  generateCompactSchema(metadata: DatabaseMetadata): string {
    const lines: string[] = [];

    for (const table of metadata.tables) {
      const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;
      const columns = table.columns.map((c) => {
        const parts = [c.name, c.type];
        if (c.isPrimaryKey) parts.push('PK');
        if (c.isForeignKey) parts.push('FK');
        if (!c.nullable) parts.push('NOT NULL');
        return parts.join(' ');
      });

      lines.push(`${tableName} (${columns.join(', ')})`);
    }

    return lines.join('\n');
  }

  /**
   * Generate detailed table summary
   */
  private generateTableSummary(table: TableMetadata): string {
    const lines: string[] = [];
    const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;

    lines.push(`### Table: ${tableName}`);
    lines.push(`Rows: ~${table.rowCount || 0}`);
    lines.push('');

    lines.push('**Columns:**');
    for (const column of table.columns) {
      lines.push(this.generateColumnDescription(column));
    }

    if (table.foreignKeys.length > 0) {
      lines.push('');
      lines.push('**Foreign Keys:**');
      for (const fk of table.foreignKeys) {
        lines.push(
          `- ${fk.column} → ${fk.referencedTable}.${fk.referencedColumn} (${fk.name})`
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate column description
   */
  private generateColumnDescription(column: ColumnMetadata): string {
    const parts: string[] = [`- **${column.name}**`];
    parts.push(`(${column.type})`);

    const tags: string[] = [];
    if (column.isPrimaryKey) tags.push('PK');
    if (column.isForeignKey) tags.push('FK');
    if (!column.nullable) tags.push('NOT NULL');
    if (column.defaultValue) tags.push(`DEFAULT: ${column.defaultValue}`);

    if (tags.length > 0) {
      parts.push(`[${tags.join(', ')}]`);
    }

    return parts.join(' ');
  }

  /**
   * Generate relationship summary
   */
  private generateRelationshipSummary(tables: TableMetadata[]): string {
    const lines: string[] = [];
    const relationships: string[] = [];

    for (const table of tables) {
      const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;

      for (const fk of table.foreignKeys) {
        relationships.push(`${tableName} → ${fk.referencedTable} (via ${fk.column})`);
      }
    }

    if (relationships.length === 0) {
      lines.push('No foreign key relationships found.');
    } else {
      lines.push(...relationships);
    }

    return lines.join('\n');
  }

  /**
   * Group tables by schema
   */
  private groupTablesBySchema(tables: TableMetadata[]): Map<string, TableMetadata[]> {
    const grouped = new Map<string, TableMetadata[]>();

    for (const table of tables) {
      const schema = table.schema || 'default';
      if (!grouped.has(schema)) {
        grouped.set(schema, []);
      }
      grouped.get(schema)!.push(table);
    }

    return grouped;
  }

  /**
   * Generate table names list for LLM
   */
  generateTablesList(metadata: DatabaseMetadata): string[] {
    return metadata.tables.map((t) => (t.schema ? `${t.schema}.${t.name}` : t.name));
  }

  /**
   * Find table by name
   */
  findTable(metadata: DatabaseMetadata, tableName: string): TableMetadata | undefined {
    return metadata.tables.find(
      (t) =>
        t.name === tableName ||
        (t.schema && `${t.schema}.${t.name}` === tableName) ||
        tableName.endsWith(`.${t.name}`)
    );
  }
}
