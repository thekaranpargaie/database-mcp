/**
 * SQL Validator
 * 
 * Validates and analyzes SQL queries for safety
 */

import { Parser } from 'node-sql-parser';

export interface SQLAnalysis {
  isValid: boolean;
  isReadOnly: boolean;
  type: string;
  tables: string[];
  errors: string[];
  warnings: string[];
}

export class SQLValidator {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  /**
   * Analyze SQL query
   */
  analyze(sql: string): SQLAnalysis {
    const result: SQLAnalysis = {
      isValid: false,
      isReadOnly: true,
      type: 'unknown',
      tables: [],
      errors: [],
      warnings: [],
    };

    try {
      // Parse SQL
      const ast = this.parser.astify(sql);
      result.isValid = true;

      // Determine query type and tables
      if (Array.isArray(ast)) {
        // Multiple statements
        result.warnings.push('Multiple statements detected');
        for (const stmt of ast) {
          this.analyzeStatement(stmt, result);
        }
      } else {
        this.analyzeStatement(ast, result);
      }
    } catch (error) {
      result.errors.push(`Parse error: ${error.message}`);
    }

    return result;
  }

  /**
   * Validate SQL is safe to execute
   */
  validateSafe(sql: string, readOnlyMode: boolean = true): { safe: boolean; reason?: string } {
    const analysis = this.analyze(sql);

    if (!analysis.isValid) {
      return { safe: false, reason: analysis.errors.join('; ') };
    }

    if (readOnlyMode && !analysis.isReadOnly) {
      return { safe: false, reason: 'Write operations not allowed in read-only mode' };
    }

    // Check for dangerous patterns
    if (sql.match(/;\s*(DROP|TRUNCATE|DELETE\s+FROM\s+\w+\s*;?\s*$)/i)) {
      return { safe: false, reason: 'Potentially dangerous operation detected' };
    }

    return { safe: true };
  }

  /**
   * Analyze individual statement
   */
  private analyzeStatement(stmt: any, result: SQLAnalysis): void {
    if (!stmt || !stmt.type) return;

    result.type = stmt.type.toLowerCase();

    // Check if read-only
    const writeOperations = ['insert', 'update', 'delete', 'create', 'drop', 'alter', 'truncate'];
    if (writeOperations.includes(result.type)) {
      result.isReadOnly = false;
    }

    // Extract table names
    if (stmt.from) {
      this.extractTables(stmt.from, result.tables);
    }
    if (stmt.into && stmt.into.table) {
      result.tables.push(stmt.into.table);
    }
    if (stmt.table) {
      this.extractTables([stmt.table], result.tables);
    }
  }

  /**
   * Extract table names from AST
   */
  private extractTables(from: any[], tables: string[]): void {
    if (!Array.isArray(from)) return;

    for (const item of from) {
      if (item.table) {
        tables.push(item.table);
      }
      if (item.as) {
        // Handle aliased tables
        if (item.as !== item.table) {
          // This is just an alias reference
        }
      }
    }
  }

  /**
   * Add LIMIT clause to SELECT query if not present
   */
  addLimit(sql: string, limit: number = 1000): string {
    const trimmed = sql.trim();

    // Check if already has LIMIT
    if (/LIMIT\s+\d+/i.test(trimmed)) {
      return sql;
    }

    // Add LIMIT for SELECT queries
    if (/^SELECT/i.test(trimmed)) {
      return `${trimmed} LIMIT ${limit}`;
    }

    return sql;
  }
}
