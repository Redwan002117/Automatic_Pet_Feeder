<?php
/**
 * API Handler for Automatic Pet Feeder
 * 
 * This file serves as a bridge between the frontend and Supabase
 * for hosting on cPanel environments where Node.js is not available.
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load environment variables from .env file if available
$env_file = __DIR__ . '/../.env';
if (file_exists($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

// Get configuration from config.js if environment variables are not available
if (empty($_ENV['SUPABASE_URL']) || empty($_ENV['SUPABASE_ANON_KEY'])) {
    $config_file = __DIR__ . '/scripts/config.js';
    if (file_exists($config_file)) {
        $config_content = file_get_contents($config_file);
        
        // Extract Supabase URL
        preg_match('/SUPABASE_URL\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $url_matches);
        if (!empty($url_matches[1])) {
            $_ENV['SUPABASE_URL'] = $url_matches[1];
            putenv("SUPABASE_URL={$url_matches[1]}");
        }
        
        // Extract Supabase Anon Key
        preg_match('/SUPABASE_ANON_KEY\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $key_matches);
        if (!empty($key_matches[1])) {
            $_ENV['SUPABASE_ANON_KEY'] = $key_matches[1];
            putenv("SUPABASE_ANON_KEY={$key_matches[1]}");
        }
    }
}

// Get the request path
$request = isset($_GET['request']) ? $_GET['request'] : '';

// Handle different API endpoints
switch ($request) {
    case 'health':
        // Health check endpoint
        echo json_encode([
            'status' => 'ok',
            'message' => 'API is running',
            'supabase' => (!empty($_ENV['SUPABASE_URL']) && !empty($_ENV['SUPABASE_ANON_KEY'])) ? 'configured' : 'not configured'
        ]);
        break;
        
    case 'config':
        // Config endpoint to provide client-side configuration
        echo json_encode([
            'SUPABASE_URL' => $_ENV['SUPABASE_URL'] ?? '',
            'SUPABASE_ANON_KEY' => $_ENV['SUPABASE_ANON_KEY'] ?? '',
            'APP_VERSION' => $_ENV['APP_VERSION'] ?? '1.0.0',
            'APP_NAME' => $_ENV['APP_NAME'] ?? 'Automatic Pet Feeder'
        ]);
        break;
        
    default:
        // Handle unknown endpoints
        http_response_code(404);
        echo json_encode([
            'error' => 'Not Found',
            'message' => 'The requested endpoint does not exist'
        ]);
        break;
}