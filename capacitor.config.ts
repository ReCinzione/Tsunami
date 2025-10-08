import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tsunami.app',
  appName: 'mindful-errant-voyage',
  webDir: 'dist',
  server: {
    url: 'http://localhost:8081',
    cleartext: true
  },
};

export default config;