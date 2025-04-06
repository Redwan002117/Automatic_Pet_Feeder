<?php
/**
 * Environment Variables for Automatic Pet Feeder
 * 
 * This file provides environment variables for the application when deployed on cPanel
 * It will be loaded by api.php and other PHP files that need access to environment variables
 */

// Supabase configuration
$_ENV['SUPABASE_URL'] = 'https://mgqtlgpcdswfmvgheeff.supabase.co';
$_ENV['SUPABASE_ANON_KEY'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY3ODAzNjIsImV4cCI6MTk5MjM1NjM2Mn0.8Rq8VbucEWbJUZg2XfxNBxQyAYZl5eEYWCifoZ2lQ_o';

// Application settings
$_ENV['APP_VERSION'] = '1.0.0';
$_ENV['APP_NAME'] = 'Automatic Pet Feeder';

// Make environment variables available in the global scope
foreach ($_ENV as $key => $value) {
    putenv("$key=$value");
}