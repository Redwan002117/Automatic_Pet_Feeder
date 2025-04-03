// Register Page Specific Script

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
    
    // Add username availability check
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('blur', checkUsernameAvailability);
    }
});

// Check if username is available
async function checkUsernameAvailability() {
    const usernameInput = document.getElementById('username');
    const usernameError = document.getElementById('username-error');
    
    if (!usernameInput || !usernameError) return;
    
    const username = usernameInput.value.trim();
    
    // Skip check if username is empty or too short
    if (!username || username.length < 3) return;
    
    try {
        // In a real app, this would make an API call to check availability
        // For now, we'll simulate the check with some predefined usernames
        const takenUsernames = ['admin', 'user', 'test', 'petfeeder', 'gamer'];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const isTaken = takenUsernames.includes(username.toLowerCase());
        
        if (isTaken) {
            usernameInput.parentElement.classList.add('error');
            usernameError.textContent = 'This username is already taken';
            usernameError.style.display = 'block';
        } else {
            usernameInput.parentElement.classList.remove('error');
            usernameError.textContent = '';
            usernameError.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking username:', error);
    }
} 