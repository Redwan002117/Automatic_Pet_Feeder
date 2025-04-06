/**
 * Automatic Pet Feeder - Server
 * This is a simple Express server to serve static files and provide API endpoints
 * For production, you may want to use Supabase or another backend service
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client (only if both URL and key are provided)
let supabase = null;

// Check for environment variables first
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_ANON_KEY;

// If not found in environment, try to read from config.js
if (!supabaseUrl || !supabaseKey) {
  try {
    const configPath = path.join(__dirname, 'public', 'scripts', 'config.js');
    
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Extract values using regex
      const urlMatch = configContent.match(/SUPABASE_URL\s*=\s*['"](.*?)['"]/);
      const keyMatch = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"](.*?)['"]/);
      
      if (urlMatch && urlMatch[1]) supabaseUrl = urlMatch[1];
      if (keyMatch && keyMatch[1]) supabaseKey = keyMatch[1];
    }
  } catch (error) {
    console.error('Error reading config.js:', error.message);
  }
}

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Error initializing Supabase client:', error.message);
    console.log('Server will run without Supabase integration');
  }
} else {
  console.warn('Supabase URL or key not provided. Running without Supabase integration.');
  console.warn('To enable Supabase, set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    supabase: supabase ? 'connected' : 'disabled'
  });
});

// Config endpoint to provide client-side configuration
app.get('/api/config', (req, res) => {
  // Only send public configuration that is safe to expose to the client
  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    APP_VERSION: process.env.APP_VERSION || '1.0.0',
    APP_NAME: process.env.APP_NAME || 'Automatic Pet Feeder'
  });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Serve SPA for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});
