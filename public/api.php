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
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, apikey, x-client-info');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load environment variables - try multiple sources
function loadEnvironmentVariables() {
    // 1. Try .env file in parent directory
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
    
    // 2. Try .env.php in current directory (cPanel recommended method)
    $env_php_file = __DIR__ . '/.env.php';
    if (file_exists($env_php_file)) {
        include $env_php_file;
    }
    
    // 3. If still missing, try config.js
    if (empty($_ENV['SUPABASE_URL']) || empty($_ENV['SUPABASE_ANON_KEY'])) {
        $config_file = __DIR__ . '/scripts/config.js';
        if (file_exists($config_file)) {
            $config_content = file_get_contents($config_file);
            
            preg_match('/SUPABASE_URL\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $url_matches);
            if (!empty($url_matches[1])) {
                $_ENV['SUPABASE_URL'] = $url_matches[1];
                putenv("SUPABASE_URL={$url_matches[1]}");
            }
            
            preg_match('/SUPABASE_ANON_KEY\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $key_matches);
            if (!empty($key_matches[1])) {
                $_ENV['SUPABASE_ANON_KEY'] = $key_matches[1];
                putenv("SUPABASE_ANON_KEY={$key_matches[1]}");
            }
        }
    }
    
    // 4. As a last resort, try production-config.js
    if (empty($_ENV['SUPABASE_URL']) || empty($_ENV['SUPABASE_ANON_KEY'])) {
        $prod_config_file = __DIR__ . '/production-config.js';
        if (file_exists($prod_config_file)) {
            $config_content = file_get_contents($prod_config_file);
            
            preg_match('/SUPABASE_URL\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $url_matches);
            if (!empty($url_matches[1])) {
                $_ENV['SUPABASE_URL'] = $url_matches[1];
                putenv("SUPABASE_URL={$url_matches[1]}");
            }
            
            preg_match('/SUPABASE_ANON_KEY\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $key_matches);
            if (!empty($key_matches[1])) {
                $_ENV['SUPABASE_ANON_KEY'] = $key_matches[1];
                putenv("SUPABASE_ANON_KEY={$key_matches[1]}");
            }
        }
    }
}

// Load environment variables
loadEnvironmentVariables();

// Get the request path
$request = isset($_GET['request']) ? $_GET['request'] : '';

// Add debug information to response in development
$debug = [];
if ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], 'test.') === 0) {
    $debug = [
        'env_vars_found' => !empty($_ENV['SUPABASE_URL']) && !empty($_ENV['SUPABASE_ANON_KEY']),
        'supabase_url_prefix' => !empty($_ENV['SUPABASE_URL']) ? substr($_ENV['SUPABASE_URL'], 0, 15) . '...' : 'not set',
        'http_host' => $_SERVER['HTTP_HOST'],
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'request_uri' => $_SERVER['REQUEST_URI'],
        'php_version' => phpversion()
    ];
}

// Handle different API endpoints
switch ($request) {
    case 'health':
        // Health check endpoint
        echo json_encode([
            'status' => 'ok',
            'message' => 'API is running',
            'timestamp' => date('Y-m-d H:i:s'),
            'supabase' => (!empty($_ENV['SUPABASE_URL']) && !empty($_ENV['SUPABASE_ANON_KEY'])) ? 'configured' : 'not configured',
            'debug' => $debug
        ]);
        break;
        
    case 'config':
        // Config endpoint to provide client-side configuration
        echo json_encode([
            'SUPABASE_URL' => $_ENV['SUPABASE_URL'] ?? '',
            'SUPABASE_ANON_KEY' => $_ENV['SUPABASE_ANON_KEY'] ?? '',
            'APP_VERSION' => $_ENV['APP_VERSION'] ?? '1.0.0',
            'APP_NAME' => $_ENV['APP_NAME'] ?? 'Automatic Pet Feeder',
            'debug' => $debug
        ]);
        break;
        
    default:
        // Handle unknown endpoints
        http_response_code(404);
        echo json_encode([
            'error' => 'Not Found',
            'message' => 'The requested endpoint does not exist',
            'debug' => $debug
        ]);
        break;
}