# 🎨 Frontend (Angular)

Modern Angular frontend for the Terrasens agriculture SaaS platform.

## Features

- ✅ User authentication (login/register)
- ✅ JWT token management
- ✅ Protected routes with AuthGuard
- ✅ Responsive design
- ✅ Form validation
- ✅ Error handling
- ✅ Clean and intuitive UI

## Prerequisites

- Node.js 18 or higher
- Angular CLI 17 or higher
- npm

## Installation

```bash
cd frontend
npm install --global @angular/cli@17
npm install
```

## Configuration

The frontend configuration is in `environment` files or `.env`:

```env
API_URL=http://localhost:3000/api
```

## Running the Service

### Development Mode
```bash
ng serve
```

or

```bash
npm start
```

The application will be available at `http://localhost:4200`

### Production Build
```bash
ng build --configuration production
```

Build artifacts will be stored in `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts       # Authentication service
│   │   │   └── guards/
│   │   │       └── auth.guard.ts         # Route guard for protected routes
│   │   ├── features/
│   │   │   └── auth/
│   │   │       ├── login/
│   │   │       │   ├── login.component.ts
│   │   │       │   ├── login.component.html
│   │   │       │   └── login.component.css
│   │   │       └── register/
│   │   │           ├── register.component.ts
│   │   │           ├── register.component.html
│   │   │           └── register.component.css
│   │   ├── shared/                       # Shared components
│   │   ├── app.module.ts                 # Root module
│   │   ├── app-routing.module.ts         # Routing configuration
│   │   ├── app.component.ts              # Root component
│   │   └── app.component.html
│   ├── styles.css                        # Global styles
│   ├── main.ts                           # Bootstrap file
│   ├── index.html                        # HTML entry point
│   └── ...
├── angular.json                          # Angular CLI configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication Flow

### Login Process

1. User enters credentials (email, password)
2. Frontend sends request to `/api/auth/login`
3. API Gateway forwards to Auth Service
4. Auth Service validates and returns JWT token
5. Token is stored in localStorage
6. User is redirected to dashboard

### Protected Routes

- Routes are protected by `AuthGuard`
- Guard checks if user is authenticated
- Unauthenticated users are redirected to login

### Logout

- User clicks logout button
- Token is removed from localStorage
- User is redirected to login page

## Services

### AuthService

Location: `src/app/core/services/auth.service.ts`

Methods:
- `register(name, email, password): Observable<AuthResponse>`
- `login(email, password): Observable<AuthResponse>`
- `verifyToken(token): Observable<any>`
- `logout(): void`
- `getCurrentUser(): User | null`
- `getToken(): string | null`
- `isLoggedIn(): boolean`

Observables:
- `user$: Observable<User | null>`
- `token$: Observable<string | null>`
- `isLoggedIn$: Observable<...>`

### AuthGuard

Location: `src/app/core/guards/auth.guard.ts`

- Implements `CanActivate` interface
- Protects routes from unauthorized access
- Redirects to login if not authenticated

## Components

### Login Component

- Email validation
- Password validation (minimum 6 characters)
- Error message display
- Loading state
- Link to register page

### Register Component

- Name validation (minimum 2 characters)
- Email validation
- Password validation (minimum 6 characters)
- Password confirmation
- Error message display
- Loading state
- Link to login page

## Routing

The application has the following routes:

| Route | Component | Protected |
|-------|-----------|-----------|
| `/` | Redirects to `/login` | No |
| `/login` | LoginComponent | No |
| `/register` | RegisterComponent | No |
| `/dashboard` | LoginComponent (placeholder) | Yes |
| `**` | Redirects to `/login` | No |

## Styling

### Global Styles (`src/styles.css`)

- Reset styles
- Color scheme
- Button styles
- Form input styles
- Utility classes

### Component Styles

- Login/Register card styling
- Form group styling
- Error message styling
- Responsive design

## Error Handling

The application handles the following error scenarios:

1. **Network Errors**
   - Displays error message to user
   - Allows retry

2. **Validation Errors**
   - Shows inline error messages
   - Disables submit button

3. **API Errors**
   - Displays server error messages
   - Handles timeout scenarios

## Testing

### Run Unit Tests
```bash
ng test
```

### Run E2E Tests
```bash
ng e2e
```

## Development

### Code Style

- TypeScript strict mode
- ESLint configuration
- Component-based architecture
- Reactive Forms

### Building Features

When adding new features:

1. Create component in `src/app/features/`
2. Add route in `app-routing.module.ts`
3. Import in `app.module.ts`
4. Add styling
5. Create service if needed

Example:
```bash
ng generate component features/auth/login
ng generate service core/services/auth
```

## Deployment

### Build for Production

```bash
ng build --configuration production
```

### Serve Static Files

After building, serve the `dist/` folder with any static server:

```bash
# Using http-server
npx http-server dist/terrasens -p 4200

# Using nginx
nginx -c nginx.conf
```

### Environment Configuration

Create different configuration files:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.terrasens.com/api'
};

// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

## Modules

### AppModule

Root module that imports:
- BrowserModule
- BrowserAnimationsModule
- HttpClientModule
- FormsModule
- ReactiveFormsModule
- AppRoutingModule

### Feature Modules

Can be created for larger features:
```typescript
@NgModule({
  declarations: [LoginComponent, RegisterComponent],
  imports: [CommonModule, ReactiveFormsModule],
})
export class AuthModule {}
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @angular/core | ^17.0.0 | Core Angular framework |
| @angular/forms | ^17.0.0 | Form handling |
| @angular/router | ^17.0.0 | Route management |
| rxjs | ^7.8.1 | Reactive programming |
| typeScript | ^5.2.0 | Language |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

### Code Splitting

Implement lazy loading for feature modules:

```typescript
const routes: Routes = [
  {
    path: 'feature',
    loadChildren: () => import('./features/feature/feature.module')
      .then(m => m.FeatureModule)
  }
];
```

### Change Detection

- Use OnPush strategy for better performance
- Unsubscribe from observables to prevent memory leaks

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance

## Troubleshooting

### Port Already in Use
```bash
ng serve --port 4201
```

### Module Not Found
```bash
npm install
npm ci  # Clean install
```

### CORS Issues
- Ensure API Gateway is running
- Check CORS configuration in backend

### Token Expired
- Automatically redirects to login
- Refreshes token if available

## Development Tips

1. **Use Angular DevTools Extension**
   - Better debugging experience
   - Component tree visualization

2. **Enable Strict Mode**
   - TypeScript strict checking
   - Helps catch errors early

3. **Use Reactive Forms**
   - Better for complex forms
   - Easier to test

4. **Implement Error Interceptor**
   - Centralized error handling
   - Consistent error messages

## Future Enhancements

- [ ] Add dashboard component
- [ ] Implement lazy loading modules
- [ ] Add HTTP interceptors for token injection
- [ ] Implement error interceptor
- [ ] Add request/response logging
- [ ] Implement token refresh logic
- [ ] Add form error messages service
- [ ] Implement dark mode
- [ ] Add animations
- [ ] Implement service worker
- [ ] Add offline capability
- [ ] Implement tests (Jest, Cypress)

## Support

For issues or questions, please check the main [README.md](../README.md) or contact the development team.

---

**Frontend ready! 🎨**
