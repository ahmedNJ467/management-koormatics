
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a6a09cac57cf4618b49f4e27ff035a1a',
  appName: 'peace-keeper-dashboard',
  webDir: 'dist',
  server: {
    url: 'https://a6a09cac-57cf-4618-b49f-4e27ff035a1a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
