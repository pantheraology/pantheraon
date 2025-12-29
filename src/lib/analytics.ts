/**
 * Analytics & Event Tracking System
 * Centralized event tracking for user behavior analysis
 */

export type EventCategory = 
  | 'navigation'
  | 'chat'
  | 'agent'
  | 'studio'
  | 'auth'
  | 'settings'
  | 'error'
  | 'performance';

export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count';
  timestamp: number;
}

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let metricsQueue: PerformanceMetric[] = [];

// Configuration
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

/**
 * Track an analytics event
 */
export function trackEvent(
  category: EventCategory,
  action: string,
  options?: {
    label?: string;
    value?: number;
    metadata?: Record<string, unknown>;
  }
): void {
  const event: AnalyticsEvent = {
    category,
    action,
    label: options?.label,
    value: options?.value,
    metadata: options?.metadata,
    timestamp: Date.now(),
  };

  eventQueue.push(event);

  // Log in development
  if (import.meta.env.DEV) {
    console.debug('[Analytics]', event);
  }

  // Flush if batch size reached
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }
}

/**
 * Track a performance metric
 */
export function trackMetric(
  name: string,
  value: number,
  unit: PerformanceMetric['unit'] = 'ms'
): void {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: Date.now(),
  };

  metricsQueue.push(metric);

  if (import.meta.env.DEV) {
    console.debug('[Performance]', metric);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('navigation', 'page_view', {
    label: path,
    metadata: { title },
  });
}

/**
 * Track user action timing
 */
export function trackTiming(
  category: EventCategory,
  action: string,
  duration: number
): void {
  trackEvent(category, action, {
    value: Math.round(duration),
    metadata: { type: 'timing' },
  });
}

/**
 * Create a timer for tracking duration
 */
export function createTimer(category: EventCategory, action: string) {
  const startTime = performance.now();
  
  return {
    stop: () => {
      const duration = performance.now() - startTime;
      trackTiming(category, action, duration);
      return duration;
    },
  };
}

/**
 * Flush queued events (placeholder for remote sending)
 */
export async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0 && metricsQueue.length === 0) return;

  const events = [...eventQueue];
  const metrics = [...metricsQueue];
  
  // Clear queues
  eventQueue = [];
  metricsQueue = [];

  // Future: Send to analytics service
  // await sendToAnalyticsService({ events, metrics });
  
  if (import.meta.env.DEV) {
    console.debug('[Analytics] Flushed', events.length, 'events and', metrics.length, 'metrics');
  }
}

/**
 * Initialize analytics with periodic flushing
 */
export function initializeAnalytics(): () => void {
  const intervalId = setInterval(flushEvents, FLUSH_INTERVAL);
  
  // Flush on page unload
  const handleUnload = () => flushEvents();
  window.addEventListener('beforeunload', handleUnload);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('beforeunload', handleUnload);
    flushEvents();
  };
}

// Convenience tracking functions
export const analytics = {
  // Chat events
  chatMessageSent: (conversationId?: string) => 
    trackEvent('chat', 'message_sent', { label: conversationId }),
  chatMessageReceived: (conversationId?: string, tokens?: number) => 
    trackEvent('chat', 'message_received', { label: conversationId, value: tokens }),
  conversationCreated: () => 
    trackEvent('chat', 'conversation_created'),
  conversationDeleted: () => 
    trackEvent('chat', 'conversation_deleted'),

  // Agent events
  agentCreated: (agentId: string) => 
    trackEvent('agent', 'agent_created', { label: agentId }),
  agentUpdated: (agentId: string) => 
    trackEvent('agent', 'agent_updated', { label: agentId }),
  agentDeleted: (agentId: string) => 
    trackEvent('agent', 'agent_deleted', { label: agentId }),

  // Studio events
  studioGenerationStarted: (type: string) => 
    trackEvent('studio', 'generation_started', { label: type }),
  studioGenerationCompleted: (type: string, duration?: number) => 
    trackEvent('studio', 'generation_completed', { label: type, value: duration }),
  studioGenerationFailed: (type: string, error?: string) => 
    trackEvent('studio', 'generation_failed', { label: type, metadata: { error } }),

  // Auth events
  signIn: (method: string) => 
    trackEvent('auth', 'sign_in', { label: method }),
  signUp: (method: string) => 
    trackEvent('auth', 'sign_up', { label: method }),
  signOut: () => 
    trackEvent('auth', 'sign_out'),

  // Error tracking
  error: (errorType: string, message: string, stack?: string) => 
    trackEvent('error', errorType, { label: message, metadata: { stack } }),
};
