<?php
/**
 * Cloudflare Turnstile API Validation Endpoint
 * 
 * This file provides a backup validation endpoint for Cloudflare Turnstile tokens
 * when the client-side validation fails due to domain or configuration issues.
 */

// Load environment variables
require_once '../.env.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Check if token is provided
if (!isset($data['token'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token is required']);
    exit;
}

$token = $data['token'];

// Special case for fallback token
if ($token === 'fallback_token') {
    // In fallback mode, we accept the request but log it
    error_log('Turnstile fallback mode used');
    echo json_encode(['success' => true, 'fallback' => true]);
    exit;
}

// Validate token with Cloudflare Turnstile API
$secret = getenv('TURNSTILE_SECRET_KEY');
if (!$secret) {
    $secret = '0x4AAAAAABE4vVpdRG4xovT1RwG9k8ZWPhM'; // Fallback to hardcoded key if environment variable is missing
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'secret' => $secret,
    'response' => $token,
    'remoteip' => $_SERVER['REMOTE_ADDR'] ?? null
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($status !== 200) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to validate token']);
    exit;
}

$result = json_decode($response, true);

// Return the validation result
echo json_encode([
    'success' => $result['success'] ?? false,
    'hostname' => $result['hostname'] ?? null,
    'challenge_ts' => $result['challenge_ts'] ?? null,
    'error-codes' => $result['error-codes'] ?? null
]);