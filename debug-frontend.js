// Debug script to check frontend environment variables
console.log('=== FRONTEND DEBUG ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('API_CONFIG.BACKEND_URL:', API_CONFIG.BACKEND_URL);
console.log('API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);

// Test a simple fetch
fetch('http://localhost:8001/api/v1/health')
  .then(response => response.json())
  .then(data => console.log('Health check:', data))
  .catch(error => console.error('Health check error:', error));