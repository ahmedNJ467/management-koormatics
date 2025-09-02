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
  private subscribers: Map<string, Set<(payload: any) => void>> = new Map();
  private realtimeEnableAttempts: Set<string> = new Set();
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
          // Note: Error and disconnect handlers removed due to type signature issues
          // The subscription status callback below will handle connection status
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
              // Attempt to self-heal by enabling realtime for the table once
              this.ensureRealtimeEnabled(tableName)
                .catch((err) => {
                  console.warn(
                    `Failed to ensure realtime enabled for ${tableName}:`,
                    err
                  );
                })
                .finally(() => {
                  this.handleConnectionError(tableName);
                });
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

    // Set retry timeout with longer delay for realtime setup
    const retryDelayWithRealtime =
      this.retryDelay * Math.pow(2, this.connectionStatus.retryCount - 1);

    this.retryTimeout = setTimeout(async () => {
      try {
        // If this is the first retry, try to enable realtime first
        if (this.connectionStatus.retryCount === 1) {
          console.log(
            `First retry for ${tableName}, attempting to enable realtime...`
          );
          await this.ensureRealtimeEnabled(tableName);
          // Wait a bit longer for realtime changes to take effect
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        this.subscribeToTable(tableName, callback);
      } catch (error) {
        console.error(`Retry failed for ${tableName}:`, error);
      }
    }, retryDelayWithRealtime);
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
          for (const callback of Array.from(subscribers)) {
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
      for (const [channelKey, callbacks] of Array.from(currentSubscribers)) {
        const tableName = channelKey.replace("public:", "");
        for (const callback of Array.from(callbacks)) {
          this.subscribeToTable(tableName, callback);
        }
      }
    }, 1000);
  }

  /**
   * Manually enable realtime for a specific table
   */
  async enableRealtimeForTable(tableName: string): Promise<boolean> {
    try {
      console.log(`Manually enabling realtime for table: ${tableName}`);

      // Clear any previous attempts for this table
      const attemptKey = `public:${tableName}`;
      this.realtimeEnableAttempts.delete(attemptKey);

      // Try to enable realtime
      await this.ensureRealtimeEnabled(tableName);

      // Wait a moment for the changes to take effect
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`Realtime setup completed for table: ${tableName}`);
      return true;
    } catch (error) {
      console.error(`Failed to enable realtime for table ${tableName}:`, error);
      return false;
    }
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

  /**
   * Ensure realtime is enabled for a table by invoking a DB function once
   */
  private async ensureRealtimeEnabled(tableName: string): Promise<void> {
    const attemptKey = `public:${tableName}`;
    if (this.realtimeEnableAttempts.has(attemptKey)) {
      console.log(
        `Already attempted to enable realtime for ${tableName}, skipping`
      );
      return;
    }
    this.realtimeEnableAttempts.add(attemptKey);

    try {
      console.log(`Attempting to enable realtime for table: ${tableName}`);

      // First try the RPC function if it exists
      const { error: rpcError } = await supabase.rpc(
        "enable_realtime_for_table",
        {
          table_name: tableName,
        }
      );

      if (rpcError) {
        console.warn(
          `RPC enable_realtime_for_table failed for ${tableName}:`,
          rpcError
        );

        // Fallback: try to manually enable realtime by checking if table exists and has proper setup
        await this.fallbackRealtimeCheck(tableName);
      } else {
        console.log(
          `Successfully enabled realtime for table: ${tableName} via RPC`
        );
      }
    } catch (error) {
      console.warn(
        `Error while ensuring realtime enabled for ${tableName}:`,
        error
      );

      // Fallback: try to manually enable realtime
      try {
        await this.fallbackRealtimeCheck(tableName);
      } catch (fallbackError) {
        console.error(
          `Fallback realtime check also failed for ${tableName}:`,
          fallbackError
        );
      }
    }
  }

  /**
   * Fallback method to check and potentially fix realtime setup
   */
  private async fallbackRealtimeCheck(tableName: string): Promise<void> {
    try {
      console.log(`Running fallback realtime check for ${tableName}`);

      // Check if table exists and is accessible
      const { data: tableCheck, error: tableError } = await supabase
        .from(tableName as any)
        .select("id")
        .limit(1);

      if (tableError) {
        console.error(`Table ${tableName} is not accessible:`, tableError);
        return;
      }

      console.log(
        `Table ${tableName} is accessible, realtime may need manual DB configuration`
      );
      console.log(`Please ensure the following SQL has been run:`);
      console.log(`1. ALTER TABLE public.${tableName} REPLICA IDENTITY FULL;`);
      console.log(
        `2. ALTER PUBLICATION supabase_realtime ADD TABLE public.${tableName};`
      );
    } catch (error) {
      console.error(`Fallback check failed for ${tableName}:`, error);
    }
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
