/**
 * MCP Tools Definition
 * 
 * Defines all MCP tools for database interaction
 */

import { IDatabaseProvider } from '../providers/interface';
import { DatabaseMetadata } from '../types';
import { SchemaSemanticLayer } from '../semantic';
import { SQLValidator } from '../utils/validator';

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  handler: (params: any) => Promise<any>;
}

export class MCPToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private readOnlyMode: boolean = true;
  private validator: SQLValidator;
  private semanticLayer: SchemaSemanticLayer;

  constructor(
    private provider: IDatabaseProvider,
    private metadata: DatabaseMetadata | null = null
  ) {
    this.validator = new SQLValidator();
    this.semanticLayer = new SchemaSemanticLayer();
    this.registerTools();
  }

  setMetadata(metadata: DatabaseMetadata): void {
    this.metadata = metadata;
  }

  setReadOnlyMode(readOnly: boolean): void {
    this.readOnlyMode = readOnly;
  }

  private registerTools(): void {
    // List Tables Tool
    this.tools.set('list_tables', {
      name: 'list_tables',
      description: 'List all tables in the database with their schemas',
      parameters: {
        type: 'object',
        properties: {
          schema: {
            type: 'string',
            description: 'Optional schema name to filter tables',
          },
        },
        required: [],
      },
      handler: async (params) => {
        if (this.metadata) {
          const tables = this.semanticLayer.generateTablesList(this.metadata);
          return {
            tables,
            count: tables.length,
          };
        }

        const tables = await this.provider.listTables(params.schema);
        return {
          tables,
          count: tables.length,
        };
      },
    });

    // Describe Table Tool
    this.tools.set('describe_table', {
      name: 'describe_table',
      description: 'Get detailed information about a table structure',
      parameters: {
        type: 'object',
        properties: {
          table_name: {
            type: 'string',
            description: 'Name of the table to describe',
          },
          schema: {
            type: 'string',
            description: 'Schema name (optional)',
          },
        },
        required: ['table_name'],
      },
      handler: async (params) => {
        if (this.metadata) {
          const table = this.semanticLayer.findTable(this.metadata, params.table_name);
          if (table) {
            return table;
          }
        }

        return await this.provider.describeTable(params.table_name, params.schema);
      },
    });

    // Generate SQL Tool
    this.tools.set('generate_sql', {
      name: 'generate_sql',
      description: 'Generate SQL query based on natural language description',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Natural language description of what to query',
          },
          tables: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tables involved in the query',
          },
        },
        required: ['description'],
      },
      handler: async (params) => {
        // This is a placeholder - actual SQL generation happens in the LLM
        return {
          message: 'SQL generation should be handled by the LLM',
          description: params.description,
          suggested_tables: params.tables,
        };
      },
    });

    // Explain SQL Tool
    this.tools.set('explain_sql', {
      name: 'explain_sql',
      description: 'Explain what a SQL query does in natural language',
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'SQL query to explain',
          },
        },
        required: ['sql'],
      },
      handler: async (params) => {
        const analysis = this.validator.analyze(params.sql);

        return {
          sql: params.sql,
          valid: analysis.isValid,
          type: analysis.type,
          tables: analysis.tables,
          read_only: analysis.isReadOnly,
          errors: analysis.errors,
          warnings: analysis.warnings,
        };
      },
    });

    // Run SQL Tool
    this.tools.set('run_sql', {
      name: 'run_sql',
      description: 'Execute a SQL query and return results',
      parameters: {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'SQL query to execute',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of rows to return (default: 1000)',
          },
        },
        required: ['sql'],
      },
      handler: async (params) => {
        const limit = params.limit || 1000;

        // Validate SQL
        const validation = this.validator.validateSafe(params.sql, this.readOnlyMode);
        if (!validation.safe) {
          throw new Error(`SQL validation failed: ${validation.reason}`);
        }

        // Add limit for SELECT queries
        let sql = params.sql;
        const analysis = this.validator.analyze(sql);
        if (analysis.type === 'select') {
          sql = this.validator.addLimit(sql, limit);
        }

        // Execute query
        const result = await this.provider.runQuery(sql);

        return {
          rows: result.rows,
          rowCount: result.rowCount,
          fields: result.fields,
          limited: analysis.type === 'select',
        };
      },
    });
  }

  /**
   * Get all tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool
   */
  async executeTool(name: string, params: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      return await tool.handler(params);
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }
}
