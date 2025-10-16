#!/usr/bin/env node

// Simple development server that disables external services
process.env.DISABLE_KAFKA = 'true';
process.env.DISABLE_REDIS = 'true';
process.env.NODE_ENV = 'development';

// Override console methods to suppress external service warnings
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args) => {
  const message = args.join(' ');
  if (message.includes('Kafka') || message.includes('Redis') || message.includes('Infrastructure')) {
    return; // Suppress these warnings
  }
  originalConsoleWarn(...args);
};

console.error = (...args) => {
  const message = args.join(' ');
  if (message.includes('Kafka') || message.includes('Redis') || message.includes('Connection error')) {
    return; // Suppress these errors
  }
  originalConsoleError(...args);
};

// Start Next.js
const { spawn } = require('child_process');
const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
  stdio: 'inherit',
  env: { ...process.env }
});

nextProcess.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
});

nextProcess.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
});
