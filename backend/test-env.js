require('dotenv').config();
const path = require('path');
const fs = require('fs');

console.log('Current working directory:', process.cwd());
console.log('Expected .env location:', path.resolve(__dirname, '.env'));

// Try to read the .env file directly
try {
  const envPath = path.resolve(__dirname, '.env');
  const exists = fs.existsSync(envPath);
  console.log('\n.env file exists:', exists);
  
  if (exists) {
    const stats = fs.statSync(envPath);
    console.log('.env file size:', stats.size, 'bytes');
    console.log('.env last modified:', stats.mtime);
    
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('\nNumber of lines in .env:', content.split('\n').length);
    console.log('First character code:', content.charCodeAt(0));
    
    // Check for BOM and encoding issues
    const firstFewBytes = Buffer.from(content).slice(0, 4);
    console.log('First few bytes:', Array.from(firstFewBytes).map(b => b.toString(16)));
    
    // Show structure without revealing values
    console.log('\nEnvironment variable structure:');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key] = line.split('=');
        if (key) {
          console.log(`Line ${i + 1}: ${key.trim()}=[value]`);
        }
      }
    });
  }
  
  console.log('\nLoaded environment variables:');
  console.log('SEPOLIA_RPC_URL exists:', !!process.env.SEPOLIA_RPC_URL);
  console.log('ADMIN_PRIVATE_KEY exists:', !!process.env.ADMIN_PRIVATE_KEY);
  
} catch (error) {
  console.error('Error reading .env file:', error.message);
} 