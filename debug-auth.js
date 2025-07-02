// Debug script to check authentication state
console.log('=== Authentication Debug ===');

// Check localStorage for tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');
const user = localStorage.getItem('user');

console.log('Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NOT FOUND');
console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NOT FOUND');
console.log('User:', user || 'NOT FOUND');

// Check cookies as well
console.log('Document cookies:', document.cookie);

// Try to make an authenticated API call
if (accessToken) {
    fetch('/api/v1/academic-config/time-blocks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            start_time: '14:00',
            end_time: '16:00',
            name: 'Debug Test Block'
        })
    })
    .then(response => {
        console.log('API Response Status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API Response:', data);
    })
    .catch(error => {
        console.error('API Error:', error);
    });
} else {
    console.log('No access token found - authentication required');
}