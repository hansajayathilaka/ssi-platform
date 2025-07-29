/**
 * Test Setup
 *
 * Global test configuration and setup for Jest tests.
 */

import * as fs from "fs";
import * as path from "path";

// Create test data directory if it doesn't exist
const testDataDir = path.join(__dirname, "../../test-data");
const testSchemasDir = path.join(testDataDir, "schemas");

beforeAll(() => {
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }
  if (!fs.existsSync(testSchemasDir)) {
    fs.mkdirSync(testSchemasDir, { recursive: true });
  }
});

afterAll(() => {
  // Clean up test data directory
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
});

// Increase timeout for integration tests
jest.setTimeout(10000);
