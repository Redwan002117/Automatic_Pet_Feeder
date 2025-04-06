/**
 * Authentication module for the Automatic Pet Feeder
 * Handles login, signup, password reset, and session management
 */

// Authentication state
let currentUser = null;
let authListeners = [];
let supabaseClient = null;

/**
 * Initialize the authentication module
 */
async function initAuth() {
    try {
        // Get the Supabase client from the global variable
        if (window.supabase) {
            supabaseClient = window.supabase;
        } else if (window.supabaseJs && window.appConfig) {
            // Create Supabase client if not already available
            const { createClient } = window.supabaseJs;
            
            // Make sure we're using the correct URL from config
            const supabaseUrl = window.appConfig.SUPABASE_URL;
            const supabaseKey = window.appConfig.SUPABASE_ANON_KEY;
            
            if (!supabaseUrl || !supabaseKey) {
                console.error('Supabase URL or key is missing in appConfig');
                return;
            }
            
            console.log('Initializing Supabase client with URL:', supabaseUrl);
            
            supabaseClient = createClient(supabaseUrl, supabaseKey);
            
            // Store for later use
            window.supabase = supabaseClient;
        } else {
            console.error('Supabase client not available. Make sure to load the Supabase library and config.js before auth.js');
            return;
        }
        
        // Check if user is already logged in
        await refreshAuthState();
        
        // Set up auth change listener
        if (supabaseClient && supabaseClient.auth) {
            supabaseClient.auth.onAuthStateChange(handleAuthChange);
            
            // Set up UI based on auth state
            updateAuthUI();
            
            // Set up event listeners for auth forms
            setupAuthFormListeners();
            
            // Set up event listeners for social login buttons
            setupSocialLoginButtons();
            
            // Set up direct event listeners for logout buttons - this ensures they always work
            setupLogoutButtonListeners();
            
            console.log('Auth module initialized with support for Google, Facebook, GitHub, and Apple login');
        } else {
            console.error('Supabase auth not initialized properly');
        }
    } catch (error) {
        console.error('Failed to initialize auth module:', error);
    }
}

/**
 * Refresh the authentication state
 */
async function refreshAuthState() {
    try {
        if (!supabaseClient || !supabaseClient.auth) {
            throw new Error('Supabase auth not initialized');
        }
        
        const { data, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        if (data && data.session) {
            currentUser = data.session.user;
            
            // Fetch additional user data if needed
            if (currentUser) {
                try {
                    const { data: userData, error: userError } = await supabaseClient
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .single();
                        
                    if (!userError && userData) {
                        currentUser = { ...currentUser, ...userData };
                    }
                } catch (profileError) {
                    console.warn('Could not fetch profile data:', profileError);
                    // Continue without profile data
                }
            }
        } else {
            currentUser = null;
        }
        
        // Notify listeners about auth state change
        notifyAuthListeners();
        
        return currentUser;
    } catch (error) {
        console.error('Failed to refresh auth state:', error);
        currentUser = null;
        notifyAuthListeners();
        return null;
    }
}

/**
 * Check authentication state and redirect if needed
 * @returns {Promise<Object|null>} The current user or null if not authenticated
 */
async function checkAuthState() {
    try {
        // First check if we have a valid session
        const { data: sessionData, error: sessionError } = await window.supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Error checking session:', sessionError);
            return null;
        }
        
        if (!sessionData.session) {
            // No active session and on a protected page, redirect to login
            if (isProtectedPage()) {
                const currentPath = window.location.pathname;
                window.location.href = `/login.html?redirect=${encodeURIComponent(currentPath)}`;
            }
            return null;
        }
        
        // We have an active session
        const user = sessionData.session.user;
        console.log('User authenticated:', user.email);
        
        // Update UI with user info if UI elements exist
        updateUIWithUserInfo(user);
        
        return user;
    } catch (error) {
        console.error('Authentication check failed:', error);
        return null;
    }
}

/**
 * Handle auth state change events
 */
function handleAuthChange(event, session) {
    if (event === 'SIGNED_IN') {
        currentUser = session.user;
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
    }
    
    // Update UI based on new auth state
    updateAuthUI();
    
    // Notify listeners about auth state change
    notifyAuthListeners();
}

/**
 * Update UI elements based on authentication state
 */
