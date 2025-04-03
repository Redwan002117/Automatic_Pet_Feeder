// Login Page Specific Script

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is already authenticated
    try {
        const authenticated = await isAuthenticated();
        
        if (authenticated) {
            // If user is already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
            return;
        }
        
    } catch (error) {
        console.error('Authentication check failed:', error);
    }
    
    // Check for redirect parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirectPath = urlParams.get('redirect');
    
    // Store redirect path in localStorage to use after login
    if (redirectPath) {
        localStorage.setItem('auth_redirect', redirectPath);
    }
    
    // Add specific behavior for login page
    // Most functionality is in auth.js
});

// When user successfully logs in, redirect them to the stored path or dashboard
async function handleSuccessfulLogin() {
    const redirectPath = localStorage.getItem('auth_redirect');
    
    // Clear the stored redirect
    localStorage.removeItem('auth_redirect');
    
    // Redirect user
    if (redirectPath) {
        window.location.href = redirectPath;
    } else {
        window.location.href = 'dashboard.html';
    }
} 