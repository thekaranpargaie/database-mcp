# Database MCP - Natural Language Database Interface

A modern web application that lets you interact with SQL databases using natural language, powered by the Model Context Protocol (MCP).

<img width="1904" height="915" alt="image" src="https://github.com/user-attachments/assets/00bb5b79-175e-4d0a-9747-2582ec9d2f71" />


## Features

- **Natural Language Queries**: Ask questions in plain English, get results instantly
- **Multi-Database Support**: PostgreSQL, MySQL, MariaDB, MSSQL, SQLite
- **Rich Visualizations**: Tables, charts, and formatted code blocks
- **Schema Explorer**: Browse database structure with an intuitive sidebar
- **Dark & Light Modes**: Modern design with light/dark theme support
- **Responsive Design**: Works on desktop, tablet, and mobile

<img width="1919" height="922" alt="image" src="https://github.com/user-attachments/assets/ef44e855-f92a-4264-8c7b-a63d1375e6b3" />


## Prerequisites

- Node.js 18+
- A database (PostgreSQL, MySQL, MSSQL, or SQLite)
- LLM API key (Groq, OpenAI, or compatible endpoint)

## Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your credentials:
```bash
cp .env.example .env
```

Then edit `.env` with:
- `LLM_API_URL`: Your LLM API endpoint (e.g., Groq, OpenAI)
- `LLM_API_KEY`: Your API key
- `LLM_MODEL`: Model name (e.g., mixtral-8x7b-32768)
- `ENCRYPTION_KEY`: A 32-character random key for production

### 3. Run Development Server
```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Available Scripts

```bash
npm run dev        # Development with hot reload
npm run build      # Build TypeScript
npm start          # Run production build
npm run demo:setup # Create demo database
npm run demo:run   # Run with demo data
npm test           # Run tests
```

## Supported Databases

| Database | Status |
|----------|--------|
| PostgreSQL | ✅ |
| MySQL / MariaDB | ✅ |
| SQL Server | ✅ |
| SQLite | ✅ |

## Architecture

```
Web UI → Chat → MCP Tools → Scanner → Database
```

**Key Components:**
- **Frontend** (`public/`): Interactive UI with theme support
- **Server** (`src/server.ts`): Express API and MCP
- **Tools** (`src/mcp/`): MCP protocol implementation
- **Providers** (`src/providers/`): Database adapters
- **Scanner** (`src/scanner/`): Database schema analysis
- **Encryption** (`src/utils/encryption.ts`): Credential encryption

## License

MIT
