/**
 * Chat Orchestration Layer
 * 
 * Coordinates LLM interactions with MCP tools
 */

import { MCPToolRegistry } from '../mcp/tools';
import { DatabaseMetadata } from '../types';
import { SchemaSemanticLayer } from '../semantic';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatResponse {
  response_type: 'text' | 'chart' | 'table';
  description: string;
  data?: any;
  sql?: string;
  raw_response?: string;
}

export class ChatOrchestrator {
  private messages: Message[] = [];
  private semanticLayer: SchemaSemanticLayer;
  private systemPrompt: string = '';

  constructor(
    private toolRegistry: MCPToolRegistry,
    private llmClient: LLMClient,
    private metadata: DatabaseMetadata | null = null
  ) {
    this.semanticLayer = new SchemaSemanticLayer();
    this.initializeSystemPrompt();
  }

  setMetadata(metadata: DatabaseMetadata): void {
    this.metadata = metadata;
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    const schemaContext = this.metadata
      ? this.semanticLayer.generateCompactSchema(this.metadata)
      : 'No schema loaded yet.';

    this.systemPrompt = `You are a helpful database assistant that helps users interact with their SQL database using natural language.

DATABASE SCHEMA:
${schemaContext}

CAPABILITIES:
You have access to the following tools:
${this.toolRegistry
  .getTools()
  .map((t) => `- ${t.name}: ${t.description}`)
  .join('\n')}

GUIDELINES:
1. Always validate SQL before execution
2. Use the explain_sql tool to validate queries before running them
3. For data queries, use run_sql and format results appropriately
4. When generating reports or analytics, respond with structured data in this format:
   {
     "response_type": "chart" | "table" | "text",
     "description": "human explanation of the data",
     "data": { ...structured data... }
   }
5. For charts, provide data in a format suitable for visualization (labels, values, etc.)
6. Always be clear about what data you're returning and why
7. If a query might return large amounts of data, suggest filtering or limiting
8. Explain your reasoning when constructing complex queries

RESPONSE FORMAT:
- For simple questions: respond with plain text
- For data tables: use response_type "table" with rows and columns
- For analytics/trends: use response_type "chart" with appropriate chart data

Remember: You are operating in a tool-calling mode. Use the provided tools to access the database.`;

    this.messages = [{ role: 'system', content: this.systemPrompt }];
  }

  /**
   * Send a chat message
   */
  async chat(userMessage: string): Promise<ChatResponse> {
    // Add user message
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    // Get LLM response with tool calls
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;

      const response = await this.llmClient.chat(this.messages, this.toolRegistry.getTools());

      // Add assistant response
      this.messages.push(response);

      // Check if there are tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Execute tool calls
        for (const toolCall of response.tool_calls) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await this.toolRegistry.executeTool(toolCall.function.name, args);

            // Add tool response to messages
            this.messages.push({
              role: 'tool',
              content: JSON.stringify(result, null, 2),
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
            });
          } catch (error) {
            this.messages.push({
              role: 'tool',
              content: JSON.stringify({ error: error.message }),
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
            });
          }
        }
      } else {
        // No more tool calls, return final response
        return this.parseResponse(response.content);
      }
    }

    throw new Error('Max iterations reached without final response');
  }

  /**
   * Parse assistant response into structured format
   */
  private parseResponse(content: string): ChatResponse {
    // Try to parse as JSON first
    try {
      const json = JSON.parse(content);
      if (json.response_type && json.description) {
        return json as ChatResponse;
      }
    } catch {
      // Not JSON, treat as text
    }

    // Default to text response
    return {
      response_type: 'text',
      description: content,
      raw_response: content,
    };
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.initializeSystemPrompt();
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.messages];
  }
}

/**
 * LLM Client Interface
 */
export interface LLMClient {
  chat(messages: Message[], tools: any[]): Promise<Message>;
}
