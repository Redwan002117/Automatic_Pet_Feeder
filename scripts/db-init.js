/**
 * Database initialization script for Automatic Pet Feeder
 * This script initializes the Supabase database tables using SQL schema
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

bash C:\Users\redwa\OneDrive\Desktop\Automatic Pet Feeder\scripts\curl-command.sh// Load environment variables - explicitly set the path to the .env file
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

console.log('Loading environment variables from:', envPath);

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL ? 'found' : 'missing');
console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? 'found' : 'missing');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
  console.log('Please make sure these are set in your .env file');
  process.exit(1);
}

// Initialize Supabase client with service key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Path to the schema file
const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
console.log('Using schema file at:', schemaPath);

// Function to split SQL queries from a file
function splitQueries(sql) {
  // Split on semicolons but ignore those inside comments and quotes
  const queries = [];
  let currentQuery = '';
  let inComment = false;
  let inQuote = false;
  let quoteChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1] || '';
    
    // Handle comments
    if (!inQuote && char === '-' && nextChar === '-') {
      inComment = true;
      currentQuery += char;
      continue;
    }
    
    if (inComment && char === '\n') {
      inComment = false;
      currentQuery += char;
      continue;
    }
    
    // Handle quotes
    if (!inComment && (char === "'" || char === '"') && !inQuote) {
      inQuote = true;
      quoteChar = char;
      currentQuery += char;
      continue;
    }
    
    if (inQuote && char === quoteChar && sql[i - 1] !== '\\') {
      inQuote = false;
      currentQuery += char;
      continue;
    }
    
    // Handle semicolons (query separators)
    if (!inComment && !inQuote && char === ';') {
      currentQuery += char;
      if (currentQuery.trim()) {
        queries.push(currentQuery.trim());
      }
      currentQuery = '';
      continue;
    }
    
    currentQuery += char;
  }
  
  // Add the last query if it exists
  if (currentQuery.trim()) {
    queries.push(currentQuery.trim());
  }
  
  return queries;
}

// Initialize database tables
async function initDatabase() {
  try {
    console.log('Connecting to Supabase...');
    
    // Check connection by attempting a simple query
    try {
      const { data, error } = await supabase.from('_dummy_query_for_test').select('*').limit(1);
      if (error && error.code !== '42P01') { // Ignore "relation does not exist" error
        throw error;
      }
      console.log('Connected to Supabase successfully');
    } catch (err) {
      // If the error is not about missing table, it might be a connection issue
      if (err.code !== '42P01') {
        console.log('Warning: Connection test resulted in:', err.message);
        console.log('This may be expected if tables don\'t exist yet. Proceeding...');
      }
    }
    
    // Read the schema file
    console.log('Reading schema file...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split the schema into individual queries
    const queries = splitQueries(schemaSQL);
    
    console.log(`Found ${queries.length} SQL queries in schema file`);
    
    // Execute each query
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        // Skip empty queries
        if (!query.trim()) continue;
        
        // Execute the query using the SQL endpoint
        console.log(`Executing query ${i + 1}/${queries.length}...`);
        
        // Use the SQL query directly - this requires the service role
        const { data, error } = await supabase.rpc('pgrest_exec', { query_text: query }).catch(err => {
          return { data: null, error: err };
        });
        
        if (error) {
          // If it's a duplicate table error, consider it a success
          if (error.message && error.message.includes('already exists')) {
            console.log(`Query ${i + 1}: Table already exists. Skipping.`);
            successCount++;
          } else {
            console.error(`Error executing query ${i + 1}:`, error.message);
            
            // Print the beginning of the query for context
            const shortQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
            console.log('Query:', shortQuery);
            
            errorCount++;
          }
        } else {
          console.log(`Query ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (queryError) {
        console.error(`Error executing query ${i + 1}:`, queryError.message);
        
        // Print the beginning of the query for context
        const shortQuery = query.length > 100 ? query.substring(0, 100) + '...' : query;
        console.log('Query:', shortQuery);
        
        errorCount++;
      }
    }
    
    console.log('\n--- Database initialization completed! ---');
    console.log(`${successCount} queries executed successfully, ${errorCount} queries failed`);
    
    if (errorCount > 0) {
      console.log('\nSome queries failed. This might be because:');
      console.log('- Tables already exist (duplicate relation errors)');
      console.log('- The RPC function pgrest_exec is not available on your Supabase instance');
      console.log('- There are syntax errors in the SQL schema');
      console.log('\nTo manually initialize your database, go to the Supabase dashboard:');
      console.log('1. Open the SQL Editor');
      console.log('2. Copy the contents of supabase-schema.sql');
      console.log('3. Paste and execute the SQL in the editor');
    } else {
      console.log('\nAll queries executed successfully. Database is ready to use!');
    }
  } catch (error) {
    console.error('Error initializing database:', error.message);
    console.log('Please check your connection to Supabase and try again.');
    process.exit(1);
  }
}

// Run the database initialization
initDatabase().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});