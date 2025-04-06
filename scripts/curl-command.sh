
  curl -X POST "https://mgqtlgpcdswfmvgheeff.supabase.co/rest/v1/rpc/pgrest_exec" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjg3MTYzNSwiZXhwIjoyMDI4NDQ3NjM1fQ.TpglQtNTRzM64OvfI6-KjYRMiO0b43R0Pm8JrNQsX_o" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMjg3MTYzNSwiZXhwIjoyMDI4NDQ3NjM1fQ.TpglQtNTRzM64OvfI6-KjYRMiO0b43R0Pm8JrNQsX_o" \
  -H "Content-Type: application/json" \
  -d "{\"query_text\": $(cat db-init-temp.sql | node -e "process.stdin.setEncoding('utf8'); let data = ''; process.stdin.on('data', chunk => { data += chunk }); process.stdin.on('end', () => { console.log(JSON.stringify(data)); })")}"
  