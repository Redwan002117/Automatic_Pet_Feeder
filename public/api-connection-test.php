<?php
/**
 * API Connection Test for Automatic Pet Feeder
 * 
 * This file tests the Supabase API connectivity from your cPanel hosting.
 * Use this to verify that your environment variables are correctly set up.
 */

// Set headers for JSON response
header('Content-Type: application/json');

// Initialize response
$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'status' => 'unknown',
    'tests' => []
];

// Load environment variables
function loadEnvVars() {
    // Try .env.php
    if (file_exists('.env.php')) {
        include_once '.env.php';
    }
    
    // Try config.js
    if (empty($_ENV['SUPABASE_URL'])) {
        if (file_exists('scripts/config.js')) {
            $config = file_get_contents('scripts/config.js');
            preg_match('/SUPABASE_URL\s*=\s*[\'"](.*?)[\'"]/i', $config, $matches);
            if (!empty($matches[1])) {
                $_ENV['SUPABASE_URL'] = $matches[1];
                putenv("SUPABASE_URL={$matches[1]}");
            }
            
            preg_match('/SUPABASE_ANON_KEY\s*=\s*[\'"](.*?)[\'"]/i', $config, $matches);
            if (!empty($matches[1])) {
                $_ENV['SUPABASE_ANON_KEY'] = $matches[1];
                putenv("SUPABASE_ANON_KEY={$matches[1]}");
            }
        }
    }
    
    // Try production-config.js
    if (empty($_ENV['SUPABASE_URL'])) {
        if (file_exists('production-config.js')) {
            $config = file_get_contents('production-config.js');
            preg_match('/SUPABASE_URL\s*=\s*[\'"](.*?)[\'"]/i', $config, $matches);
            if (!empty($matches[1])) {
                $_ENV['SUPABASE_URL'] = $matches[1];
                putenv("SUPABASE_URL={$matches[1]}");
            }
            
            preg_match('/SUPABASE_ANON_KEY\s*=\s*[\'"](.*?)[\'"]/i', $config, $matches);
            if (!empty($matches[1])) {
                $_ENV['SUPABASE_ANON_KEY'] = $matches[1];
                putenv("SUPABASE_ANON_KEY={$matches[1]}");
            }
        }
    }
    
    return [
        'url' => $_ENV['SUPABASE_URL'] ?? null,
        'key' => $_ENV['SUPABASE_ANON_KEY'] ?? null
    ];
}

// Test Supabase connection
function testSupabase($url, $key) {
    if (empty($url) || empty($key)) {
        return [
            'status' => 'fail',
            'message' => 'Missing Supabase credentials'
        ];
    }
    
    try {
        $ch = curl_init("$url/rest/v1/");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "apikey: $key",
            "Authorization: Bearer $key"
        ]);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'status' => 'pass',
                'message' => 'Successfully connected to Supabase',
                'http_code' => $httpCode
            ];
        } else {
            return [
                'status' => 'fail',
                'message' => "Failed to connect to Supabase. HTTP code: $httpCode",
                'http_code' => $httpCode,
                'result' => $result
            ];
        }
    } catch (Exception $e) {
        return [
            'status' => 'fail',
            'message' => 'Exception: ' . $e->getMessage()
        ];
    }
}

// Test PHP capabilities
function testPhpCapabilities() {
    return [
        'php_version' => [
            'status' => version_compare(PHP_VERSION, '7.4.0') >= 0 ? 'pass' : 'fail',
            'message' => 'PHP ' . PHP_VERSION . (version_compare(PHP_VERSION, '7.4.0') >= 0 ? 
                         ' is sufficient' : ' is too low, 7.4.0 or higher recommended'),
        ],
        'curl' => [
            'status' => function_exists('curl_version') ? 'pass' : 'fail',
            'message' => function_exists('curl_version') ? 
                         'cURL is available: ' . (function_exists('curl_version') ? curl_version()['version'] : 'Unknown') : 
                         'cURL is not available'
        ],
        'json' => [
            'status' => function_exists('json_encode') ? 'pass' : 'fail',
            'message' => function_exists('json_encode') ? 'JSON functions available' : 'JSON functions not available'
        ]
    ];
}

// Run tests
$credentials = loadEnvVars();
$response['credentials_found'] = [
    'url' => !empty($credentials['url']),
    'key' => !empty($credentials['key'])
];

if (!empty($credentials['url'])) {
    $response['supabase_url_prefix'] = substr($credentials['url'], 0, 15) . '...';
}

$response['tests']['php'] = testPhpCapabilities();
$response['tests']['supabase'] = testSupabase(
    $credentials['url'], 
    $credentials['key']
);

$response['status'] = $response['tests']['supabase']['status'];

// Get server information
$response['server_info'] = [
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
];

echo json_encode($response, JSON_PRETTY_PRINT);