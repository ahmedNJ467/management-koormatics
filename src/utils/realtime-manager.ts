import { supabase } from "@/integrations/supabase/client";

class RealtimeManager {
  private channels: Map<string, any> = new Map();
  private subscribers: Map<string, Set<(payload: any) => void>> = new Map();

  /**
   * Subscribe to a table for real-time updates
   */
  subscribeToTable(
    tableName: string,
    callback: (payload: any) => void
  ): () => void {
    const channelKey = `public:${tableName}`;

    // If channel already exists, just add the callback
    if (this.subscribers.has(channelKey)) {
      this.subscribers.get(channelKey)!.add(callback);
      return () => this.unsubscribeFromTable(tableName, callback);
    }

    // Check if channel already exists and is active
    if (this.channels.has(channelKey)) {
      const existingChannel = this.channels.get(channelKey);
      if (this.isChannelValid(existingChannel)) {
        this.subscribers.get(channelKey)!.add(callback);
        return () => this.unsubscribeFromTable(tableName, callback);
      } else {
        // Remove invalid channel
        this.channels.delete(channelKey);
        this.subscribers.delete(channelKey);
      }
    }

    try {
      // Create new channel with error handling
      const channel = supabase
        // Use default channel configuration; custom timeout isn't supported in the typed options
        .channel(channelKey)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: tableName,
          },
          (payload) => {
            // Notify all subscribers
            const callbacks = this.subscribers.get(channelKey);
            if (callbacks) {
              callbacks.forEach((cb) => cb(payload));
            }
          }
        )
        .subscribe((status) => {
          // Handle subscription status changes
          if (status === "SUBSCRIBED") {
            // Channel successfully subscribed
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            // Channel error - remove it so it can be recreated
            this.channels.delete(channelKey);
            this.subscribers.delete(channelKey);
          }
        });

      // Store channel and initialize subscribers
      this.channels.set(channelKey, channel);
      this.subscribers.set(channelKey, new Set([callback]));

      return () => this.unsubscribeFromTable(tableName, callback);
    } catch (error: any) {
      // Only log non-WebSocket errors
      if (!error?.message?.includes("WebSocket") && !error?.message?.includes("websocket")) {
        console.warn(`Failed to subscribe to ${tableName}:`, error);
      }
      return () => {};
    }
  }

  /**
   * Unsubscribe from a table
   */
  private unsubscribeFromTable(
    tableName: string,
    callback: (payload: any) => void
  ): void {
    const channelKey = `public:${tableName}`;
    const callbacks = this.subscribers.get(channelKey);

    if (callbacks) {
      callbacks.delete(callback);

      // If no more callbacks, unsubscribe and clean up
      if (callbacks.size === 0) {
        const channel = this.channels.get(channelKey);
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch (error: any) {
            // Silently ignore WebSocket cleanup errors
            if (!error?.message?.includes("WebSocket") && !error?.message?.includes("websocket")) {
              console.warn(`Error removing channel ${channelKey}:`, error);
            }
          }
        }
        this.channels.delete(channelKey);
        this.subscribers.delete(channelKey);
      }
    }
  }

  /**
   * Check if a channel is valid
   */
  private isChannelValid(channel: any): boolean {
    return channel && channel.state === "joined";
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.subscribers.clear();
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();
