// import { describe, it } from 'node:test';
// import assert from 'node:assert';
// import { brandingService, BrandingConfig } from './branding';

// // Mock the window object for testing
// declare global {
//   interface Window {
//     __RUNTIME_CONFIG__?: {
//       SERVER_URL?: string;
//       CUSTOM_ORG_NAME?: string;
//       CUSTOM_LOGO_URL?: string;
//       CUSTOM_PRIMARY_COLOR?: string;
//       CUSTOM_SECONDARY_COLOR?: string;
//       CUSTOM_FAVICON_URL?: string;
//       CUSTOM_CSS_URL?: string;
//     };
//   }
// }

// describe('BrandingService', () => {
//   beforeEach(() => {
//     // Reset the service before each test
//     brandingService.reset();
//     // Clear any existing runtime config
//     delete (window as any).__RUNTIME_CONFIG__;
//   });

//   it('should return default configuration when no custom config is provided', () => {
//     const config = brandingService.getBrandingConfig();
//     assert.strictEqual(config.organizationName, 'Veridian');
//     assert.strictEqual(config.logoUrl, undefined);
//   });

//   it('should load configuration from runtime config', async () => {
//     // Mock runtime configuration
//     (window as any).__RUNTIME_CONFIG__ = {
//       CUSTOM_ORG_NAME: 'Test Organization',
//       CUSTOM_LOGO_URL: 'https://example.com/logo.png',
//       CUSTOM_PRIMARY_COLOR: '#ff0000',
//     };

//     const config = await brandingService.loadBrandingConfig();

//     assert.strictEqual(config.organizationName, 'Test Organization');
//     assert.strictEqual(config.logoUrl, 'https://example.com/logo.png');
//     assert.strictEqual(config.primaryColor, '#ff0000');
//   });

//   it('should detect custom logo availability', () => {
//     (window as any).__RUNTIME_CONFIG__ = {
//       CUSTOM_LOGO_URL: 'https://example.com/logo.png',
//     };

//     brandingService.loadBrandingConfig();
//     assert.strictEqual(brandingServmLogo()).toBe(true);
//   });

//   it('should return false for custom logo when URL is empty', () => {
//     (window as any).__RUNTIME_CONFIG__ = {
//       CUSTOM_LOGO_URL: '',
//     };

//     brandingService.loadBrandingConfig();
//     assert.strictEqual(brandingService.hasCustomLogo(), false);
//   });

//   it('should get organization name with fallback', () => {
//     assert.strictEqual(brandingService.getOrganizationName(), 'Veridian');

//     (window as any).__RUNTIME_CONFIG__ = {
//       CUSTOM_ORG_NAME: 'Custom Org',
//     };

//     brandingService.loadBrandingConfig();
//     assert.strictEqual(brandingService.getOrganizationName(), 'Custom Org');
//   });
// });
