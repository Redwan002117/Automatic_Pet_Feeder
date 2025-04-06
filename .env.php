<?php
/**
 * Environment Variables for Automatic Pet Feeder
 * 
 * This file provides environment variables for the application when deployed on cPanel
 */

// Supabase configuration
$_ENV['SUPABASE_URL'] = 'https://mgqtlgpcdswfmvgheeff.supabase.co';
$_ENV['SUPABASE_ANON_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI4NzE2MzUsImV4cCI6MjAyODQ0NzYzNX0.0zFV4KE3mAUa9Q-RD1J09sSJ7SojqRrZI4hpKgvdqE4';
$_ENV['JWT_SECRET'] = 'xZ40wHV8uniZi1/osG4+qiJN9lBgpXBROE8zHB9Weeaw2nZCEeyxMP4Fa9texKQGWAjcCFf5vfWA+fXDH5YJkA==';
$_ENV['APP_VERSION'] = '1.0.0';
$_ENV['APP_NAME'] = 'Automatic Pet Feeder';

// Cloudflare Turnstile settings - updated with new keys
$_ENV['TURNSTILE_SITE_KEY'] = '0x4AAAAAABE4vb5aDnASXiYA';
$_ENV['TURNSTILE_SECRET_KEY'] = '0x4AAAAAABE4vVpdRG4xovT1RwG9k8ZWPhM';
$_ENV['TURNSTILE_ALLOWED_DOMAINS'] = 'automaticpetfeeder.redwancodes.com';

// Make environment variables available in the global scope
foreach ($_ENV as $key => $value) {
    putenv("$key=$value");
}

// Set appropriate CORS headers for Cloudflare Turnstile
if (isset($_SERVER['HTTP_ORIGIN']) && strpos($_SERVER['HTTP_ORIGIN'], 'challenges.cloudflare.com') !== false) {
    header('Access-Control-Allow-Origin: https://challenges.cloudflare.com');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// For debugging purposes - enable when needed
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);