function updateAuthUI() {
    const authButtons = document.querySelectorAll('.auth-buttons');
    const profileElements = document.querySelectorAll('.user-profile');
    const loginButtons = document.querySelectorAll('.login-button, .signup-button');
    const logoutButtons = document.querySelectorAll('#logout-button, #dropdown-logout');
    const privatePages = document.querySelectorAll('.private-page');
    const publicPages = document.querySelectorAll('.public-page');
    
    if (currentUser) {
        // User is logged in
        authButtons.forEach(el => el.classList.add('logged-in'));
        profileElements.forEach(el => el.classList.add('logged-in'));
        loginButtons.forEach(el => el.style.display = 'none');
        logoutButtons.forEach(el => el.style.display = 'block');
        privatePages.forEach(el => el.classList.remove('hidden'));
        publicPages.forEach(el => el.classList.add('hidden'));
        
        // Update user info in UI
        const profileNames = document.querySelectorAll('#profile-name, .profile-name');
        const profileImages = document.querySelectorAll('#profile-image, .profile-image');
        
        profileNames.forEach(el => {
            if (el) el.textContent = currentUser.first_name || currentUser.email.split('@')[0];
        });
        
        profileImages.forEach(el => {
            if (el) {
                if (currentUser.avatar_url) {
                    el.src = currentUser.avatar_url;
                } else {
                    el.src = '/assets/images/profile-placeholder.jpg';
                }
                el.alt = `${currentUser.first_name || 'User'}'s profile picture`;
            }
        });
    } else {
        // User is logged out
        authButtons.forEach(el => el.classList.remove('logged-in'));
        profileElements.forEach(el => el.classList.remove('logged-in'));
        loginButtons.forEach(el => el.style.display = 'block');
        logoutButtons.forEach(el => el.style.display = 'none');
        privatePages.forEach(el => el.classList.add('hidden'));
        publicPages.forEach(el => el.classList.remove('hidden'));
    }
    
    // Check if we're on a protected page
    if (isProtectedPage() && !currentUser) {
        // Redirect to login page
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
}

/**
 * Set up event listeners for authentication forms
 */
function setupAuthFormListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Password reset form
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
    }
    
    // Reset confirm form
    const resetConfirmForm = document.getElementById('reset-confirm-form');
    if (resetConfirmForm) {
        resetConfirmForm.addEventListener('submit', handleResetConfirm);
    }
    
    // Logout buttons
    const logoutButtons = document.querySelectorAll('#logout-button, #dropdown-logout');
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', handleLogout);
        }
    });
    
    // Password toggle buttons
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        if (toggle) {
            toggle.addEventListener('click', togglePasswordVisibility);
        }
    });
    
    // Password inputs for strength check
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        if (input.id.includes('password') && !input.id.includes('confirm')) {
            input.addEventListener('input', checkPasswordStrength);
        }
    });
    
    // Google login button
    const googleLoginButtons = document.querySelectorAll('.google-login');
    googleLoginButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', handleGoogleLogin);
        }
    });
    
    // Facebook login button
    const facebookLoginButtons = document.querySelectorAll('.facebook-login');
    facebookLoginButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', handleFacebookLogin);
        }
    });
    
    // GitHub login button
    const githubLoginButtons = document.querySelectorAll('.github-login');
    githubLoginButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', handleGitHubLogin);
        }
    });
    
    // Apple login button
    const appleLoginButtons = document.querySelectorAll('.apple-login');
    appleLoginButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', handleAppleLogin);
        }
    });
}

/**
 * Set up event listeners for social login buttons
 */
function setupSocialLoginButtons() {
    // Find all social login buttons by their data-provider attribute
    const socialButtons = document.querySelectorAll('.social-login-button');
    
    socialButtons.forEach(button => {
        const provider = button.getAttribute('data-provider');
        if (provider) {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                
                // Get the current page as the redirect URL (or dashboard if not specified)
                const urlParams = new URLSearchParams(window.location.search);
                const redirectPath = urlParams.get('redirect') || '/dashboard.html';
                const redirectTo = `${window.location.origin}${redirectPath}`;
                
                console.log(`Logging in with ${provider}, will redirect to: ${redirectTo}`);
                
                // Show loading indicator
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'loading-overlay';
                loadingOverlay.innerHTML = `
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <p>Connecting to ${provider}...</p>
                `;
                document.body.appendChild(loadingOverlay);
                
                // Attempt to sign in with OAuth
                supabaseClient.auth.signInWithOAuth({
                    provider: provider.toLowerCase(),
                    options: {
                        redirectTo: redirectTo
                    }
                }).catch(error => {
                    console.error(`${provider} login error:`, error);
                    
                    // Remove loading overlay
                    loadingOverlay.remove();
                    
                    // Show error message
                    const errorElement = document.querySelector('.auth-error');
                    if (errorElement) {
                        errorElement.textContent = `Failed to sign in with ${provider}. ${error.message || 'Please try again.'}`;
                        errorElement.style.display = 'block';
                    } else {
                        alert(`Failed to sign in with ${provider}. ${error.message || 'Please try again.'}`);
                    }
                });
            });
        }
    });
}

