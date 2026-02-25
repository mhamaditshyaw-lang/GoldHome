#!/usr/bin/env node
/**
 * cPanel Entry Point for Gold Home Cleaning Management System
 * This file is specifically designed for cPanel hosting environments
 */

// Import the built server application
import('./dist/index.js').catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});