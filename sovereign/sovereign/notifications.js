/**
 * Sovereign Dashboard - Push Notifications
 * Phase 2: Browser push notifications for transactions and delegations
 */

const Notifications = {
  swRegistration: null,
  isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
  
  /**
   * Initialize push notifications
   */
  async init() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return false;
    }
    
    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sovereign/sw-notifications.js');
      console.log('Service Worker registered:', this.swRegistration);
      
      // Handle updates
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker available');
          }
        });
      });
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  },
  
  /**
   * Request notification permission
   */
  async requestPermission() {
    if (!this.isSupported) {
      return { granted: false, error: 'Not supported' };
    }
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const subscription = await this.subscribe();
        return { granted: true, subscription };
      }
      
      return { granted: false, permission };
    } catch (error) {
      console.error('Permission request failed:', error);
      return { granted: false, error: error.message };
    }
  },
  
  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    if (!this.swRegistration) {
      await this.init();
    }
    
    try {
      // Get existing subscription
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        // In production, get VAPID public key from server
        const vapidPublicKey = 'BEl62iMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Replace with real key
        
        const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey);
        
        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
        
        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
      }
      
      // Save to localStorage
      localStorage.setItem('sovereign_push_subscription', JSON.stringify(subscription));
      
      return subscription;
    } catch (error) {
      console.error('Subscription failed:', error);
      throw error;
    }
  },
  
  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.swRegistration) return;
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        localStorage.removeItem('sovereign_push_subscription');
      }
      
      return true;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  },
  
  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const session = Auth.getSession();
      const response = await fetch(`${CONFIG.API_BASE}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          agent_id: session ? session.agentId : CONFIG.AGENT_ID,
          user_id: session ? session.publicKey : null,
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to send subscription:', error);
      return false;
    }
  },
  
  /**
   * Remove subscription from server
   */
  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await fetch(`${CONFIG.API_BASE}/notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to remove subscription:', error);
      return false;
    }
  },
  
  /**
   * Show local notification
   */
  show(title, options = {}) {
    if (!this.isSupported || Notification.permission !== 'granted') {
      return false;
    }
    
    const defaultOptions = {
      icon: '/sovereign/icon-192x192.png',
      badge: '/sovereign/badge-72x72.png',
      tag: 'sovereign-notification',
      requireInteraction: false,
      ...options,
    };
    
    if (this.swRegistration) {
      this.swRegistration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
    
    return true;
  },
  
  /**
   * Show transaction notification
   */
  showTransaction(tx) {
    const direction = tx.direction === 'inbound' ? 'Received' : 'Sent';
    const amount = tx.amount_sats ? `${tx.amount_sats} sats` : tx.amount;
    
    return this.show(`${direction}: ${amount}`, {
      body: `${tx.counterparty || 'Unknown'} via ${tx.protocol || 'Lightning'}`,
      tag: `tx-${tx.id}`,
      data: { type: 'transaction', tx },
      actions: [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  },
  
  /**
   * Show delegation notification
   */
  showDelegation(delegation) {
    return this.show('Delegation Updated', {
      body: `Agent ${delegation.agent_id} delegation ${delegation.status}`,
      tag: `delegation-${delegation.id}`,
      data: { type: 'delegation', delegation },
    });
  },
  
  /**
   * Check if permission is granted
   */
  isGranted() {
    return Notification.permission === 'granted';
  },
  
  /**
   * Get current permission status
   */
  getPermission() {
    return Notification.permission;
  },
  
  /**
   * Convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  },
};

// Service Worker for notifications
const swCode = `
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New notification from Sovereign',
    icon: data.icon || '/sovereign/icon-192x192.png',
    badge: data.badge || '/sovereign/badge-72x72.png',
    tag: data.tag || 'sovereign-notification',
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sovereign', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'view' && data.type === 'transaction') {
    event.waitUntil(
      clients.openWindow('/sovereign/?tab=transactions')
    );
  } else if (action === 'view' && data.type === 'delegation') {
    event.waitUntil(
      clients.openWindow('/sovereign/?tab=delegation')
    );
  } else {
    event.waitUntil(
      clients.openWindow('/sovereign/')
    );
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
`;

// Create service worker blob URL for inline registration
if (typeof window !== 'undefined') {
  const swBlob = new Blob([swCode], { type: 'application/javascript' });
  window.swNotificationsUrl = URL.createObjectURL(swBlob);
}
