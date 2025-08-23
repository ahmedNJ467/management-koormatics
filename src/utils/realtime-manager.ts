import { supabase } from "@/integrations/supabase/client";

interface ConnectionStatus {
  isConnected: boolean;
  retryCount: number;
  lastAttempt: number;
  websocketStatus: "connecting" | "connected" | "disconnected" | "error";
  lastPing?: number;
}

class RealtimeManager {
  private channels: Map<string, any> = new Map();
  private subscribers: Map<string, Set<() => void>> = new Map();
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    retryCount: 0,
    lastAttempt: 0,
    websocketStatus: "disconnected",
  };
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 5;
  private retryDelay = 2000; // 2 seconds

  /**
   * Check if we can establish a connection
   */
  private async checkConnection(): Promise<boolean> {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Connection check timeout")), 5000);
      });

      const connectionPromise = supabase
        .from("vehicles")
        .select("count")
        .limit(1);

      const { data, error } = await Promise.race([
        connectionPromise,
        timeoutPromise,
      ]);

      if (error) {
        console.warn("Connection check failed with error:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.warn("Connection check failed with exception:", err);
      return false;
    }
  }

  /**
   * Subscribe to a table with connection retry logic
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

    // Check connection before subscribing (fire and forget)
    this.checkConnection().then((isConnected) => {
      if (!isConnected) {
        console.warn(`Connection check failed for ${tableName}, will retry...`);
        this.retrySubscription(tableName, callback);
        return;
      }

      // Check if channel already exists and is active
      if (this.channels.has(channelKey)) {
        const existingChannel = this.channels.get(channelKey);
        if (this.isChannelValid(existingChannel)) {
          console.log(
            `Channel already exists for ${tableName}, adding callback only`
          );
          this.subscribers.get(channelKey)!.add(callback);
          return;
        } else {
          // Remove invalid channel
          console.log(`Removing invalid channel for ${tableName}`);
          this.channels.delete(channelKey);
          this.subscribers.delete(channelKey);
        }
      }

      try {
        // Create new channel with better error handling
        const channel = supabase
          .channel(channelKey)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: tableName,
            },
            callback
          )
          .on("error", (error) => {
            console.error(`Realtime error for ${tableName}:`, error);
            this.connectionStatus.websocketStatus = "error";
            this.handleConnectionError(tableName);
          })
          .on("disconnect", () => {
            console.warn(`Realtime disconnected for ${tableName}`);
            this.connectionStatus.websocketStatus = "disconnected";
            this.handleConnectionError(tableName);
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log(
                `Realtime subscription created for table: ${tableName}`
              );
              this.connectionStatus.isConnected = true;
              this.connectionStatus.retryCount = 0;
              this.connectionStatus.websocketStatus = "connected";
              this.connectionStatus.lastPing = Date.now();
            } else if (status === "CHANNEL_ERROR") {
              console.error(`Channel error for ${tableName}:`, status);
              this.connectionStatus.websocketStatus = "error";
              this.handleConnectionError(tableName);
            } else if (status === "TIMED_OUT") {
              console.warn(`Channel timeout for ${tableName}`);
              this.connectionStatus.websocketStatus = "disconnected";
              this.handleConnectionError(tableName);
            }
          });

        this.channels.set(channelKey, channel);
        this.subscribers.set(channelKey, new Set([callback]));
      } catch (error) {
        console.error(`Failed to subscribe to ${tableName}:`, error);
        this.retrySubscription(tableName, callback);
      }
    });

    // Return unsubscribe function immediately
    return () => this.unsubscribeFromTable(tableName, callback);
  }

  /**
   * Retry subscription with exponential backoff
   */
  private retrySubscription(
    tableName: string,
    callback: (payload: any) => void
  ): void {
    if (this.connectionStatus.retryCount >= this.maxRetries) {
      console.error(`Max retries reached for ${tableName}`);
      return;
    }

    const now = Date.now();
    if (now - this.connectionStatus.lastAttempt < this.retryDelay) {
      // Wait before retrying
      setTimeout(() => {
        this.retrySubscription(tableName, callback);
      }, this.retryDelay);
      return;
    }

    this.connectionStatus.retryCount++;
    this.connectionStatus.lastAttempt = now;

    console.log(
      `Retrying subscription to ${tableName} (attempt ${this.connectionStatus.retryCount})`
    );

    // Clear existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Set retry timeout
    this.retryTimeout = setTimeout(() => {
      try {
        this.subscribeToTable(tableName, callback);
      } catch (error) {
        console.error(`Retry failed for ${tableName}:`, error);
      }
    }, this.retryDelay * Math.pow(2, this.connectionStatus.retryCount - 1));
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(tableName: string): void {
    this.connectionStatus.isConnected = false;

    // Attempt to reconnect after a delay
    setTimeout(async () => {
      if (!this.connectionStatus.isConnected) {
        console.log(`Attempting to reconnect to ${tableName}...`);
        // Recreate subscriptions for this table
        const subscribers = this.subscribers.get(`public:${tableName}`);
        if (subscribers) {
          const channel = this.channels.get(`public:${tableName}`);
          if (channel) {
            supabase.removeChannel(channel);
            this.channels.delete(`public:${tableName}`);
          }

          // Re-subscribe all callbacks
          for (const callback of subscribers) {
            await this.subscribeToTable(tableName, callback);
          }
        }
      }
    }, 5000); // 5 second delay
  }

  /**
   * Unsubscribe from a table
   */
  unsubscribeFromTable(
    tableName: string,
    callback: (payload: any) => void
  ): void {
    const channelKey = `public:${tableName}`;

    if (!this.subscribers.has(channelKey)) return;

    const subscribers = this.subscribers.get(channelKey)!;
    subscribers.delete(callback);

    // If no more subscribers, remove the channel
    if (subscribers.size === 0) {
      const channel = this.channels.get(channelKey);
      if (channel) {
        try {
          supabase.removeChannel(channel);
          console.log(`Realtime subscription removed for table: ${tableName}`);
        } catch (error) {
          console.warn(`Error removing channel for ${tableName}:`, error);
        }
        this.channels.delete(channelKey);
        this.subscribers.delete(channelKey);
      }
    }
  }

  /**
   * Clean up all channels
   */
  cleanup(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.channels.forEach((channel, key) => {
      try {
        supabase.removeChannel(channel);
        console.log(`Realtime subscription removed for table: ${key}`);
      } catch (error) {
        console.warn(`Error removing channel for ${key}:`, error);
      }
    });
    this.channels.clear();
    this.subscribers.clear();

    this.connectionStatus = {
      isConnected: false,
      retryCount: 0,
      lastAttempt: 0,
      websocketStatus: "disconnected",
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Force reconnection for all tables
   */
  forceReconnect(): void {
    console.log("Forcing reconnection for all tables...");

    // Store current subscribers
    const currentSubscribers = new Map(this.subscribers);

    // Clean up current connections
    this.cleanup();

    // Wait a bit before reconnecting
    setTimeout(() => {
      // Reconnect all tables
      for (const [channelKey, callbacks] of currentSubscribers) {
        const tableName = channelKey.replace("public:", "");
        for (const callback of callbacks) {
          this.subscribeToTable(tableName, callback);
        }
      }
    }, 1000);
  }

  /**
   * Check if a table is already subscribed
   */
  isSubscribed(tableName: string): boolean {
    const channelKey = `public:${tableName}`;
    return this.channels.has(channelKey);
  }

  /**
   * Check if a channel is in a valid state
   */
  private isChannelValid(channel: any): boolean {
    return (
      channel &&
      typeof channel.subscribe === "function" &&
      channel.state !== "closed" &&
      channel.state !== "errored"
    );
  }

  /**
   * Get channel state for debugging
   */
  getChannelState(tableName: string): string {
    const channelKey = `public:${tableName}`;
    const channel = this.channels.get(channelKey);
    return channel ? channel.state || "unknown" : "not_found";
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    realtimeManager.cleanup();
  });
}
