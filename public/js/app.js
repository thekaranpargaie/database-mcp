/**
 * Database MCP - Modern Frontend Application
 * Production-grade UI with theme support, Lucide icons, and professional design
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.init();
    }

    loadTheme() {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupToggle();
        this.renderIcons();
    }

    setupToggle() {
        const toggle = document.getElementById('theme-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        this.renderIcons();
    }

    applyTheme(theme) {
        const html = document.documentElement;
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');

        if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        } else {
            html.removeAttribute('data-theme');
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        }
    }

    renderIcons() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }
}

class DatabaseMCP {
    constructor() {
        this.apiUrl = window.location.origin;
        this.sessionId = this.generateSessionId();
        this.currentSchema = null;
        this.charts = {};
        this.isSidebarCollapsed = false;
        this.init();
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.themeManager = new ThemeManager();
        this.renderUI();
        this.bindEvents();
        this.setupResponsive();
        this.showScreen('connection-screen');
    }

    renderUI() {
        const appContainer = document.getElementById('app');
        if (!appContainer) return;

        appContainer.innerHTML = `
            <!-- Connection Screen -->
            <div id="connection-screen" class="screen active">
                <div class="connection-wrapper">
                    <div class="connection-container">
                        <div class="connection-header">
                            <div class="logo-section">
                                <div class="logo-icon">
                                    <i data-lucide="database" width="32" height="32"></i>
                                </div>
                                <div>
                                    <h1>Database MCP</h1>
                                    <p class="subtitle">Natural Language Database Interface</p>
                                </div>
                            </div>
                        </div>

                        <div class="connection-form">
                            <div class="form-header">
                                <h2>Database Connection</h2>
                                <p class="form-description">Connect to your database to get started</p>
                            </div>
                        
                            <div class="form-group">
                                <label for="db-type">
                                    <span class="label-text">Database Type</span>
                                    <i class="label-icon" data-lucide="database" width="16" height="16"></i>
                                </label>
                                <div class="select-wrapper">
                                    <select id="db-type">
                                        <option value="postgresql">PostgreSQL</option>
                                        <option value="mysql">MySQL / MariaDB</option>
                                        <option value="mssql">Microsoft SQL Server</option>
                                        <option value="sqlite">SQLite</option>
                                    </select>
                                    <i class="select-arrow" data-lucide="chevron-down" width="16" height="16"></i>
                                </div>
                            </div>

                            <div id="network-config">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="db-host">
                                            <span class="label-text">Host</span>
                                            <i class="label-icon" data-lucide="server" width="14" height="14"></i>
                                        </label>
                                        <input type="text" id="db-host" placeholder="localhost" value="localhost">
                                    </div>

                                    <div class="form-group">
                                        <label for="db-port">
                                            <span class="label-text">Port</span>
                                            <i class="label-icon" data-lucide="network" width="14" height="14"></i>
                                        </label>
                                        <input type="number" id="db-port" placeholder="5432" value="5432">
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="db-username">
                                            <span class="label-text">Username</span>
                                            <i class="label-icon" data-lucide="user" width="14" height="14"></i>
                                        </label>
                                        <input type="text" id="db-username" placeholder="postgres">
                                    </div>

                                    <div class="form-group">
                                        <label for="db-password">
                                            <span class="label-text">Password</span>
                                            <i class="label-icon" data-lucide="lock" width="14" height="14"></i>
                                        </label>
                                        <input type="password" id="db-password" placeholder="password">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="db-database">
                                        <span class="label-text">Database Name</span>
                                        <i class="label-icon" data-lucide="database" width="14" height="14"></i>
                                    </label>
                                    <input type="text" id="db-database" placeholder="mydb">
                                </div>
                            </div>

                            <div id="sqlite-config" style="display: none;">
                                <div class="form-group">
                                    <label for="db-filename">
                                        <span class="label-text">Database File Path</span>
                                        <i class="label-icon" data-lucide="file" width="14" height="14"></i>
                                    </label>
                                    <input type="text" id="db-filename" placeholder="/path/to/database.sqlite">
                                </div>
                            </div>

                            <button id="connect-btn" class="btn btn-primary btn-lg">
                                <i data-lucide="plug" width="18" height="18"></i>
                                <span>Connect to Database</span>
                            </button>
                            <div id="connection-error" class="error-message">
                                <i data-lucide="alert-circle" width="16" height="16"></i>
                                <span id="error-text"></span>
                            </div>
                        </div>
                    </div>
                    <div class="connection-illustration">
                        <i data-lucide="database" width="200" height="200" style="opacity: 0.2;"></i>
                    </div>
                </div>
            </div>

            <!-- Schema Selection Screen -->
            <div id="schema-screen" class="screen">
                <div class="schema-wrapper">
                    <div class="schema-header-bar">
                        <div class="schema-header-content">
                            <div class="schema-breadcrumb">
                                <i data-lucide="list" width="16" height="16"></i>
                                <span>Schema Configuration</span>
                            </div>
                            <button id="disconnect-btn" class="btn btn-ghost btn-sm">
                                <i data-lucide="log-out" width="16" height="16"></i>
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>

                    <div class="schema-container">
                        <div class="schema-selection-card">
                            <div class="card-header">
                                <h2>Select Schema to Scan</h2>
                                <p>Choose which schema to analyze</p>
                            </div>
                            <div class="schema-list" id="schema-list">
                                <div class="loading-state">
                                    <div class="spinner"></div>
                                    <p>Discovering schemas...</p>
                                </div>
                            </div>
                            <div class="progress-container">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progress-fill"></div>
                                </div>
                                <p id="progress-message" class="progress-message">Ready to scan</p>
                            </div>
                            <button id="scan-btn" class="btn btn-primary btn-lg">
                                <i data-lucide="search" width="18" height="18"></i>
                                <span>Scan Database</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Application Screen -->
            <div id="main-screen" class="screen">
                <button id="sidebar-toggle-btn" class="sidebar-toggle-btn hidden" title="Show Schema Explorer">
                    <i data-lucide="chevron-right" width="20" height="20"></i>
                </button>
                <div class="main-layout">
                    <!-- Sidebar -->
                    <aside class="sidebar" id="sidebar">
                        <div class="sidebar-header">
                            <div class="sidebar-title">
                                <i data-lucide="file-text" width="18" height="18"></i>
                                <span>Schema</span>
                            </div>
                            <button id="toggle-sidebar" class="btn-icon-sm" title="Collapse">
                                <i data-lucide="chevron-left" width="16" height="16"></i>
                            </button>
                        </div>
                        <div class="schema-tree" id="schema-tree">
                            <div class="loading-state">
                                <div class="spinner"></div>
                                <p>Loading schema...</p>
                            </div>
                        </div>
                        <div class="sidebar-footer">
                            <button id="new-connection-btn" class="btn btn-secondary btn-small">
                                <i data-lucide="plus" width="16" height="16"></i>
                                <span>New</span>
                            </button>
                        </div>
                    </aside>

                    <!-- Main Chat -->
                    <main class="main-content">
                        <div class="chat-header">
                            <div class="chat-header-left">
                                <button id="sidebar-toggle-mobile" class="btn-icon-sm mobile-only">
                                    <i data-lucide="menu" width="20" height="20"></i>
                                </button>
                                <h2>Chat</h2>
                            </div>
                            <button id="clear-chat-btn" class="btn btn-secondary btn-small">
                                <i data-lucide="trash-2" width="16" height="16"></i>
                                Clear
                            </button>
                        </div>

                        <div class="chat-messages" id="chat-messages">
                            <div class="welcome-message">
                                <div class="welcome-header">
                                    <i data-lucide="message-square" width="28" height="28" style="color: var(--primary);"></i>
                                    <div>
                                        <h3>Welcome to Database MCP</h3>
                                        <p>Ask anything about your database</p>
                                    </div>
                                </div>
                                <div class="welcome-content">
                                    <p>I can help you:</p>
                                    <ul>
                                        <li>Explore your schema and relationships</li>
                                        <li>Generate SQL queries from natural language</li>
                                        <li>Analyze data and create reports</li>
                                        <li>Visualize trends with charts</li>
                                    </ul>
                                </div>
                                <div class="welcome-examples">
                                    <p class="examples-label">Example queries:</p>
                                    <div class="example-chips">
                                        <span class="example-chip">Show me all tables</span>
                                        <span class="example-chip">Top 10 customers</span>
                                        <span class="example-chip">Sales by region</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="chat-input-container">
                            <div class="input-wrapper">
                                <textarea id="chat-input" placeholder="Ask anything..." rows="1"></textarea>
                                <button id="send-btn" class="btn-send" title="Send">
                                    <i data-lucide="send" width="18" height="18"></i>
                                </button>
                            </div>
                            <p class="input-hint">Press Enter to send, Shift+Enter for new line</p>
                        </div>
                    </main>
                </div>
            </div>
        `;

        // Render Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    bindEvents() {
        // Connection screen
        const dbType = document.getElementById('db-type');
        if (dbType) {
            dbType.addEventListener('change', (e) => {
                this.toggleConnectionFields(e.target.value);
            });
        }

        const connectBtn = document.getElementById('connect-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connect());
        }

        // Schema screen
        const disconnectBtn = document.getElementById('disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnect());
        }

        const scanBtn = document.getElementById('scan-btn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.scanDatabase());
        }

        // Main screen
        const sendBtn = document.getElementById('send-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Auto-resize textarea
            chatInput.addEventListener('input', (e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            });
        }

        const clearBtn = document.getElementById('clear-chat-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearChat());
        }

        const newConnBtn = document.getElementById('new-connection-btn');
        if (newConnBtn) {
            newConnBtn.addEventListener('click', () => this.showScreen('connection-screen'));
        }

        // Sidebar toggle
        const toggleSidebar = document.getElementById('toggle-sidebar');
        if (toggleSidebar) {
            toggleSidebar.addEventListener('click', () => this.toggleSidebar());
        }

        const sidebarToggleMobile = document.getElementById('sidebar-toggle-mobile');
        if (sidebarToggleMobile) {
            sidebarToggleMobile.addEventListener('click', () => this.toggleSidebar());
        }

        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => this.toggleSidebar());
        }

        // Initialize connection fields
        this.toggleConnectionFields('postgresql');

        // Example chips
        const chips = document.querySelectorAll('.example-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value = chip.textContent;
                    input.focus();
                }
            });
        });
    }

    setupResponsive() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    handleResize() {
        // Re-render charts on resize
        Object.keys(this.charts).forEach(chartId => {
            const chart = this.charts[chartId];
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        
        if (sidebar) {
            this.isSidebarCollapsed = !this.isSidebarCollapsed;
            sidebar.classList.toggle('collapsed');
            
            if (sidebarToggleBtn) {
                if (this.isSidebarCollapsed) {
                    sidebarToggleBtn.classList.remove('hidden');
                } else {
                    sidebarToggleBtn.classList.add('hidden');
                }
            }

            // Re-render icons
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    toggleConnectionFields(dbType) {
        const networkConfig = document.getElementById('network-config');
        const sqliteConfig = document.getElementById('sqlite-config');
        const portField = document.getElementById('db-port');

        if (dbType === 'sqlite') {
            if (networkConfig) networkConfig.style.display = 'none';
            if (sqliteConfig) sqliteConfig.style.display = 'block';
        } else {
            if (networkConfig) networkConfig.style.display = 'block';
            if (sqliteConfig) sqliteConfig.style.display = 'none';

            // Set default ports
            if (portField) {
                const defaultPorts = {
                    postgresql: 5432,
                    mysql: 3306,
                    mssql: 1433
                };
                portField.value = defaultPorts[dbType] || 5432;
            }
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            // Render icons for this screen
            if (window.lucide) {
                lucide.createIcons();
            }
        }
    }

    showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            const textEl = errorEl.querySelector('#error-text') || errorEl;
            if (textEl.id === 'error-text') {
                textEl.textContent = message;
            } else {
                errorEl.textContent = message;
            }
            errorEl.classList.add('show');
            setTimeout(() => errorEl.classList.remove('show'), 5000);
        }
    }

    async apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Session-Id': this.sessionId
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.apiUrl}${endpoint}`, options);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async connect() {
        try {
            const dbTypeEl = document.getElementById('db-type');
            if (!dbTypeEl) throw new Error('Database type selector not found');
            
            const dbType = dbTypeEl.value;
            const config = {
                type: dbType
            };

            if (dbType === 'sqlite') {
                const filenameEl = document.getElementById('db-filename');
                config.filename = filenameEl?.value || '';
                if (!config.filename) {
                    throw new Error('Please specify a database file path');
                }
            } else {
                const hostEl = document.getElementById('db-host');
                const portEl = document.getElementById('db-port');
                const usernameEl = document.getElementById('db-username');
                const passwordEl = document.getElementById('db-password');
                const databaseEl = document.getElementById('db-database');
                
                config.host = hostEl?.value || '';
                config.port = parseInt(portEl?.value || '5432');
                config.username = usernameEl?.value || '';
                config.password = passwordEl?.value || '';
                config.database = databaseEl?.value || '';

                if (!config.host || !config.database) {
                    throw new Error('Please fill in all required fields');
                }
            }

            await this.apiCall('/api/connect', 'POST', config);

            // Load schemas
            const schemasData = await this.apiCall('/api/schemas');
            this.populateSchemas(schemasData.schemas);

            this.showScreen('schema-screen');
        } catch (error) {
            this.showError('connection-error', error.message);
        }
    }

    async disconnect() {
        try {
            await this.apiCall('/api/disconnect', 'POST');
            this.showScreen('connection-screen');
            this.charts = {};
        } catch (error) {
            console.error('Disconnect failed:', error);
        }
    }

    populateSchemas(schemas) {
        const listContainer = document.getElementById('schema-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';
        
        if (!schemas || schemas.length === 0) {
            listContainer.innerHTML = '<div class="schema-item">No schemas found</div>';
            return;
        }
        
        schemas.forEach(schema => {
            const item = document.createElement('div');
            item.className = 'schema-item';
            item.textContent = schema;
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                document.querySelectorAll('.schema-item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
            });
            listContainer.appendChild(item);
        });
    }

    async scanDatabase() {
        try {
            const progressFill = document.getElementById('progress-fill');
            const progressMessage = document.getElementById('progress-message');

            if (progressFill) progressFill.style.width = '0%';
            if (progressMessage) progressMessage.textContent = 'Initializing scan...';

            // Simulate progress
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress >= 90) progress = 90;
                
                if (progressFill) progressFill.style.width = progress + '%';
                if (progressMessage) progressMessage.textContent = 'Scanning database...';
            }, 300);

            const result = await this.apiCall('/api/scan', 'POST', {
                schema: null
            });

            clearInterval(progressInterval);
            if (progressFill) progressFill.style.width = '100%';
            if (progressMessage) progressMessage.textContent = 'Scan complete!';

            this.currentSchema = result.metadata;
            
            setTimeout(() => {
                this.showScreen('main-screen');
                this.renderSchemaTree(result.metadata);
            }, 500);
        } catch (error) {
            console.error('Scan failed:', error);
            const progressMessage = document.getElementById('progress-message');
            if (progressMessage) progressMessage.textContent = 'Scan failed: ' + error.message;
        }
    }

    renderSchemaTree(metadata) {
        const container = document.getElementById('schema-tree');
        if (!container) return;

        container.innerHTML = '';

        if (!metadata || !metadata.tables || metadata.tables.length === 0) {
            container.innerHTML = '<div class="loading-state"><p>No tables found</p></div>';
            return;
        }

        metadata.tables.forEach(table => {
            const tableEl = document.createElement('div');
            tableEl.className = 'table-item';
            
            tableEl.innerHTML = `
                <div class="table-name">${this.escapeHtml(table.name)}</div>
                <div class="table-info">
                    ${table.columns.length} columns &bull; ${table.rowCount || 0} rows
                </div>
            `;

            tableEl.addEventListener('click', () => {
                this.showTableDetails(table);
            });

            container.appendChild(tableEl);
        });
    }

    showTableDetails(table) {
        const columns = table.columns.map(col => {
            const tags = [];
            if (col.isPrimaryKey) tags.push('PK');
            if (col.isForeignKey) tags.push('FK');
            if (!col.nullable) tags.push('NOT NULL');
            
            const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
            return `${col.name} (${col.type})${tagStr}`;
        }).join('\n');

        const message = `Table: ${table.name}\n\nColumns:\n${columns}`;
        this.addMessage('assistant', `<strong>Table Structure: ${this.escapeHtml(table.name)}</strong>\n\n\`\`\`\n${columns}\n\`\`\``);
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        if (!input) return;

        const message = input.value.trim();
        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // Show loading
        const loadingId = this.addMessage('assistant', 'Thinking<span class="loading-dots"><span></span><span></span><span></span></span>');

        try {
            const response = await this.apiCall('/api/chat', 'POST', { message });
            
            // Remove loading message
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Handle response
            this.handleResponse(response.response);
        } catch (error) {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();
            
            this.addMessage('assistant', `<strong>Error:</strong> ${this.escapeHtml(error.message)}`);
        }
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return null;

        // Remove welcome message if present
        const welcome = messagesContainer.querySelector('.welcome-message');
        if (welcome && role === 'user') {
            welcome.remove();
        }

        const messageEl = document.createElement('div');
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        messageEl.id = messageId;
        messageEl.className = `message ${role}`;

        const contentEl = document.createElement('div');
        contentEl.className = 'message-content';
        
        if (typeof content === 'string') {
            contentEl.innerHTML = this.formatMessage(content);
        } else if (content instanceof HTMLElement) {
            contentEl.appendChild(content);
        } else {
            contentEl.innerHTML = this.formatMessage(String(content));
        }

        messageEl.appendChild(contentEl);
        messagesContainer.appendChild(messageEl);

        // Render icons if needed
        if (window.lucide) {
            lucide.createIcons();
        }

        // Scroll to bottom
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 0);

        return messageId;
    }

    formatMessage(content) {
        // Decode HTML entities first (handles already-escaped content from API)
        const textarea = document.createElement('textarea');
        textarea.innerHTML = content;
        content = textarea.value;
        
        // Now escape HTML to prevent XSS
        content = this.escapeHtml(content);
        
        // Convert markdown-style code blocks
        content = content.replace(/`{3}(\w+)?\n([\s\S]+?)`{3}/g, (match, lang, code) => {
            return `<div class="code-block"><button class="copy-btn" onclick="app.copyCode(this)">Copy</button><pre><code>${code.trim()}</code></pre></div>`;
        });

        // Convert inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Convert bold
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Convert line breaks
        content = content.replace(/\n/g, '<br>');

        return content;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    copyCode(button) {
        const codeBlock = button.nextElementSibling;
        const code = codeBlock.textContent;
        
        navigator.clipboard.writeText(code).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }

    handleResponse(response) {
        switch (response.response_type) {
            case 'table':
                this.renderTable(response);
                break;
            case 'chart':
                this.renderChart(response);
                break;
            case 'text':
            default:
                this.addMessage('assistant', response.description || response.raw_response || 'No response');
                break;
        }
    }

    renderTable(response) {
        if (!response.data || !response.data.rows) {
            this.addMessage('assistant', response.description);
            return;
        }

        const rows = response.data.rows;
        if (rows.length === 0) {
            this.addMessage('assistant', response.description + '\n\nNo data found.');
            return;
        }

        const columns = Object.keys(rows[0]);
        
        let tableHtml = `<p><strong>${this.escapeHtml(response.description)}</strong></p>`;
        tableHtml += '<table class="data-table"><thead><tr>';
        
        columns.forEach(col => {
            tableHtml += `<th>${this.escapeHtml(col)}</th>`;
        });
        
        tableHtml += '</tr></thead><tbody>';
        
        const maxRows = 10;
        const displayRows = rows.slice(0, maxRows);
        
        displayRows.forEach(row => {
            tableHtml += '<tr>';
            columns.forEach(col => {
                const value = row[col] !== null ? this.escapeHtml(String(row[col])) : 'NULL';
                tableHtml += `<td>${value}</td>`;
            });
            tableHtml += '</tr>';
        });
        
        tableHtml += '</tbody></table>';
        
        if (rows.length > maxRows) {
            tableHtml += `<p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">Showing ${maxRows} of ${rows.length} rows</p>`;
        }

        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant';
        messageEl.innerHTML = `<div class="message-content">${tableHtml}</div>`;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    renderChart(response) {
        if (!response.data) {
            this.addMessage('assistant', response.description);
            return;
        }

        const chartId = 'chart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const chartHtml = `
            <p><strong>${this.escapeHtml(response.description)}</strong></p>
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>
        `;

        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant';
        messageEl.innerHTML = `<div class="message-content">${chartHtml}</div>`;
        messagesContainer.appendChild(messageEl);

        // Render chart
        setTimeout(() => {
            this.createChart(chartId, response.data);
        }, 100);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    createChart(canvasId, data) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const isDark = !document.documentElement.hasAttribute('data-theme');
        const textColor = isDark ? '#e0e0e0' : '#111827';
        const gridColor = isDark ? '#3e3e42' : '#e5e7eb';
        const primaryColor = '#0ea5e9';
        const primaryColorLight = isDark ? 'rgba(14, 165, 233, 0.5)' : 'rgba(14, 165, 233, 0.3)';

        const chartInstance = new Chart(ctx, {
            type: data.type || 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: data.label || 'Data',
                    data: data.values || [],
                    backgroundColor: primaryColorLight,
                    borderColor: primaryColor,
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: textColor,
                            font: { family: 'system-ui, sans-serif' }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                }
            }
        });

        this.charts[canvasId] = chartInstance;
    }

    clearChat() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-header">
                    <i data-lucide="message-square" width="32" height="32" style="color: var(--primary);"></i>
                    <div>
                        <h3>Welcome to Database MCP</h3>
                        <p>Your intelligent database assistant</p>
                    </div>
                </div>
                <div class="welcome-content">
                    <p>Ask me anything about your database. I can help you:</p>
                    <ul>
                        <li>Explore your schema and relationships</li>
                        <li>Generate SQL queries from natural language</li>
                        <li>Analyze data and create comprehensive reports</li>
                        <li>Visualize trends with beautiful charts</li>
                    </ul>
                </div>
                <div class="welcome-examples">
                    <p class="examples-label">Example queries:</p>
                    <div class="example-chips">
                        <span class="example-chip">Show me all tables</span>
                        <span class="example-chip">Top 10 customers</span>
                        <span class="example-chip">Sales by region</span>
                    </div>
                </div>
            </div>
        `;

        // Render icons
        if (window.lucide) {
            lucide.createIcons();
        }

        // Re-bind example chips
        const chips = messagesContainer.querySelectorAll('.example-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const input = document.getElementById('chat-input');
                if (input) {
                    input.value = chip.textContent;
                    input.focus();
                }
            });
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DatabaseMCP();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.app) window.app = new DatabaseMCP();
    });
} else {
    if (!window.app) window.app = new DatabaseMCP();
}
