/**
 * Shared WebSocket Client for Real-Time Trust Score Updates
 * Agentic Terminal - E5 Live Trust Score
 * 
 * Features:
 * - Real-time trust score update notifications
 * - 58→83 animation pattern (Enterprise Alerts reference)
 * - Toast notifications for score changes
 * - Automatic reconnection
 * 
 * Usage:
 *   TrustScoreWebSocket.connect('did:web:...');
 *   TrustScoreWebSocket.onScoreUpdate((update) => {
 *     animateScoreChange(update.previous_score, update.new_score);
 *   });
 */

const TrustScoreWebSocket = {
    ws: null,
    agentId: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    reconnectTimer: null,
    heartbeatTimer: null,
    isConnected: false,
    messageHandlers: new Map(),
    pendingUpdates: [],
    
    // Configuration
    config: {
        wsBase: (typeof CONFIG !== 'undefined' && CONFIG.WS_BASE) || 'wss://api.observerprotocol.org/ws',
        heartbeatInterval: 30000,  // 30 seconds
        reconnectInterval: 5000,   // 5 seconds initial
        debug: false
    },
    
    /**
     * Initialize WebSocket connection for trust score updates
     * @param {string} agentId - The agent's DID
     * @param {string} token - Authentication token (optional)
     */
    connect(agentId, token = null) {
        if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
            this.log('WebSocket already connected');
            return;
        }
        
        this.agentId = agentId;
        
        try {
            const session = this.getSession();
            const authToken = token || (session ? session.token : 'anonymous');
            const wsUrl = `${this.config.wsBase}/trust-score?agent_id=${encodeURIComponent(agentId)}&token=${authToken}`;
            
            this.log('Connecting to Trust Score WebSocket...', wsUrl);
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = () => this.handleClose();
            this.ws.onerror = (error) => this.handleError(error);
            
        } catch (error) {
            console.error('[TrustScoreWebSocket] Connection failed:', error);
            this.scheduleReconnect();
        }
    },
    
    /**
     * Handle connection open
     */
    handleOpen() {
        this.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        
        // Subscribe to trust score updates
        this.send({
            type: 'subscribe',
            channels: ['trust_score', 'receipts']
        });
        
        // Process any pending updates
        this.processPendingUpdates();
        
        // Emit connected event
        this.emit('connected');
    },
    
    /**
     * Handle incoming message
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.log('Received message:', data);
            
            // Handle heartbeat response
            if (data.type === 'pong') {
                return;
            }
            
            // Handle different message types
            switch (data.type) {
                case 'trust_score_update':
                    this.handleTrustScoreUpdate(data.payload);
                    break;
                case 'receipt_attached':
                    this.handleReceiptAttached(data.payload);
                    break;
                case 'notification':
                    this.emit('notification', data.payload);
                    break;
                default:
                    this.emit('message', data);
            }
            
        } catch (error) {
            console.error('[TrustScoreWebSocket] Failed to parse message:', error);
        }
    },
    
    /**
     * Handle trust score update message
     */
    handleTrustScoreUpdate(payload) {
        this.log('Trust score update received:', payload);
        
        // Store for later if not ready
        if (!document.readyState === 'complete') {
            this.pendingUpdates.push(payload);
            return;
        }
        
        // Animate the score change
        this.animateScoreChange(payload);
        
        // Emit to registered handlers
        this.emit('trust_score_update', payload);
    },
    
    /**
     * Handle receipt attached notification
     */
    handleReceiptAttached(payload) {
        this.log('Receipt attached:', payload);
        
        // Show toast notification
        this.showToast(
            `New receipt verified from ${this.shortenDid(payload.issuer_did)}`,
            'success'
        );
        
        this.emit('receipt_attached', payload);
    },
    
    /**
     * Animate score change with 58→83 pattern
     * Reference: Enterprise Alerts tab animation
     */
    animateScoreChange(update) {
        const { previous_score, new_score, score_change, breakdown } = update;
        
        // Find all score display elements
        const scoreElements = document.querySelectorAll('[data-trust-score]');
        const scoreValueElements = document.querySelectorAll('.at-ars-score-value');
        
        // Calculate color based on new score
        let bandColor = 'var(--text-tertiary)';
        if (new_score >= 800) bandColor = 'var(--accent)';
        else if (new_score >= 500) bandColor = 'var(--teal)';
        else if (new_score >= 200) bandColor = 'var(--amber)';
        
        // Animate each score display
        scoreValueElements.forEach(el => {
            this.animateNumber(el, previous_score, new_score, 1000, bandColor);
        });
        
        // Update score bar if present
        const scoreBars = document.querySelectorAll('.at-ars-score-bar');
        scoreBars.forEach(bar => {
            bar.style.width = `${Math.min(new_score / 10, 100)}%`;
            bar.style.background = bandColor;
        });
        
        // Update trend indicator
        const trendElements = document.querySelectorAll('.trust-trend-indicator');
        trendElements.forEach(el => {
            const isUp = score_change > 0;
            el.innerHTML = isUp ? '↑' : score_change < 0 ? '↓' : '→';
            el.style.color = isUp ? 'var(--teal)' : score_change < 0 ? 'var(--red)' : 'var(--text-secondary)';
        });
        
        // Update breakdown if provided
        if (breakdown) {
            Object.entries(breakdown).forEach(([key, metric]) => {
                const metricValueEl = document.querySelector(`[data-metric="${key}"] .at-ars-metric-value`);
                const metricBarEl = document.querySelector(`[data-metric="${key}"] .at-ars-mini-bar-fill`);
                
                if (metricValueEl) {
                    metricValueEl.textContent = metric.score;
                }
                if (metricBarEl) {
                    metricBarEl.style.width = `${(metric.score / metric.max) * 100}%`;
                }
            });
        }
        
        // Show toast notification
        const direction = score_change > 0 ? 'increased' : score_change < 0 ? 'decreased' : 'unchanged';
        const sign = score_change > 0 ? '+' : '';
        this.showToast(
            `Trust score ${direction}: ${sign}${score_change} points`,
            score_change > 0 ? 'success' : score_change < 0 ? 'error' : 'info'
        );
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('trustScoreUpdated', {
            detail: update
        }));
    },
    
    /**
     * Animate number counting from start to end
     */
    animateNumber(element, start, end, duration, finalColor) {
        const startTime = performance.now();
        const difference = end - start;
        
        // Add animation class
        element.classList.add('score-animating');
        if (difference > 0) {
            element.classList.add('score-increasing');
        } else if (difference < 0) {
            element.classList.add('score-decreasing');
        }
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quad
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            
            const current = Math.round(start + (difference * easeProgress));
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end;
                element.style.color = finalColor;
                element.classList.remove('score-animating', 'score-increasing', 'score-decreasing');
                
                // Add pulse effect
                element.classList.add('score-pulse');
                setTimeout(() => element.classList.remove('score-pulse'), 500);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        // Use global showNotif if available
        if (typeof showNotif === 'function') {
            const title = type === 'success' ? 'Score Updated' : type === 'error' ? 'Error' : 'Info';
            showNotif(title, message, type);
            return;
        }
        
        // Create custom toast
        const toast = document.createElement('div');
        toast.className = `trust-score-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</div>
            <div class="toast-message">${message}</div>
        `;
        
        // Add styles if not present
        if (!document.getElementById('trust-score-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'trust-score-toast-styles';
            styles.textContent = `
                .trust-score-toast {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-left: 3px solid var(--accent);
                    border-radius: 8px;
                    padding: 16px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-family: var(--mono);
                    font-size: 13px;
                    color: var(--text-primary);
                    transform: translateX(150%);
                    transition: transform 0.3s ease;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                .trust-score-toast.toast-success { border-left-color: var(--teal); }
                .trust-score-toast.toast-error { border-left-color: var(--red); }
                .trust-score-toast.toast-info { border-left-color: var(--accent); }
                .trust-score-toast.visible { transform: translateX(0); }
                .toast-icon { font-size: 16px; }
                .score-animating { transition: color 0.3s; }
                .score-increasing { color: var(--teal); }
                .score-decreasing { color: var(--red); }
                @keyframes scorePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .score-pulse { animation: scorePulse 0.5s ease; }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
    
    /**
     * Process pending updates after connection
     */
    processPendingUpdates() {
        while (this.pendingUpdates.length > 0) {
            const update = this.pendingUpdates.shift();
            this.animateScoreChange(update);
        }
    },
    
    /**
     * Handle connection close
     */
    handleClose() {
        this.log('WebSocket disconnected');
        this.isConnected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
        this.emit('disconnected');
    },
    
    /**
     * Handle connection error
     */
    handleError(error) {
        console.error('[TrustScoreWebSocket] Error:', error);
        this.emit('error', error);
    },
    
    /**
     * Send message to server
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        }
        this.log('WebSocket not connected, cannot send message');
        return false;
    },
    
    /**
     * Start heartbeat
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'ping', timestamp: Date.now() });
            }
        }, this.config.heartbeatInterval);
    },
    
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    },
    
    /**
     * Schedule reconnection
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[TrustScoreWebSocket] Max reconnection attempts reached');
            this.emit('max_reconnects_reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(
            this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            60000
        );
        
        this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
        
        this.reconnectTimer = setTimeout(() => {
            if (this.agentId) {
                this.connect(this.agentId);
            }
        }, delay);
    },
    
    /**
     * Disconnect WebSocket
     */
    disconnect() {
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
    },
    
    /**
     * Register event handler
     */
    on(event, handler) {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event).push(handler);
    },
    
    /**
     * Remove event handler
     */
    off(event, handler) {
        if (this.messageHandlers.has(event)) {
            const handlers = this.messageHandlers.get(event);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    },
    
    /**
     * Register trust score update handler
     */
    onScoreUpdate(handler) {
        this.on('trust_score_update', handler);
    },
    
    /**
     * Register receipt attached handler
     */
    onReceiptAttached(handler) {
        this.on('receipt_attached', handler);
    },
    
    /**
     * Emit event to handlers
     */
    emit(event, data) {
        if (this.messageHandlers.has(event)) {
            this.messageHandlers.get(event).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('[TrustScoreWebSocket] Error in handler:', error);
                }
            });
        }
    },
    
    /**
     * Get session from storage
     */
    getSession() {
        try {
            return JSON.parse(localStorage.getItem('sovereign_session')) ||
                   JSON.parse(localStorage.getItem('enterprise_session'));
        } catch {
            return null;
        }
    },
    
    /**
     * Utility: Shorten DID
     */
    shortenDid(did) {
        if (!did || did.length < 25) return did || '—';
        return `${did.slice(0, 18)}...${did.slice(-8)}`;
    },
    
    /**
     * Utility: Log with debug flag
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[TrustScoreWebSocket]', ...args);
        }
    }
};

// Auto-connect if agent ID is in URL or session
(function autoConnect() {
    // Wait for DOM and other scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryAutoConnect);
    } else {
        tryAutoConnect();
    }
    
    function tryAutoConnect() {
        // Try to get agent ID from various sources
        let agentId = null;
        
        // From URL params
        const urlParams = new URLSearchParams(window.location.search);
        agentId = urlParams.get('agent_id') || urlParams.get('did');
        
        // From session storage
        if (!agentId) {
            try {
                const sovereignSession = JSON.parse(localStorage.getItem('sovereign_session'));
                const enterpriseSession = JSON.parse(localStorage.getItem('enterprise_session'));
                agentId = sovereignSession?.agentId || sovereignSession?.did ||
                         enterpriseSession?.agentId || enterpriseSession?.did;
            } catch {
                // Ignore
            }
        }
        
        // From meta tag
        if (!agentId) {
            const metaAgentId = document.querySelector('meta[name="agent-id"]');
            if (metaAgentId) {
                agentId = metaAgentId.content;
            }
        }
        
        if (agentId) {
            TrustScoreWebSocket.connect(agentId);
        }
    }
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrustScoreWebSocket;
}