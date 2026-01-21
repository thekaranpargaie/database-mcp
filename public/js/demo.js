/**
 * Database MCP - Interactive Demo
 * Showcases chat interface with various response types
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

class DemoApp {
    constructor() {
        this.themeManager = new ThemeManager();
        this.charts = {};
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupScenarios();
    }

    bindEvents() {
        const clearBtn = document.getElementById('clear-chat-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearChat());
        }
    }

    setupScenarios() {
        this.scenarios = [
            {
                query: 'Show me all tables',
                response: {
                    type: 'text',
                    message: 'I found 5 tables in your database:',
                    tables: ['customers', 'orders', 'products', 'regions', 'sales_history']
                }
            },
            {
                query: 'Sales by region',
                response: {
                    type: 'chart',
                    message: 'Here is the sales breakdown by region:',
                    chartData: {
                        type: 'bar',
                        labels: ['North', 'South', 'East', 'West', 'Central'],
                        values: [45000, 62000, 58000, 71000, 52000],
                        label: 'Sales (USD)'
                    }
                }
            },
            {
                query: 'Top 10 customers by revenue',
                response: {
                    type: 'table',
                    message: 'Here are the top 10 customers by revenue:',
                    columns: ['Customer ID', 'Name', 'Total Revenue', 'Orders'],
                    rows: [
                        { 'Customer ID': 'C001', 'Name': 'Acme Corp', 'Total Revenue': '$156,234', 'Orders': 24 },
                        { 'Customer ID': 'C002', 'Name': 'TechStart Inc', 'Total Revenue': '$142,890', 'Orders': 19 },
                        { 'Customer ID': 'C003', 'Name': 'Global Solutions', 'Total Revenue': '$128,456', 'Orders': 17 },
                        { 'Customer ID': 'C004', 'Name': 'Digital First', 'Total Revenue': '$119,234', 'Orders': 15 },
                        { 'Customer ID': 'C005', 'Name': 'Enterprise Plus', 'Total Revenue': '$98,567', 'Orders': 13 },
                        { 'Customer ID': 'C006', 'Name': 'Innovation Labs', 'Total Revenue': '$87,234', 'Orders': 11 },
                        { 'Customer ID': 'C007', 'Name': 'Future Systems', 'Total Revenue': '$76,890', 'Orders': 10 },
                        { 'Customer ID': 'C008', 'Name': 'Smart Solutions', 'Total Revenue': '$65,432', 'Orders': 8 },
                        { 'Customer ID': 'C009', 'Name': 'Cloud Ventures', 'Total Revenue': '$54,123', 'Orders': 7 },
                        { 'Customer ID': 'C010', 'Name': 'NextGen Tech', 'Total Revenue': '$43,210', 'Orders': 6 }
                    ]
                }
            },
            {
                query: 'How many records in each table?',
                response: {
                    type: 'chart',
                    message: 'Record count by table:',
                    chartData: {
                        type: 'pie',
                        labels: ['Customers', 'Orders', 'Products', 'Regions', 'History'],
                        values: [1250, 5840, 3200, 8, 125000],
                        label: 'Record Count'
                    }
                }
            },
            {
                query: 'Revenue trend analysis',
                response: {
                    type: 'chart',
                    message: 'Monthly revenue trend for the last 12 months:',
                    chartData: {
                        type: 'line',
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        values: [42000, 45000, 52000, 48000, 61000, 59000, 72000, 68000, 75000, 82000, 88000, 95000],
                        label: 'Revenue (USD)'
                    }
                }
            }
        ];
    }

    runScenario(index) {
        if (!this.scenarios[index]) return;

        const scenario = this.scenarios[index];
        
        // Add user message
        this.addMessage('user', scenario.query);

        // Simulate loading
        const loadingId = this.addMessage('assistant', this.createLoadingMessage());

        // Simulate API response delay
        setTimeout(() => {
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Add response based on type
            switch (scenario.response.type) {
                case 'text':
                    this.addMessage('assistant', scenario.response.message);
                    const tablesList = scenario.response.tables
                        .map(t => `• ${t}`)
                        .join('\n');
                    this.addMessage('assistant', tablesList);
                    break;
                case 'table':
                    this.renderTableResponse(scenario.response);
                    break;
                case 'chart':
                    this.renderChartResponse(scenario.response);
                    break;
            }
        }, 1200);
    }

    createLoadingMessage() {
        const el = document.createElement('div');
        el.innerHTML = `
            <div class="loading-indicator">
                <span>Thinking</span>
                <div class="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        return el;
    }

    renderTableResponse(response) {
        this.addMessage('assistant', response.message);

        const messagesContainer = document.getElementById('demo-chat-messages');
        if (!messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant';

        let tableHtml = '<table class="data-table"><thead><tr>';
        
        response.columns.forEach(col => {
            tableHtml += `<th>${this.escapeHtml(col)}</th>`;
        });
        
        tableHtml += '</tr></thead><tbody>';
        
        response.rows.forEach(row => {
            tableHtml += '<tr>';
            response.columns.forEach(col => {
                const value = row[col] !== null ? this.escapeHtml(String(row[col])) : 'NULL';
                tableHtml += `<td>${value}</td>`;
            });
            tableHtml += '</tr>';
        });
        
        tableHtml += '</tbody></table>';

        messageEl.innerHTML = `<div class="message-content">${tableHtml}</div>`;
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    renderChartResponse(response) {
        this.addMessage('assistant', response.message);

        const chartId = 'chart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const chartHtml = `
            <div class="chart-container">
                <canvas id="${chartId}"></canvas>
            </div>
        `;

        const messagesContainer = document.getElementById('demo-chat-messages');
        if (!messagesContainer) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'message assistant';
        messageEl.innerHTML = `<div class="message-content">${chartHtml}</div>`;
        messagesContainer.appendChild(messageEl);

        // Render chart
        setTimeout(() => {
            this.createChart(chartId, response.chartData);
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

        const chartConfig = {
            type: data.type || 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: data.label || 'Data',
                    data: data.values || [],
                    backgroundColor: data.type === 'pie' ? [
                        'rgba(14, 165, 233, 0.7)',
                        'rgba(59, 130, 246, 0.7)',
                        'rgba(139, 92, 246, 0.7)',
                        'rgba(236, 72, 153, 0.7)',
                        'rgba(249, 115, 22, 0.7)',
                        'rgba(34, 197, 94, 0.7)'
                    ] : primaryColorLight,
                    borderColor: data.type === 'pie' ? undefined : primaryColor,
                    borderWidth: data.type === 'pie' ? 2 : 2,
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
                scales: data.type === 'pie' ? {} : {
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
        };

        const chartInstance = new Chart(ctx, chartConfig);
        this.charts[canvasId] = chartInstance;
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('demo-chat-messages');
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
        // Escape HTML first
        content = this.escapeHtml(content);
        
        // Convert markdown-style code blocks
        content = content.replace(/`{3}(\w+)?\n([\s\S]+?)`{3}/g, (match, lang, code) => {
            return `<div class="code-block"><button class="copy-btn" onclick="demo.copyCode(this)">Copy</button><pre><code>${code.trim()}</code></pre></div>`;
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

    clearChat() {
        const messagesContainer = document.getElementById('demo-chat-messages');
        if (!messagesContainer) return;

        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-header">
                    <i data-lucide="message-square" width="32" height="32" style="color: var(--primary);"></i>
                    <div>
                        <h3>Welcome to Database MCP Demo</h3>
                        <p>Interactive demonstration of chat interface</p>
                    </div>
                </div>
                <div class="welcome-content">
                    <p>This demo showcases:</p>
                    <ul>
                        <li>Natural language SQL queries</li>
                        <li>Data tables with responsive design</li>
                        <li>Interactive charts and graphs</li>
                        <li>Real-time error handling</li>
                        <li>Loading indicators and animations</li>
                    </ul>
                </div>
                <div class="welcome-examples">
                    <p class="examples-label">Click a scenario to see it in action:</p>
                    <div class="example-chips">
                        <span class="example-chip" onclick="demo.runScenario(0)">Show All Tables</span>
                        <span class="example-chip" onclick="demo.runScenario(1)">Sales by Region</span>
                        <span class="example-chip" onclick="demo.runScenario(2)">Top Customers</span>
                    </div>
                </div>
            </div>
        `;

        // Render icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    resetDemo() {
        this.clearChat();
        this.charts = {};
    }
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.demo = new DemoApp();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.demo) window.demo = new DemoApp();
    });
} else {
    if (!window.demo) window.demo = new DemoApp();
}