/**
 * Set up event listeners for logout buttons
 */
function setupLogoutButtonListeners() {
    document.querySelectorAll('#logout-button, .logout-button').forEach(button => {
        if (button) {
            console.log('Adding logout listener to button:', button);
            // Remove any existing listeners to avoid duplicates
            button.removeEventListener('click', handleLogout);
            // Add fresh event listener
            button.addEventListener('click', handleLogout);
        }
    });
    
    // Also attach to any dynamically added logout buttons that might appear later
    document.addEventListener('click', function(event) {
        if (event.target && 
            (event.target.id === 'logout-button' || 
             event.target.classList.contains('logout-button') ||
             (event.target.parentElement && 
              (event.target.parentElement.id === 'logout-button' || 
               event.target.parentElement.classList.contains('logout-button'))))) {
            event.preventDefault();
            handleLogout(event);
        }
    });
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const rememberMeInput = document.getElementById('remember-me');
    const errorElement = document.querySelector('.auth-error');
    const submitButton = document.querySelector('button[type="submit"]');
    
    // Validate inputs
    if (!emailInput.value || !passwordInput.value) {
        setAuthError(errorElement, 'Please enter both email and password');
        return;
    }
    
    // Disable submit button and show loading state
    setLoading(submitButton, true);
    
    try {
        // Attempt to sign in
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: emailInput.value,
            password: passwordInput.value,
        });
        
        if (error) {
            throw error;
        }
        
        // Success - clear error and redirect
        clearAuthError(errorElement);
        
        // Get redirect URL from query params
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || '/dashboard.html';
        
        // Redirect to dashboard or original destination
        window.location.href = redirectUrl;
    } catch (error) {
        console.error('Login error:', error);
        setAuthError(errorElement, error.message || 'Failed to log in. Please check your credentials and try again.');
    } finally {
        // Re-enable submit button
        setLoading(submitButton, false);
    }
}

/**
 * Handle signup form submission
 */
