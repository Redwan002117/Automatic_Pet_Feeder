<?php
/**
 * Environment Variables for Automatic Pet Feeder
 * 
 * This file provides environment variables for the application when deployed on cPanel
 */

// Supabase configuration
$_ENV['SUPABASE_URL'] = 'https://mgqtlgpcdswfmvgheeff.supabase.co';
$_ENV['SUPABASE_ANON_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NjUxOTUsImV4cCI6MjA1OTU0MTE5NX0.bIQBXBmi4x1GYjh7nFRZ0vcFb-Rs2yn2hKMROxt5r3w';
$_ENV['JWT_SECRET'] = '2D/HfJgI/xS4jna7voM/b10TIVC3NRZ5JYcEoOduqeE4n3M4gPDdcKcmerb4gIYfGXRtyyL+RBo4qVUXrUcqjw==';
$_ENV['APP_VERSION'] = '1.0.0';
$_ENV['APP_NAME'] = 'Automatic Pet Feeder';

// Cloudflare Turnstile settings - updated with valid keys
$_ENV['TURNSTILE_SITE_KEY'] = '0x4AAAAAABE4vb5aDnASXiYA';
$_ENV['TURNSTILE_SECRET_KEY'] = '0x4AAAAAABE4vVpdRG4xovT1RwG9k8ZWPhM';
$_ENV['TURNSTILE_ALLOWED_DOMAINS'] = 'petfeeder.redwancodes.com,automaticpetfeeder.redwancodes.com,localhost';

// Make environment variables available in the global scope
foreach ($_ENV as $key => $value) {
    putenv("$key=$value");
}

// Set appropriate CORS headers for Cloudflare Turnstile
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowedOrigins = [
        'https://challenges.cloudflare.com',
        'https://petfeeder.redwancodes.com',
        'https://automaticpetfeeder.redwancodes.com',
        'http://localhost'
    ];
    
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        
        // Handle preflight OPTIONS request
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}

// For debugging purposes - enable when needed
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);