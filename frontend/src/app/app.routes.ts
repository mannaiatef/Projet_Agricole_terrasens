import { Routes } from '@angular/router';

export const routes: Routes = [
    /**
     * PUBLIC LAYOUT ROUTES
     * Unauthenticated users
     * No sidebar, full-screen immersive UI
     */
    {
        path: '',
        loadComponent: () => import('./layouts/public-layout/public-layout.component')
            .then(m => m.PublicLayoutComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./features/landing/landing.component')
                    .then(m => m.LandingComponent),
                data: { title: 'Home - TerraSens' }
            },
            {
                path: 'auth/login',
                loadComponent: () => import('./features/auth/login/login.component')
                    .then(m => m.LoginComponent),
                data: { title: 'Sign In - TerraSens' }
            },
            {
                path: 'auth/register',
                loadComponent: () => import('./features/auth/register/register.component')
                    .then(m => m.RegisterComponent),
                data: { title: 'Sign Up - TerraSens' }
            }
        ]
    },

    /**
     * DASHBOARD LAYOUT ROUTES
     * Authenticated users
     * Sidebar, top nav, protected routes
     * TODO: Add AuthGuard to protect these routes
     */
    {
        path: 'app',
        loadComponent: () => import('./layouts/dashboard-layout/dashboard-layout.component')
            .then(m => m.DashboardLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component')
                    .then(m => m.DashboardComponent),
                data: { title: 'Dashboard' }
            },
            {
                path: 'farms',
                loadComponent: () => import('./features/farms/farms.component')
                    .then(m => m.FarmsComponent),
                data: { title: 'My Farms' }
            },
            {
                path: 'crop-calendar',
                loadComponent: () => import('./features/calendar/crop-calendar.component')
                    .then(m => m.CropCalendarComponent),
                data: { title: 'Crop Calendar' }
            },
            {
                path: 'irrigation',
                loadComponent: () => import('./features/irrigation/irrigation.component')
                    .then(m => m.IrrigationComponent),
                data: { title: 'Irrigation Management' }
            },
            {
                path: 'satellite',
                loadComponent: () => import('./features/satellite/satellite.component')
                    .then(m => m.SatelliteComponent),
                data: { title: 'Satellite & NDVI' }
            },

            
            {
                path: 'chatbot',
                loadComponent: () => import('./features/chatbot/chatbot.component')
                    .then(m => m.ChatbotComponent),
                data: { title: 'AgriSmart AI' }
            },
            {
                path: 'fields',
                loadComponent: () => import('./features/fields/fields-list/fields-list.component')
                    .then(m => m.FieldsListComponent),
                data: { title: 'My Fields (Parcelles)' }
            },
            {
                path: 'fields/:fieldId',
                loadComponent: () => import('./features/fields/field-dashboard/field-dashboard.component')
                    .then(m => m.FieldDashboardComponent),
                data: { title: 'Field Details' }
            },
            {
                path: 'stress',
                loadComponent: () => import('./features/stress/stress.component')
                    .then(m => m.StressComponent),
                data: { title: 'Water Stress Analysis' }
            },
            {
                path: 'disease-detection',
                loadComponent: () => import('./features/disease-detection/disease-detection.component')
                    .then(m => m.DiseaseDetectionComponent),
                data: { title: 'Disease & Pest Detection' }
            },
            {
                path: 'disease-detection/analysis/:analysisId',
                loadComponent: () => import('./features/disease-detection/disease-detail/disease-detail.component')
                    .then(m => m.DiseaseDetailComponent),
                data: { title: 'Analysis Details' }
            }
        ]
    },

    /**
     * LEGACY REDIRECTS
     * Backwards compatibility with old routes
     */
    { path: 'dashboard', redirectTo: '/app/dashboard', pathMatch: 'full' },
    { path: 'farms', redirectTo: '/app/farms', pathMatch: 'full' },
    { path: 'crop-calendar', redirectTo: '/app/crop-calendar', pathMatch: 'full' },
    { path: 'calendar', redirectTo: '/app/crop-calendar', pathMatch: 'full' },
    { path: 'irrigation', redirectTo: '/app/irrigation', pathMatch: 'full' },
    { path: 'satellite', redirectTo: '/app/satellite', pathMatch: 'full' },
    { path: 'stress', redirectTo: '/app/stress', pathMatch: 'full' },
    { path: 'disease-detection', redirectTo: '/app/disease-detection', pathMatch: 'full' },
    { path: 'fields', redirectTo: '/app/fields', pathMatch: 'full' },
    { path: 'home', redirectTo: '/app/dashboard', pathMatch: 'full' },


    /**
     * CATCH-ALL
     * Redirect unknown routes to landing page
     */
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