async function handleSignup(event) {
    event.preventDefault();
    
    // Get form elements safely with error checking
    const form = event.target;
    const emailInput = form.querySelector('#signup-email');
    const passwordInput = form.querySelector('#signup-password');
    const confirmPasswordInput = form.querySelector('#signup-password-confirm');
    const firstNameInput = form.querySelector('#signup-first-name');
    const lastNameInput = form.querySelector('#signup-last-name');
    const termsInput = form.querySelector('#terms-checkbox');
    const errorElement = form.querySelector('.auth-error') || document.querySelector('.auth-error');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Validate all inputs exist
    if (!emailInput || !passwordInput || !confirmPasswordInput) {
        setAuthError(errorElement, 'Form is missing required fields');
        return;
    }
    
    // Validate inputs
    if (!emailInput.value || !passwordInput.value || !confirmPasswordInput.value) {
        setAuthError(errorElement, 'Please fill out all required fields');
        return;
    }
    
    if (passwordInput.value !== confirmPasswordInput.value) {
        setAuthError(errorElement, 'Passwords do not match');
        return;
    }
    
    if (!isPasswordStrong(passwordInput.value)) {
        setAuthError(errorElement, 'Password is not strong enough');
        return;
    }
    
    if (termsInput && !termsInput.checked) {
        setAuthError(errorElement, 'You must agree to the terms of service');
        return;
    }
    
    // Disable submit button and show loading state
    setLoading(submitButton, true);
    
    try {
        // Attempt to sign up
        const { data, error } = await supabaseClient.auth.signUp({
            email: emailInput.value,
            password: passwordInput.value,
            options: {
                data: {
                    first_name: firstNameInput ? firstNameInput.value : '',
                    last_name: lastNameInput ? lastNameInput.value : ''
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        // Success - clear error and show success message
        clearAuthError(errorElement);
        
        // Show success message or redirect
        if (data.user && !data.user.confirmed_at) {
            // Email confirmation required
            const successElement = form.querySelector('.auth-success') || document.querySelector('.auth-success');
            if (successElement) {
                successElement.textContent = 'Registration successful! Please check your email to verify your account.';
                successElement.style.display = 'block';
            }
            
            // Hide the form
            form.style.display = 'none';
        } else {
            // No email confirmation required - redirect to dashboard
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.error('Signup error:', error);
        setAuthError(errorElement, error.message || 'Failed to create account. Please try again.');
    } finally {
        // Re-enable submit button
        setLoading(submitButton, false);
    }
}

/**
 * Handle password reset request
 */
async function handlePasswordReset(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('reset-email');
    const errorElement = document.querySelector('.auth-error');
    const successElement = document.querySelector('.auth-success');
    const submitButton = document.querySelector('button[type="submit"]');
    
    // Validate input
    if (!emailInput.value) {
        setAuthError(errorElement, 'Please enter your email address');
        return;
    }
    
    // Disable submit button and show loading state
    setLoading(submitButton, true);
    
    try {
        // Request password reset
        const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput.value, {
            redirectTo: window.location.origin + '/reset-confirm.html',
        });
        
        if (error) {
            throw error;
        }
        
        // Success - clear error and show success message
        clearAuthError(errorElement);
        
        // Show success message
        if (successElement) {
            successElement.textContent = 'Password reset instructions have been sent to your email.';
            successElement.style.display = 'block';
        }
        
        // Hide the form
        const form = document.getElementById('reset-password-form');
        if (form) {
            form.style.display = 'none';
        }
    } catch (error) {
        console.error('Password reset error:', error);
        setAuthError(errorElement, error.message || 'Failed to request password reset. Please try again.');
    } finally {
        // Re-enable submit button
        setLoading(submitButton, false);
    }
}

/**
 * Handle reset password confirmation
 */
async function handleResetConfirm(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const errorElement = document.querySelector('.auth-error');
    const successElement = document.querySelector('.auth-success');
    const submitButton = document.querySelector('button[type="submit"]');
    
    // Validate inputs
    if (!passwordInput.value || !confirmPasswordInput.value) {
        setAuthError(errorElement, 'Please enter and confirm your new password');
        return;
    }
    
    if (passwordInput.value !== confirmPasswordInput.value) {
        setAuthError(errorElement, 'Passwords do not match');
        return;
    }
    
    if (!isPasswordStrong(passwordInput.value)) {
        setAuthError(errorElement, 'Password is not strong enough');
        return;
    }
    
    // Disable submit button and show loading state
    setLoading(submitButton, true);
    
    try {
        // Update password
        const { error } = await supabaseClient.auth.updateUser({
            password: passwordInput.value
        });
        
        if (error) {
            throw error;
        }
        
        // Success - clear error and show success message
        clearAuthError(errorElement);
        
        // Show success message
        if (successElement) {
            successElement.textContent = 'Your password has been updated successfully. You can now log in with your new password.';
            successElement.style.display = 'block';
        }
        
        // Hide the form
        const form = document.getElementById('reset-confirm-form');
        if (form) {
            form.style.display = 'none';
        }
        
        // Add login link
        const loginLinkContainer = document.createElement('div');
        loginLinkContainer.className = 'text-center mt-4';
        loginLinkContainer.innerHTML = '<a href="/login.html" class="ios-link">Go to Login</a>';
        
        const container = form.parentElement;
        if (container) {
            container.appendChild(loginLinkContainer);
        }
    } catch (error) {
        console.error('Password update error:', error);
        setAuthError(errorElement, error.message || 'Failed to update password. Please try again.');
    } finally {
        // Re-enable submit button
        setLoading(submitButton, false);
    }
}

/**
 * Handle logout
 */
async function handleLogout(event) {
    event.preventDefault();
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        // Clear local auth state
        currentUser = null;
        
        // Notify listeners about auth state change
        notifyAuthListeners();
        
        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Failed to log out. Please try again.', 'error');
    }
}

/**
 * Handle Google login
 */
async function handleGoogleLogin(event) {
    event.preventDefault();
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        
        if (error) {
            throw error;
        }
        
        // No immediate redirect needed as Supabase will handle it
        
    } catch (error) {
        console.error('Google login error:', error);
        showToast('Failed to sign in with Google. Please try again.', 'error');
    }
}

/**
 * Handle Facebook login
 */
async function handleFacebookLogin(event) {
    event.preventDefault();
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        
        if (error) {
            throw error;
        }
        
        // No immediate redirect needed as Supabase will handle it
        
    } catch (error) {
        console.error('Facebook login error:', error);
        showToast('Failed to sign in with Facebook. Please try again.', 'error');
    }
}

/**
 * Handle GitHub login
 */
async function handleGitHubLogin(event) {
    event.preventDefault();
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        
        if (error) {
            throw error;
        }
        
        // No immediate redirect needed as Supabase will handle it
    } catch (error) {
        console.error('GitHub login error:', error);
        showToast('Failed to sign in with GitHub. Please try again.', 'error');
    }
}

