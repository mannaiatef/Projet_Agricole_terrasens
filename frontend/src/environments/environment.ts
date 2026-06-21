// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  stressServiceUrl: 'http://localhost:3000/api/stress',
  irrigationServiceUrl: 'http://localhost:3000/api/irrigation',
  cropCalendarServiceUrl: 'http://localhost:3003',
  authServiceUrl: 'http://localhost:3001',

  // API Configuration
  api: {
    // Stress Service Endpoints
    stress: {
      baseUrl: 'http://localhost:3000/api/stress',
      latestAnalysis: '/stress/parcel/:parcelId/latest',
      triggerAnalysis: '/stress/analyze',
      jobStatus: '/stress/jobs/:jobId',
      analysisHistory: '/stress/parcel/:parcelId/history',
      alerts: '/stress/parcel/:parcelId/alerts',
      acknowledgeAlert: '/stress/alerts/:alertId/acknowledge',
      queueStats: '/stress/queue/stats',
      bulkAnalyze: '/stress/analyze-bulk',
      health: '/health/status'
    },

    // Crop Calendar Service Endpoints
    cropCalendar: {
      baseUrl: 'http://localhost:3003/api',
      parcels: '/parcels',
      parcelById: '/parcels/:parcelId',
      parcelGeometry: '/parcels/:parcelId/geometry',
      parcelsByFarmer: '/farmers/:farmerId/parcels'
    },

    // Sentinel Hub Service Endpoints
    sentinelHub: {
      baseUrl: 'http://localhost:3000/api/stress/sentinel',
      getImage: '/image/:fieldId',
      getImageMetadata: '/image/:fieldId/metadata',
      getFieldInfo: '/field/:fieldId/info',
      getNDVILegend: '/legend',
      downloadImage: '/download/:fieldId'
    }
  },

  // Feature Flags
  features: {
    enableRealTimeUpdates: true,
    enableMapVisualization: true,
    enableAlertNotifications: true,
    enableBulkAnalysis: true
  },

  // Polling Configuration
  polling: {
    jobStatusInterval: 3000,      // 3 seconds
    maxWaitTime: 600000,          // 10 minutes
    autoRefreshInterval: 60000    // 1 minute for periodic analysis refresh
  },

  // Map Configuration
  map: {
    defaultZoom: 12,
    minZoom: 3,
    maxZoom: 18,
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    tileAttribution: '© OpenStreetMap contributors'
  },

  // Logging
  logging: {
    enableConsoleLogging: true,
    logLevel: 'debug'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
