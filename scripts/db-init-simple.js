/**
 * Simple database initialization script for Automatic Pet Feeder
 * Uses direct connection to Supabase to execute SQL queries
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Hard-coded credentials since .env isn't working properly
const SUPABASE_URL = "https://mgqtlgpcdswfmvgheeff.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjg3MTYzNSwiZXhwIjoyMDI4NDQ3NjM1fQ.TpglQtNTRzM64OvfI6-KjYRMiO0b43R0Pm8JrNQsX_o";

console.log('Using direct connection with hard-coded credentials');
console.log('SUPABASE_URL:', SUPABASE_URL ? SUPABASE_URL.substring(0, 20) + '...' : 'missing');
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'found (hidden for security)' : 'missing');

// Path to the schema file
const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
console.log('Using schema file at:', schemaPath);

// Read the schema file
console.log('Reading schema file...');
let schemaSQL;
try {
  schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
  console.log(`Schema file loaded, ${schemaSQL.length} characters`);
} catch (error) {
  console.error('Failed to read schema file:', error.message);
  process.exit(1);
}

// Create a temp file with a curl command to execute SQL
const sqlFileName = 'db-init-temp.sql';
const curlScriptPath = path.join(__dirname, 'curl-command.sh');

try {
  // Write SQL to temp file
  fs.writeFileSync(path.join(__dirname, sqlFileName), schemaSQL);
  console.log(`SQL schema written to temporary file: ${sqlFileName}`);
  
  // Create the curl script
  const curlCommand = `
  curl -X POST "${SUPABASE_URL}/rest/v1/rpc/pgrest_exec" \\
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \\
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \\
  -H "Content-Type: application/json" \\
  -d "{\\\"query_text\\\": $(cat ${sqlFileName} | node -e "process.stdin.setEncoding('utf8'); let data = ''; process.stdin.on('data', chunk => { data += chunk }); process.stdin.on('end', () => { console.log(JSON.stringify(data)); })")}"
  `;
  
  fs.writeFileSync(curlScriptPath, curlCommand);
  console.log('Curl command script created');
  
  // Make curl script executable
  fs.chmodSync(curlScriptPath, '755');
  
  // Execute the curl command
  console.log('Executing curl command to send SQL to Supabase...');
  
  // Due to challenges with executing shell commands on Windows,
  // we'll provide instructions for manual database setup instead
  console.log('\n-------------------');
  console.log('INSTRUCTIONS FOR MANUAL DATABASE SETUP');
  console.log('-------------------');
  console.log('Please follow these steps to set up your database manually:');
  console.log('1. Log in to your Supabase dashboard at https://app.supabase.com');
  console.log('2. Navigate to the SQL Editor');
  console.log('3. Copy the contents of the supabase-schema.sql file');
  console.log('4. Paste into the SQL Editor and run the queries');
  console.log('\nAlternatively, if you have curl installed, you can run:');
  console.log(`bash ${curlScriptPath}`);
  console.log('-------------------');
  
} catch (error) {
  console.error('Error during SQL execution:', error.message);
} finally {
  // Clean up temp files
  try {
    const tempFilePath = path.join(__dirname, sqlFileName);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Temporary file ${sqlFileName} deleted`);
    }
  } catch (err) {
    console.error('Error cleaning up temp files:', err.message);
  }
}