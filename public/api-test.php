<?php
/**
 * API Test for Automatic Pet Feeder
 * 
 * This file tests the API and Supabase configuration.
 * Use this to verify your cPanel hosting setup.
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Create response array
$response = [
    'status' => 'success',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'host' => $_SERVER['HTTP_HOST'] ?? 'Unknown'
    ],
    'tests' => []
];

// Test PHP version
$response['tests']['php_version'] = [
    'name' => 'PHP Version Check',
    'status' => version_compare(PHP_VERSION, '7.4.0') >= 0 ? 'pass' : 'fail',
    'message' => 'PHP version ' . PHP_VERSION . (version_compare(PHP_VERSION, '7.4.0') >= 0 ? ' is sufficient' : ' is too low, 7.4.0 or higher recommended'),
    'version' => PHP_VERSION
];

// Test if file_get_contents is enabled
$response['tests']['file_get_contents'] = [
    'name' => 'File Get Contents Function',
    'status' => function_exists('file_get_contents') ? 'pass' : 'fail',
    'message' => function_exists('file_get_contents') ? 'Function is available' : 'Function is disabled'
];

// Test if cURL is enabled
$response['tests']['curl'] = [
    'name' => 'cURL Extension',
    'status' => function_exists('curl_version') ? 'pass' : 'fail',
    'message' => function_exists('curl_version') ? 'cURL is available: ' . (function_exists('curl_version') ? curl_version()['version'] : 'Unknown') : 'cURL is not available'
];

// Test config.js file
$config_file = __DIR__ . '/scripts/config.js';
$config_test = [
    'name' => 'Config.js File',
    'status' => 'unknown',
    'message' => ''
];

if (file_exists($config_file)) {
    $config_content = file_get_contents($config_file);
    $config_test['status'] = 'pass';
    $config_test['message'] = 'Config file exists';
    
    // Check if the config file has Supabase URL
    if (preg_match('/SUPABASE_URL\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $url_matches)) {
        $supabase_url = $url_matches[1];
        $config_test['supabase_url'] = !empty($supabase_url);
        $config_test['supabase_url_value'] = !empty($supabase_url) ? substr($supabase_url, 0, 15) . '...' : 'Not found';
    } else {
        $config_test['supabase_url'] = false;
        $config_test['supabase_url_value'] = 'Not found';
    }
    
    // Check if the config file has Supabase Anon Key
    if (preg_match('/SUPABASE_ANON_KEY\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $key_matches)) {
        $supabase_key = $key_matches[1];
        $config_test['supabase_key'] = !empty($supabase_key);
        $config_test['supabase_key_value'] = !empty($supabase_key) ? substr($supabase_key, 0, 15) . '...' : 'Not found';
    } else {
        $config_test['supabase_key'] = false;
        $config_test['supabase_key_value'] = 'Not found';
    }
    
    // Final assessment
    if (!$config_test['supabase_url'] || !$config_test['supabase_key']) {
        $config_test['status'] = 'fail';
        $config_test['message'] = 'Config file exists but is missing required Supabase configuration';
    }
} else {
    $config_test['status'] = 'fail';
    $config_test['message'] = 'Config file does not exist at: ' . $config_file;
}

$response['tests']['config_file'] = $config_test;

// Test Supabase connection
$supabase_test = [
    'name' => 'Supabase Connection',
    'status' => 'unknown',
    'message' => ''
];

if ($config_test['supabase_url'] && $config_test['supabase_key']) {
    // Extract the Supabase URL and key
    preg_match('/SUPABASE_URL\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $url_matches);
    preg_match('/SUPABASE_ANON_KEY\s*=\s*[\'"](.*?)[\'"]/i', $config_content, $key_matches);
    
    $supabase_url = $url_matches[1];
    $supabase_key = $key_matches[1];
    
    // Test connection to Supabase
    try {
        $ch = curl_init($supabase_url . '/rest/v1/?apikey=' . $supabase_key);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $supabase_key,
            'apikey: ' . $supabase_key
        ]);
        
        $result = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code >= 200 && $http_code < 300) {
            $supabase_test['status'] = 'pass';
            $supabase_test['message'] = 'Successfully connected to Supabase';
            $supabase_test['http_code'] = $http_code;
        } else {
            $supabase_test['status'] = 'fail';
            $supabase_test['message'] = 'Failed to connect to Supabase, HTTP code: ' . $http_code;
            $supabase_test['http_code'] = $http_code;
            $supabase_test['error'] = $result;
        }
    } catch (Exception $e) {
        $supabase_test['status'] = 'fail';
        $supabase_test['message'] = 'Exception occurred: ' . $e->getMessage();
    }
} else {
    $supabase_test['status'] = 'skip';
    $supabase_test['message'] = 'Skipped test because Supabase configuration is incomplete';
}

$response['tests']['supabase_connection'] = $supabase_test;

// Check .htaccess file
$htaccess_file = __DIR__ . '/.htaccess';
$htaccess_test = [
    'name' => '.htaccess File',
    'status' => 'unknown',
    'message' => ''
];

if (file_exists($htaccess_file)) {
    $htaccess_test['status'] = 'pass';
    $htaccess_test['message'] = '.htaccess file exists';
    
    // Additional htaccess verification could be added here
} else {
    $htaccess_test['status'] = 'fail';
    $htaccess_test['message'] = '.htaccess file does not exist at: ' . $htaccess_file;
}

$response['tests']['htaccess'] = $htaccess_test;

// Check landing page (index.html)
$index_file = __DIR__ . '/index.html';
$index_test = [
    'name' => 'Index HTML File',
    'status' => 'unknown',
    'message' => ''
];

if (file_exists($index_file)) {
    $index_test['status'] = 'pass';
    $index_test['message'] = 'Index file exists';
} else {
    $index_test['status'] = 'fail';
    $index_test['message'] = 'Index file does not exist at: ' . $index_file;
}

$response['tests']['index_file'] = $index_test;

// Overall assessment
$all_passed = true;
foreach ($response['tests'] as $test) {
    if ($test['status'] === 'fail') {
        $all_passed = false;
        break;
    }
}

$response['overall_status'] = $all_passed ? 'pass' : 'fail';
$response['overall_message'] = $all_passed 
    ? 'All tests passed. Your Automatic Pet Feeder application should work correctly on cPanel.' 
    : 'Some tests failed. Please review the test results and fix the issues.';

// Output response as JSON
echo json_encode($response, JSON_PRETTY_PRINT);