/**
 * Handle Apple login
 */
async function handleAppleLogin(event) {
    event.preventDefault();
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/dashboard.html`
            }
        });
        
        if (error) {
            throw error;
        }
        
        // No immediate redirect needed as Supabase will handle it
    } catch (error) {
        console.error('Apple login error:', error);
        showToast('Failed to sign in with Apple. Please try again.', 'error');
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(event) {
    const button = event.currentTarget;
    const field = button.closest('.password-field');
    const passwordInput = field.querySelector('input');
    const icon = button.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

/**
 * Check password strength
 */
function checkPasswordStrength(event) {
    const password = event.target.value;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) {
        return;
    }
    
    let strength = 0;
    let level = '';
    
    // Update password requirements if they exist
    updatePasswordRequirements(password);
    
    // Length
    if (password.length >= 8) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    // Determine level
    if (strength <= 2) {
        level = 'weak';
    } else if (strength == 3) {
        level = 'fair';
    } else if (strength == 4) {
        level = 'good';
    } else {
        level = 'strong';
    }
    
    // Update UI
    strengthBar.className = 'strength-bar ' + level;
    strengthText.textContent = level.charAt(0).toUpperCase() + level.slice(1);
    strengthText.className = 'strength-text ' + level;
    
    return level;
}

/**
 * Update password requirements visualization
 */
function updatePasswordRequirements(password) {
    const requirements = document.querySelectorAll('.password-requirements li');
    
    if (!requirements.length) {
        return;
    }
    
    // Check each requirement
    requirements.forEach(req => {
        const icon = req.querySelector('i');
        let isMet = false;
        
        if (req.classList.contains('req-length')) {
            isMet = password.length >= 8;
        } else if (req.classList.contains('req-lowercase')) {
            isMet = /[a-z]/.test(password);
        } else if (req.classList.contains('req-uppercase')) {
            isMet = /[A-Z]/.test(password);
        } else if (req.classList.contains('req-number')) {
            isMet = /[0-9]/.test(password);
        } else if (req.classList.contains('req-special')) {
            isMet = /[^A-Za-z0-9]/.test(password);
        }
        
        if (isMet) {
            req.classList.add('met');
            if (icon) icon.className = 'fas fa-check-circle';
        } else {
            req.classList.remove('met');
            if (icon) icon.className = 'far fa-circle';
        }
    });
}

/**
 * Check if a password is strong enough
 */
function isPasswordStrong(password) {
    // At least 8 characters, with at least 3 of the following:
    // - Lowercase letter
    // - Uppercase letter
    // - Number
    // - Special character
    
    let strength = 0;
    
    // Length check
    if (password.length < 8) return false;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength >= 3;
}

/**
 * Check if current page is a protected page
 */
function isProtectedPage() {
    const protectedPaths = [
        '/dashboard.html',
        '/devices.html',
        '/pets.html',
        '/schedules.html',
        '/history.html',
        '/analytics.html',
        '/settings.html',
        '/profile.html'
    ];
    
    const currentPath = window.location.pathname;
    return protectedPaths.some(path => currentPath.endsWith(path));
}

/**
 * Set authentication error message
 */
function setAuthError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

/**
 * Clear authentication error message
 */
function clearAuthError(element) {
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

/**
 * Set loading state on a button
 */
function setLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
    }
}

/**
 * Add an auth state change listener
 */
function addAuthListener(callback) {
    if (typeof callback === 'function') {
        authListeners.push(callback);
        
        // Immediately call with current auth state
        callback(currentUser);
    }
}

/**
 * Remove an auth state change listener
 */
function removeAuthListener(callback) {
    const index = authListeners.indexOf(callback);
    if (index !== -1) {
        authListeners.splice(index, 1);
    }
}

/**
 * Notify all listeners about auth state change
 */
function notifyAuthListeners() {
    authListeners.forEach(listener => {
        try {
            listener(currentUser);
        } catch (error) {
            console.error('Error in auth listener:', error);
        }
    });
}

/**
 * Get the current user
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Initialize auth on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure Supabase client is initialized
    setTimeout(initAuth, 200);
});

// Export auth functions
window.auth = {
    getCurrentUser,
    addAuthListener,
    removeAuthListener,
    refreshAuthState,
    logout: handleLogout
};