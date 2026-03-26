/**
 * Sovereign Dashboard - WebSocket Client
 * Phase 2: Real-time updates with reconnection and heartbeat
 */

const WebSocketClient = {
  ws: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectTimer: null,
  heartbeatTimer: null,
  isConnected: false,
  messageHandlers: new Map(),
  
  /**
   * Initialize WebSocket connection
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket already connected or connecting');
      return;
    }
    
    try {
      const session = Auth.getSession();
      const agentId = session ? session.agentId : CONFIG.AGENT_ID;
      const wsUrl = `${CONFIG.WS_BASE}?agent_id=${agentId}&token=${session ? session.token : 'anonymous'}`;
      
      console.log('Connecting to WebSocket...');
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = () => this.handleClose();
      this.ws.onerror = (error) => this.handleError(error);
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.scheduleReconnect();
    }
  },
  
  /**
   * Handle connection open
   */
  handleOpen() {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.updateConnectionStatus(true);
    this.startHeartbeat();
    
    // Subscribe to relevant channels
    this.send({
      type: 'subscribe',
      channels: ['transactions', 'delegations', 'notifications']
    });
    
    // Trigger event
    this.emit('connected');
  },
  
  /**
   * Handle incoming message
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      
      // Handle heartbeat response
      if (data.type === 'pong') {
        return;
      }
      
      // Handle different message types
      switch (data.type) {
        case 'transaction':
          this.emit('transaction', data.payload);
          break;
        case 'delegation_update':
          this.emit('delegation_update', data.payload);
          break;
        case 'notification':
          this.emit('notification', data.payload);
          break;
        case 'metrics_update':
          this.emit('metrics_update', data.payload);
          break;
        default:
          this.emit('message', data);
      }
      
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  },
  
  /**
   * Handle connection close
   */
  handleClose() {
    console.log('WebSocket disconnected');
    this.isConnected = false;
    this.updateConnectionStatus(false);
    this.stopHeartbeat();
    this.scheduleReconnect();
    this.emit('disconnected');
  },
  
  /**
   * Handle connection error
   */
  handleError(error) {
    console.error('WebSocket error:', error);
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
    console.warn('WebSocket not connected, cannot send message');
    return false;
  },
  
  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, CONFIG.WS_HEARTBEAT_INTERVAL);
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
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnection attempts reached');
      this.emit('max_reconnects_reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(CONFIG.WS_RECONNECT_INTERVAL * Math.pow(2, this.reconnectAttempts - 1), 60000);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
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
   * Update connection status indicator in UI
   */
  updateConnectionStatus(connected) {
    const indicators = document.querySelectorAll('.ws-status-indicator');
    indicators.forEach(indicator => {
      indicator.classList.toggle('connected', connected);
      indicator.classList.toggle('disconnected', !connected);
      indicator.title = connected ? 'Live connection active' : 'Reconnecting...';
    });
    
    // Update text indicators
    const statusTexts = document.querySelectorAll('.ws-status-text');
    statusTexts.forEach(text => {
      text.textContent = connected ? '● LIVE' : '○ OFFLINE';
      text.style.color = connected ? 'var(--teal)' : 'var(--text-tertiary)';
    });
  },
  
  /**
   * Register message handler
   */
  on(event, handler) {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event).push(handler);
  },
  
  /**
   * Remove message handler
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
   * Emit event to handlers
   */
  emit(event, data) {
    if (this.messageHandlers.has(event)) {
      this.messageHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  },
  
  /**
   * Request current metrics
   */
  requestMetrics() {
    return this.send({ type: 'get_metrics' });
  },
  
  /**
   * Request recent transactions
   */
  requestTransactions(limit = 20) {
    return this.send({ type: 'get_transactions', limit });
  },
};

// Auto-connect when DOM is ready if user is authenticated
document.addEventListener('DOMContentLoaded', () => {
  if (Auth && Auth.isAuthenticated && Auth.isAuthenticated() && CONFIG.FEATURES.webSocket) {
    // Delay slightly to allow other init to complete
    setTimeout(() => WebSocketClient.connect(), 1000);
  }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page hidden - optional: disconnect to save resources
    // WebSocketClient.disconnect();
  } else {
    // Page visible - reconnect if needed
    if (Auth && Auth.isAuthenticated && Auth.isAuthenticated() && CONFIG.FEATURES.webSocket) {
      if (!WebSocketClient.isConnected) {
        WebSocketClient.connect();
      }
    }
  }
});
