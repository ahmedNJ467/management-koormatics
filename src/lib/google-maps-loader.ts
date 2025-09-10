/**
 * Centralized Google Maps API loader to prevent multiple script inclusions
 */

interface GoogleMapsLoaderOptions {
  libraries?: string[];
  callback?: string;
}

interface LoadedState {
  isLoaded: boolean;
  isLoading: boolean;
  error?: Error;
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadState: LoadedState = {
    isLoaded: false,
    isLoading: false,
  };
  private loadPromises: Map<string, Promise<void>> = new Map();
  private callbacks: Map<string, (() => void)[]> = new Map();

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  /**
   * Load Google Maps API with specified libraries
   */
  async loadGoogleMaps(options: GoogleMapsLoaderOptions = {}): Promise<void> {
    const { libraries = [], callback } = options;
    const cacheKey = this.getCacheKey(libraries);

    // If already loaded, return immediately
    if (this.loadState.isLoaded && this.hasRequiredLibraries(libraries)) {
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.loadState.isLoading && this.loadPromises.has(cacheKey)) {
      return this.loadPromises.get(cacheKey)!;
    }

    // Check if Google Maps is already available
    if ((window as any).google?.maps) {
      this.loadState.isLoaded = true;
      this.loadState.isLoading = false;
      return Promise.resolve();
    }

    // Start loading
    this.loadState.isLoading = true;
    const loadPromise = this.loadScript(cacheKey, libraries, callback);
    this.loadPromises.set(cacheKey, loadPromise);

    try {
      await loadPromise;
      this.loadState.isLoaded = true;
      this.loadState.isLoading = false;
    } catch (error) {
      this.loadState.error = error as Error;
      this.loadState.isLoading = false;
      throw error;
    }

    return loadPromise;
  }

  private getCacheKey(libraries: string[]): string {
    return libraries.sort().join(",");
  }

  private hasRequiredLibraries(requiredLibraries: string[]): boolean {
    if (!(window as any).google?.maps) return false;

    for (const lib of requiredLibraries) {
      if (!(window as any).google.maps[lib]) {
        return false;
      }
    }
    return true;
  }

  private async loadScript(
    cacheKey: string,
    libraries: string[],
    callback?: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const scriptId = "google-maps-api-script";
      const existingScript = document.getElementById(scriptId);

      if (existingScript) {
        // Script already exists, wait for it to load
        this.waitForGoogleMaps(resolve, reject);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
      if (!apiKey) {
        reject(new Error("Google Maps API key not found"));
        return;
      }

      // Create callback function
      const callbackName = callback || `_googleMapsLoaded_${Date.now()}`;
      (window as any)[callbackName] = () => {
        this.loadState.isLoaded = true;
        this.loadState.isLoading = false;

        // Execute any pending callbacks
        const pendingCallbacks = this.callbacks.get(cacheKey) || [];
        pendingCallbacks.forEach((cb) => cb());
        this.callbacks.delete(cacheKey);

        resolve();
      };

      // Build URL with libraries
      const librariesParam =
        libraries.length > 0 ? `&libraries=${libraries.join(",")}` : "";
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async&callback=${callbackName}${librariesParam}`;

      // Create and inject script
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.defer = true;
      script.src = scriptUrl;
      script.onerror = () => {
        this.loadState.error = new Error("Google Maps script failed to load");
        this.loadState.isLoading = false;
        reject(this.loadState.error);
      };

      document.head.appendChild(script);
    });
  }

  private waitForGoogleMaps(
    resolve: () => void,
    reject: (error: Error) => void
  ): void {
    const checkInterval = setInterval(() => {
      if ((window as any).google?.maps) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error("Google Maps loading timeout"));
    }, 10000);
  }

  /**
   * Check if Google Maps is loaded with required libraries
   */
  isLoaded(libraries: string[] = []): boolean {
    return this.loadState.isLoaded && this.hasRequiredLibraries(libraries);
  }

  /**
   * Get current load state
   */
  getLoadState(): LoadedState {
    return { ...this.loadState };
  }
}

// Export singleton instance
export const googleMapsLoader = GoogleMapsLoader.getInstance();

// Export convenience functions
export const loadGoogleMaps = (options?: GoogleMapsLoaderOptions) =>
  googleMapsLoader.loadGoogleMaps(options);

export const isGoogleMapsLoaded = (libraries?: string[]) =>
  googleMapsLoader.isLoaded(libraries);

export const getGoogleMapsLoadState = () => googleMapsLoader.getLoadState();
