# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Create directory structure for the simplified credential server
  - Initialize package.json with required dependencies (express, ejs, signify-ts, etc.)
  - Configure TypeScript and build scripts
  - _Requirements: 1.1, 5.2, 5.3_

- [x] 2. Create configuration module
  - Implement config.ts with environment variable handling
  - Define configuration interfaces and default values
  - Set up paths for API endpoints and static assets
  - _Requirements: 5.3, 5.4_

- [x] 3. Implement KERI utilities module
  - Create utils/keri.ts with Signify client initialization
  - Implement functions for identifier management and OOBI generation
  - Add credential issuance utility functions
  - _Requirements: 1.3, 2.1, 3.2_

- [x] 4. Create invitation controller
  - Implement controllers/invitation.ts for OOBI generation
  - Add function to generate KERI invitations
  - Handle invitation response formatting
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Create credential controller
  - Implement controllers/credential.ts for credential issuance
  - Add validation for credential data and schema
  - Implement ACDC credential issuance logic
  - Handle credential issuance responses and errors
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Set up API routes
  - Create routes/api.ts with REST API endpoints
  - Implement GET /api/invitation endpoint
  - Implement POST /api/credential endpoint
  - Add error handling middleware for API routes
  - _Requirements: 2.3, 3.3, 3.4_

- [x] 7. Create EJS templates
  - Set up views/layout.ejs as base template
  - Create views/dashboard.ejs for main interface
  - Add partials for header and footer components
  - Style templates with basic CSS
  - _Requirements: 1.2, 4.1, 4.4_

- [x] 8. Set up web routes
  - Create routes/web.ts for serving HTML pages
  - Implement GET / route for dashboard
  - Add route handlers for template rendering
  - _Requirements: 1.2, 4.1_

- [-] 9. Create dashboard form interface
  - Add HTML form for credential recipient information
  - Implement form validation and submission handling
  - Add invitation generation interface
  - Display success/error messages to users
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 10. Implement main server file
  - Create server.ts with Express app initialization
  - Set up EJS as template engine
  - Configure middleware (CORS, body parser, static files)
  - Initialize Signify clients and KERI infrastructure
  - Wire up all routes and start server
  - _Requirements: 1.1, 1.3, 5.1, 5.4_

- [ ] 11. Add static assets and styling
  - Create public directory structure for CSS, JS, and images
  - Add basic CSS styling for the web interface
  - Include any necessary client-side JavaScript
  - _Requirements: 1.2, 4.4, 5.4_

- [ ] 12. Add error handling and logging
  - Implement centralized error handling middleware
  - Add appropriate error responses for API and web routes
  - Include basic logging for server operations
  - _Requirements: 3.4, 4.3_