/**
 * Main Application Server
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { ProviderFactory } from './providers/factory';
import { IDatabaseProvider } from './providers/interface';
import { SchemaScanner } from './scanner';
import { SchemaSemanticLayer } from './semantic';
import { MCPToolRegistry } from './mcp/tools';
import { ChatOrchestrator } from './orchestration/chat';
import { OpenAIClient, GroqClient } from './orchestration/llm-client';
import { EncryptionUtil } from './utils/encryption';
import { ConnectionConfig, DatabaseMetadata } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Global state (in production, use session management)
const sessions = new Map<
  string,
  {
    provider: IDatabaseProvider;
    metadata: DatabaseMetadata | null;
    toolRegistry: MCPToolRegistry;
    orchestrator: ChatOrchestrator;
  }
>();

// Encryption utility
const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
const encryption = new EncryptionUtil(encryptionKey);

// LLM client configuration
const llmApiUrl = process.env.LLM_API_URL || 'https://api.openai.com/v1';
const llmApiKey = process.env.LLM_API_KEY || '';
const llmModel = process.env.LLM_MODEL || 'gpt-4';

/**
 * Create LLM client based on API URL
 * Supports Groq API and OpenAI-compatible APIs
 */
function createLLMClient(apiUrl: string, apiKey: string, model: string) {
  if (apiUrl.includes('groq.com')) {
    console.log(`🤖 Using Groq LLM: ${model}`);
    return new GroqClient(apiKey, model);
  } else {
    console.log(`🤖 Using OpenAI-compatible LLM: ${model}`);
    return new OpenAIClient(apiUrl, apiKey, model);
  }
}

/**
 * Get or create session
 */
function getSession(sessionId: string = 'default') {
  if (!sessions.has(sessionId)) {
    // Create default session (without connection)
    sessions.set(sessionId, {
      provider: null as any,
      metadata: null,
      toolRegistry: null as any,
      orchestrator: null as any,
    });
  }
  return sessions.get(sessionId)!;
}

/**
 * POST /api/connect
 * Connect to database
 */
app.post('/api/connect', async (req: Request, res: Response) => {
  try {
    const config: ConnectionConfig = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'default';

    // Create provider
    const provider = ProviderFactory.createProvider(config.type);
    await provider.connect(config);

    // Test connection
    const isConnected = await provider.testConnection();
    if (!isConnected) {
      throw new Error('Connection test failed');
    }

    // Store in session
    const session = getSession(sessionId);
    session.provider = provider;

    res.json({
      success: true,
      message: 'Connected to database successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/disconnect
 * Disconnect from database
 */
app.post('/api/disconnect', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const session = getSession(sessionId);

    if (session.provider) {
      await session.provider.disconnect();
    }

    sessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Disconnected successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/databases
 * List databases
 */
app.get('/api/databases', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const session = getSession(sessionId);

    if (!session.provider) {
      throw new Error('Not connected to database');
    }

    const databases = await session.provider.listDatabases();

    res.json({
      success: true,
      databases,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/schemas
 * List schemas
 */
app.get('/api/schemas', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const session = getSession(sessionId);

    if (!session.provider) {
      throw new Error('Not connected to database');
    }

    const schemas = await session.provider.listSchemas();

    res.json({
      success: true,
      schemas,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/scan
 * Scan database schema
 */
app.post('/api/scan', async (req: Request, res: Response) => {
  try {
    const { database, schema } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const session = getSession(sessionId);

    if (!session.provider) {
      throw new Error('Not connected to database');
    }

    const scanner = new SchemaScanner(session.provider);

    // Scan with progress updates (simplified - use WebSocket for real-time updates)
    const metadata = await scanner.scanDatabase(database, schema);

    // Store metadata
    session.metadata = metadata;

    // Initialize MCP tools
    session.toolRegistry = new MCPToolRegistry(session.provider, metadata);

    // Initialize orchestrator with appropriate LLM client
    const llmClient = createLLMClient(llmApiUrl, llmApiKey, llmModel);
    session.orchestrator = new ChatOrchestrator(session.toolRegistry, llmClient, metadata);

    // Generate semantic summary
    const semanticLayer = new SchemaSemanticLayer();
    const summary = semanticLayer.generateSchemaSummary(metadata);

    res.json({
      success: true,
      metadata,
      summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/chat
 * Send chat message
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const session = getSession(sessionId);

    if (!session.orchestrator) {
      throw new Error('Schema not scanned. Please scan the database first.');
    }

    const response = await session.orchestrator.chat(message);

    res.json({
      success: true,
      response,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/query
 * Execute SQL query directly
 */
app.post('/api/query', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const session = getSession(sessionId);

    if (!session.provider) {
      throw new Error('Not connected to database');
    }

    const result = await session.provider.runQuery(sql);

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/schema
 * Get current schema metadata
 */
app.get('/api/schema', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || 'default';
    const session = getSession(sessionId);

    if (!session.metadata) {
      throw new Error('Schema not scanned');
    }

    res.json({
      success: true,
      metadata: session.metadata,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`🚀 Database-MCP server running on http://localhost:${PORT}`);
  console.log(`📊 Open your browser to start interacting with your database`);
});

export default app;
