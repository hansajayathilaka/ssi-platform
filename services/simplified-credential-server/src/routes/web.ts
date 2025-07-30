/**
 * Web routes for serving HTML pages using EJS templates
 * Handles the frontend interface for credential issuance
 */

import { Router, Request, Response } from 'express';
import { config } from '../config';

const router: Router = Router();

/**
 * GET / - Dashboard page
 * Serves the main credential issuance dashboard
 * Requirements: 1.2, 4.1
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    // Render the dashboard template with necessary data
    res.render('dashboard', {
      title: 'Credential Issuance Dashboard',
      config: {
        apiPath: config.paths.api,
        invitationPath: config.paths.invitation,
        credentialPath: config.paths.credential,
        oobiEndpoint: config.oobiEndpoint
      },
      user: {
        // Add user context if authentication is implemented
        isAuthenticated: true // Placeholder for future authentication
      },
      system: {
        // System information for the dashboard
        serverStatus: 'running',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error rendering dashboard:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load dashboard',
      error: process.env['NODE_ENV'] === 'development' ? error : {}
    });
  }
});

/**
 * GET /invitation - Invitation generation page
 * Serves a dedicated page for invitation generation
 * Requirements: 1.2, 4.1
 */
router.get('/invitation', (_req: Request, res: Response) => {
  try {
    res.render('invitation', {
      title: 'Generate Invitation',
      config: {
        apiPath: config.paths.api,
        invitationPath: config.paths.invitation,
        oobiEndpoint: config.oobiEndpoint
      },
      breadcrumb: [
        { name: 'Dashboard', url: '/' },
        { name: 'Generate Invitation', url: '/invitation' }
      ]
    });
  } catch (error) {
    console.error('Error rendering invitation page:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load invitation page',
      error: process.env['NODE_ENV'] === 'development' ? error : {}
    });
  }
});

/**
 * GET /credential - Credential issuance page
 * Serves a dedicated page for credential issuance
 * Requirements: 1.2, 4.1
 */
router.get('/credential', (_req: Request, res: Response) => {
  try {
    res.render('credential', {
      title: 'Issue Credential',
      config: {
        apiPath: config.paths.api,
        credentialPath: config.paths.credential,
        oobiEndpoint: config.oobiEndpoint
      },
      breadcrumb: [
        { name: 'Dashboard', url: '/' },
        { name: 'Issue Credential', url: '/credential' }
      ]
    });
  } catch (error) {
    console.error('Error rendering credential page:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load credential page',
      error: process.env['NODE_ENV'] === 'development' ? error : {}
    });
  }
});

/**
 * GET /status - System status page
 * Serves a page showing system health and configuration
 * Requirements: 1.2
 */
router.get('/status', (_req: Request, res: Response) => {
  try {
    res.render('status', {
      title: 'System Status',
      config: {
        port: config.port,
        keriaUrl: config.keria.url,
        keriaBootUrl: config.keria.bootUrl,
        oobiEndpoint: config.oobiEndpoint
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
        platform: process.platform
      },
      breadcrumb: [
        { name: 'Dashboard', url: '/' },
        { name: 'System Status', url: '/status' }
      ]
    });
  } catch (error) {
    console.error('Error rendering status page:', error);
    res.status(500).render('error', {
      title: 'Server Error',
      message: 'Unable to load status page',
      error: process.env['NODE_ENV'] === 'development' ? error : {}
    });
  }
});

/**
 * Error handling middleware for web routes
 * Catches any unhandled errors and renders an error page
 */
router.use((error: Error, req: Request, res: Response, _next: any) => {
  console.error('Web route error:', error);
  
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'An unexpected error occurred',
    error: process.env['NODE_ENV'] === 'development' ? error : {},
    breadcrumb: [
      { name: 'Dashboard', url: '/' },
      { name: 'Error', url: req.path }
    ]
  });
});

export default router;