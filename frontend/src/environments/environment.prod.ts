export const environment = {
  production: true,
  apiUrl: 'https://api.terrasens.io',
  stressServiceUrl: 'https://api.terrasens.io/stress',
  cropCalendarServiceUrl: 'https://api.terrasens.io/crop-calendar',
  authServiceUrl: 'https://api.terrasens.io/auth',

  // API Configuration
  api: {
    // Stress Service Endpoints
    stress: {
      baseUrl: 'https://api.terrasens.io/stress/api',
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
      baseUrl: 'https://api.terrasens.io/crop-calendar/api',
      parcels: '/parcels',
      parcelById: '/parcels/:parcelId',
      parcelGeometry: '/parcels/:parcelId/geometry',
      parcelsByFarmer: '/farmers/:farmerId/parcels'
    },

    // Sentinel Hub Service Endpoints
    sentinelHub: {
      baseUrl: 'https://api.terrasens.io/stress/sentinel',
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
    enableConsoleLogging: false,
    logLevel: 'error'
  }
};
