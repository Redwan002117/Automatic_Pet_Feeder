/**
 * Authentication functionality for Automatic Pet Feeder
 * Handles login, signup, password reset, and social logins
 */

// Initialize Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const supabaseKey = 'YOUR_SUPABASE_KEY'; // Replace with your Supabase key
let supabase;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Auth script loaded, initializing...');
    
    // Initialize Supabase client if it's loaded
    if (window.supabase) {
        supabase = await initSupabase();
    } else {
        console.error('Supabase JS library not found!');
    }

    // Check if we're on a protected page and redirect if not authenticated
    const isProtectedPage = !['index.html', 'login.html', 'signup.html', 'reset-password.html'].some(page => 
        window.location.pathname.endsWith(page)
    );

    if (isProtectedPage) {
        const user = await checkAuth();
        if (!user) {
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
    }

    // Check for magic link success first
    if (checkMagicLinkSuccess()) {
        // If magic link login was successful, we'll be redirected, so don't continue
        return;
    }
    
    // Check for OAuth redirect success (from social logins)
    if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
        await handleOAuthRedirect();
        return;
    }

    // Add event listeners for forms
    setupAuthForms();
    
    // Handle authentication UI state
    updateAuthUI();
    
    // Toggle between auth forms (login/magic link)
    setupAuthTabs();
    
    // Setup password visibility toggle
    setupPasswordToggle();
    
    // Setup password strength meter if we're on signup page
    if (document.getElementById('password')) {
        setupPasswordStrengthMeter();
    }
});

/**
 * Initialize Supabase client
 */
async function initSupabase() {
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client initialized');
        return supabase;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        if (typeof showToast === 'function') {
            showToast('Could not initialize application. Please try again later.', 'error');
        } else {
            showError(document.querySelector('.auth-error'), 'Could not initialize application. Please try again later.');
        }
        return null;
    }
}

/**
 * Check if user is authenticated
 */
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        return session;
    } catch (error) {
        console.error('Error checking authentication:', error);
        return null;
    }
}

/**
 * Set up event listeners for auth forms
 */
function setupAuthForms() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Magic link form
    const magicLinkForm = document.getElementById('magic-link-form');
    if (magicLinkForm) {
        magicLinkForm.addEventListener('submit', handleMagicLinkSubmit);
    }
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignupSubmit);
    }
    
    // Reset password form
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPasswordSubmit);
    }
    
    // Password reset confirmation form
    const resetConfirmForm = document.getElementById('reset-confirm-form');
    if (resetConfirmForm) {
        resetConfirmForm.addEventListener('submit', handleResetConfirmSubmit);
    }
    
    // Social login buttons - handle with direct click listeners
    setupSocialLoginButtons();
    
    // Logout button
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    const dropdownLogoutBtn = document.getElementById('dropdown-logout');
    if (dropdownLogoutBtn) {
        dropdownLogoutBtn.addEventListener('click', handleLogout);
    }
}

/**
 * Handle login form submission
 */
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    const loginError = document.getElementById('login-error');
    
    // Basic validation
    if (!email || !password) {
        if (typeof showToast === 'function') {
            showToast('Please enter both email and password.', 'error');
        } else {
            showError(loginError, 'Please enter both email and password.');
        }
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    showLoading(submitBtn, true);
    
    if (!supabase) {
        if (typeof showToast === 'function') {
            showToast('Could not initialize application. Please try again later.', 'error');
        } else {
            showError(loginError, 'Could not initialize application. Please try again later.');
        }
        showLoading(submitBtn, false);
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                // Set session expiry based on remember me option
                expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day
            }
        });
        
        if (error) {
            if (typeof showToast === 'function') {
                showToast(error.message || 'Failed to log in. Please check your credentials.', 'error');
            } else {
                showError(loginError, error.message || 'Failed to log in. Please check your credentials.');
            }
            showLoading(submitBtn, false);
            return;
        }
        
        // Redirect to dashboard on successful login
        if (typeof showToast === 'function') {
            showToast('Login successful! Redirecting...', 'success');
        }
        
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect');
        
        setTimeout(() => {
            window.location.href = redirectUrl || 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        if (typeof showToast === 'function') {
            showToast('An unexpected error occurred. Please try again.', 'error');
        } else {
            showError(loginError, 'An unexpected error occurred. Please try again.');
        }
        showLoading(submitBtn, false);
    }
}

/**
 * Handle magic link form submission
 */
async function handleMagicLinkSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('magic-email').value;
    const magicLinkError = document.getElementById('magic-link-error');
    const magicLinkSuccess = document.getElementById('magic-link-success');
    
    // Basic validation
    if (!email) {
        if (typeof showToast === 'function') {
            showToast('Please enter your email address.', 'error');
        } else {
            showError(magicLinkError, 'Please enter your email address.');
        }
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    showLoading(submitBtn, true);
    
    // Hide any previous error/success messages
    magicLinkError.style.display = 'none';
    magicLinkSuccess.style.display = 'none';
    
    if (!supabase) {
        if (typeof showToast === 'function') {
            showToast('Could not initialize application. Please try again later.', 'error');
        } else {
            showError(magicLinkError, 'Could not initialize application. Please try again later.');
        }
        showLoading(submitBtn, false);
        return;
    }
    
    try {
        // Get absolute URL for current page, then replace with dashboard path
        const currentUrl = new URL(window.location.href);
        const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
        
        // Create a clean dashboard URL with no trailing fragments
        const dashboardUrl = new URL('/dashboard.html', baseUrl);
        
        console.log('Magic link redirect URL:', dashboardUrl.toString());
        
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: dashboardUrl.toString()
            }
        });
        
        if (error) {
            console.error('Magic link error:', error);
            if (typeof showToast === 'function') {
                showToast(error.message || 'Failed to send magic link. Please try again.', 'error');
            } else {
                showError(magicLinkError, error.message || 'Failed to send magic link. Please try again.');
            }
            showLoading(submitBtn, false);
            return;
        }
        
        // Show success message
        if (typeof showToast === 'function') {
            showToast(`We've sent a magic link to ${email}. Please check your inbox and click the link to log in.`, 'success', 6000);
        } else {
            magicLinkSuccess.innerHTML = `We've sent a magic link to <strong>${email}</strong>. Please check your inbox and click the link to log in.`;
            magicLinkSuccess.style.display = 'block';
        }
        
        // Reset form
        event.target.reset();
        showLoading(submitBtn, false);
    } catch (error) {
        console.error('Magic link unexpected error:', error);
        if (typeof showToast === 'function') {
            showToast('An unexpected error occurred. Please try again.', 'error');
        } else {
            showError(magicLinkError, 'An unexpected error occurred. Please try again.');
        }
        showLoading(submitBtn, false);
    }
}

/**
 * Check if magic link login was successful
 */
function checkMagicLinkSuccess() {
    // Check if we have a #access_token in the URL (magic link success)
    const hashParams = new URLSearchParams(window.location.hash.substr(1));
    const accessToken = hashParams.get('access_token');
    
    if (accessToken) {
        console.log('Magic link login detected');
        
        if (typeof showToast === 'function') {
            showToast('Magic link login successful! Redirecting...', 'success');
        }
        
        // Clean the URL - remove hash parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, document.title, cleanUrl);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
        return true;
    }
    
    return false;
}

/**
 * Handle reset password request form submission
 */
async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const resetError = document.getElementById('reset-error');
    const resetSuccess = document.getElementById('reset-success');
    
    // Basic validation
    if (!email) {
        if (typeof showToast === 'function') {
            showToast('Please enter your email address.', 'error');
        } else {
            showError(resetError, 'Please enter your email address.');
        }
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    showLoading(submitBtn, true);
    
    // Hide any previous error/success messages
    resetError.style.display = 'none';
    resetSuccess.style.display = 'none';
    
    if (!supabase) {
        if (typeof showToast === 'function') {
            showToast('Could not initialize application. Please try again later.', 'error');
        } else {
            showError(resetError, 'Could not initialize application. Please try again later.');
        }
        showLoading(submitBtn, false);
        return;
    }
    
    try {
        // Get current URL and construct redirect URL for reset link
        const currentUrl = new URL(window.location.href);
        const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
        const redirectTo = `${baseUrl}/reset-confirm.html`;
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo
        });
        
        if (error) {
            if (typeof showToast === 'function') {
                showToast(error.message || 'Failed to send password reset link. Please try again.', 'error');
            } else {
                showError(resetError, error.message || 'Failed to send password reset link. Please try again.');
            }
            showLoading(submitBtn, false);
            return;
        }
        
        // Show success message
        if (typeof showToast === 'function') {
            showToast(`We've sent a password reset link to ${email}. Please check your inbox and follow the instructions.`, 'success');
        } else {
            resetSuccess.innerHTML = `We've sent a password reset link to <strong>${email}</strong>. Please check your inbox and follow the instructions to reset your password.`;
            resetSuccess.style.display = 'block';
        }
        
        // Reset form
        event.target.reset();
        showLoading(submitBtn, false);
    } catch (error) {
        if (typeof showToast === 'function') {
            showToast('An unexpected error occurred. Please try again.', 'error');
        } else {
            showError(resetError, 'An unexpected error occurred. Please try again.');
        }
        showLoading(submitBtn, false);
    }
}

/**
 * Handle password reset confirmation form submission
 */
async function handleResetConfirmSubmit(event) {
    event.preventDefault();
    
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const resetError = document.getElementById('reset-confirm-error');
    const resetSuccess = document.getElementById('reset-confirm-success');
    
    // Basic validation
    if (!password || !confirmPassword) {
        if (typeof showToast === 'function') {
            showToast('Please enter and confirm your new password.', 'error');
        } else {
            showError(resetError, 'Please enter and confirm your new password.');
        }
        return;
    }
    
    if (password !== confirmPassword) {
        if (typeof showToast === 'function') {
            showToast('Passwords do not match.', 'error');
        } else {
            showError(resetError, 'Passwords do not match.');
        }
        return;
    }
    
    if (!isPasswordStrong(password)) {
        if (typeof showToast === 'function') {
            showToast('Password does not meet the requirements.', 'error');
        } else {
            showError(resetError, 'Password does not meet the requirements.');
        }
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    showLoading(submitBtn, true);
    
    // Hide any previous error/success messages
    resetError.style.display = 'none';
    resetSuccess.style.display = 'none';
    
    if (!supabase) {
        if (typeof showToast === 'function') {
            showToast('Could not initialize application. Please try again later.', 'error');
        } else {
            showError(resetError, 'Could not initialize application. Please try again later.');
        }
        showLoading(submitBtn, false);
        return;
    }
    
    try {
        const { error } = await supabase.auth.updateUser({
            password
        });
        
        if (error) {
            if (typeof showToast === 'function') {
                showToast(error.message || 'Failed to update password. Please try again.', 'error');
            } else {
                showError(resetError, error.message || 'Failed to update password. Please try again.');
            }
            showLoading(submitBtn, false);
            return;
        }
        
        // Show success message
        if (typeof showToast === 'function') {
            showToast('Your password has been successfully updated. You will be redirected to the login page shortly.', 'success');
        } else {
            resetSuccess.innerHTML = 'Your password has been successfully updated. You will be redirected to the login page shortly.';
            resetSuccess.style.display = 'block';
        }
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    } catch (error) {
        if (typeof showToast === 'function') {
            showToast('An unexpected error occurred. Please try again.', 'error');
        } else {
            showError(resetError, 'An unexpected error occurred. Please try again.');
        }
        showLoading(submitBtn, false);
    }
}

/**
 * Handle signup form submission
 */
async function handleSignupSubmit(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('full-name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;
    const signupError = document.getElementById('signup-error');
    
    // Basic validation
    if (!fullName || !username || !email || !password || !confirmPassword) {
        if (typeof showToast === 'function') {
            showToast('Please fill in all fields.', 'error');
        } else {
            showError(signupError, 'Please fill in all fields.');
        }
        return;
    }
    
    if (password !== confirmPassword) {
        if (typeof showToast === 'function') {
            showToast('Passwords do not match.', 'error');
        } else {
            showError(signupError, 'Passwords do not match.');
        }
        return;
    }
    
    if (!isPasswordStrong(password)) {
        if (typeof showToast === 'function') {
            showToast('Password does not meet the requirements.', 'error');
        } else {
            showError(signupError, 'Password does not meet the requirements.');
        }
        return;
    }
    
    if (!termsAccepted) {
        if (typeof showToast === 'function') {
            showToast('You must accept the Terms of Service and Privacy Policy.', 'error');
        } else {
            showError(signupError, 'You must accept the Terms of Service and Privacy Policy.');
        }
        return;
    }
    
    // Username validation - alphanumeric with underscores, 3-20 characters
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
        if (typeof showToast === 'function') {
            showToast('Username must be 3-20 characters and may only contain letters, numbers, and underscores.', 'error');
        } else {
            showError(signupError, 'Username must be 3-20 characters and may only contain letters, numbers, and underscores.');
        }
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    showLoading(submitBtn, true);
    
    if (!supabase) {
        if (typeof showToast === 'function') {
            showToast('Could not initialize application. Please try again later.', 'error');
        } else {
            showError(signupError, 'Could not initialize application. Please try again later.');
        }
        showLoading(submitBtn, false);
        return;
    }
    
    try {
        // Sign up the user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    username: username
                }
            }
        });
        
        if (error) {
            if (typeof showToast === 'function') {
                showToast(error.message || 'Failed to create account. Please try again.', 'error');
            } else {
                showError(signupError, error.message || 'Failed to create account. Please try again.');
            }
            showLoading(submitBtn, false);
            return;
        }
        
        // If email confirmation is required
        if (data?.user?.identities?.length === 0) {
            // Show confirmation message
            if (typeof showToast === 'function') {
                showToast(`A confirmation email has been sent to ${email}. Please check your inbox and follow the instructions to complete your registration.`, 'success');
            } else {
                event.target.innerHTML = `
                    <div class="auth-success" style="display: block;">
                        <p>A confirmation email has been sent to <strong>${email}</strong>. Please check your inbox and follow the instructions to complete your registration.</p>
                    </div>
                `;
            }
        } else {
            // Create profile in profiles table with username
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    full_name: fullName,
                    username: username,
                    avatar_url: null
                });
                
            if (profileError) {
                console.error('Error creating profile:', profileError);
            }
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast('Account created successfully! Redirecting to dashboard...', 'success');
            }
            
            // Redirect to dashboard if email confirmation is not required
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    } catch (error) {
        if (typeof showToast === 'function') {
            showToast('An unexpected error occurred. Please try again.', 'error');
        } else {
            showError(signupError, 'An unexpected error occurred. Please try again.');
        }
        showLoading(submitBtn, false);
    }
}

/**
 * Handle social login (Google, Facebook)
 */
async function handleSocialLogin(provider) {
    console.log(`Attempting to login with ${provider}`);
    
    if (!supabase) {
        if (typeof showToast === 'function') {
            showToast('Could not initialize application. Please try again later.', 'error');
        } else {
            alert('Could not initialize application. Please try again later.');
        }
        return;
    }
    
    try {
        // Get absolute URL for redirecting back to the dashboard
        const currentUrl = new URL(window.location.href);
        const baseUrl = `${currentUrl.protocol}//${currentUrl.host}`;
        const dashboardUrl = new URL('/dashboard.html', baseUrl);
        
        console.log(`Social login redirect URL: ${dashboardUrl.toString()}`);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: dashboardUrl.toString()
            }
        });
        
        if (error) {
            console.error(`${provider} login error:`, error);
            if (typeof showToast === 'function') {
                showToast(error.message || `Failed to log in with ${provider}. Please try again.`, 'error');
            } else {
                alert(error.message || `Failed to log in with ${provider}. Please try again.`);
            }
            return;
        }
        
        // This won't actually be reached immediately as the user will be redirected
        // to the provider's login page
        console.log(`${provider} auth initiated:`, data);
    } catch (error) {
        console.error(`${provider} login unexpected error:`, error);
        
        let errorId = 'login-error';
        if (window.location.pathname.includes('signup')) {
            errorId = 'signup-error';
        }
        
        const errorElement = document.getElementById(errorId);
        
        if (typeof showToast === 'function') {
            showToast(`Failed to login with ${provider}. Please try again.`, 'error');
        } else if (errorElement) {
            showError(errorElement, `Failed to login with ${provider}. Please try again.`);
        } else {
            alert(`Failed to login with ${provider}. Please try again.`);
        }
    }
}

/**
 * Handle logout
 */
async function handleLogout(event) {
    event.preventDefault();
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        if (typeof showToast === 'function') {
            showToast('Logged out successfully. Redirecting...', 'success');
        }
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        
        if (typeof showToast === 'function') {
            showToast('Failed to logout. Please try again.', 'error');
        } else {
            alert('Failed to logout. Please try again.');
        }
    }
}

/**
 * Toggle between auth forms (login/magic link)
 */
function setupAuthTabs() {
    const authOptions = document.querySelectorAll('.auth-option');
    
    if (authOptions.length > 0) {
        authOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove active class from all options
                authOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                this.classList.add('active');
                
                // Hide all forms
                document.querySelectorAll('.auth-form').forEach(form => {
                    form.classList.remove('active');
                });
                
                // Show the selected form
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                // Clear error messages
                document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
                    el.style.display = 'none';
                });
            });
        });
    }
}

/**
 * Setup password visibility toggle
 */
function setupPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.password-toggle');
    
    if (toggleBtns.length > 0) {
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }
}

/**
 * Setup password strength meter
 */
function setupPasswordStrengthMeter() {
    const passwordInput = document.getElementById('password') || document.getElementById('new-password');
    const strengthBar = document.querySelector('.strength-bar');
    const passwordRequirements = document.querySelectorAll('[data-requirement]');
    
    if (passwordInput && strengthBar) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            // Set the CSS variables for the strength bar
            let percentage = (strength / 4) * 100;
            let color = '#e2e8f0'; // Default - empty
            
            // Update color based on strength
            if (strength === 0) {
                color = '#e2e8f0'; // Empty
            } else if (strength <= 1) {
                color = '#e53e3e'; // Weak - red
            } else if (strength <= 2) {
                color = '#dd6b20'; // Medium - orange
            } else if (strength <= 3) {
                color = '#3182ce'; // Good - blue
            } else {
                color = '#38a169'; // Strong - green
            }
            
            // Apply the styles directly to maintain compatibility
            strengthBar.style.width = `${percentage}%`;
            strengthBar.style.backgroundColor = color;
            
            // Also set CSS variables as a fallback
            strengthBar.style.setProperty('--strength-width', `${percentage}%`);
            strengthBar.style.setProperty('--strength-color', color);
            
            // Update password requirements
            updatePasswordRequirements(password);
        });
    }
}

/**
 * Check password strength
 * Returns a score from 0 to 4
 */
function checkPasswordStrength(password) {
    // Empty password
    if (!password) {
        return 0;
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) {
        score += 1;
    }
    
    // Complexity checks
    if (/[A-Z]/.test(password)) {
        score += 1;
    }
    
    if (/[0-9]/.test(password)) {
        score += 1;
    }
    
    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
    }
    
    return Math.min(score, 4);
}

/**
 * Update password requirements UI
 */
function updatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
    
    Object.entries(requirements).forEach(([requirement, isMet]) => {
        const reqEl = document.querySelector(`[data-requirement="${requirement}"]`);
        
        if (reqEl) {
            const icon = reqEl.querySelector('i');
            
            if (isMet) {
                icon.classList.remove('fa-times-circle');
                icon.classList.add('fa-check-circle');
                reqEl.classList.add('met');
            } else {
                icon.classList.remove('fa-check-circle');
                icon.classList.add('fa-times-circle');
                reqEl.classList.remove('met');
            }
        }
    });
}

/**
 * Update UI based on authentication state
 */
async function updateAuthUI() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            throw error;
        }
        
        // If we have a user
        if (session) {
            // Hide login/register buttons if on homepage
            const authButtons = document.querySelector('.auth-buttons');
            if (authButtons) {
                authButtons.innerHTML = `
                    <a href="dashboard.html" class="btn btn-primary">Dashboard</a>
                    <button id="header-logout-btn" class="btn btn-outline">Logout</button>
                `;
                
                // Add event listener to the logout button
                document.getElementById('header-logout-btn').addEventListener('click', handleLogout);
            }
            
            // Update profile info if on dashboard
            const profileName = document.getElementById('profile-name');
            if (profileName) {
                // Fetch user profile to get username
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('username, full_name')
                    .eq('id', session.user.id)
                    .single();
                
                if (profileError) {
                    console.error('Error fetching profile:', profileError);
                    // Fallback to metadata or email
                    profileName.textContent = session.user.user_metadata?.username || 
                                           session.user.user_metadata?.full_name || 
                                           session.user.email.split('@')[0];
                } else if (profile) {
                    // Use username from profiles table
                    profileName.textContent = profile.username || profile.full_name;
                } else {
                    // Fallback to metadata or email
                    profileName.textContent = session.user.user_metadata?.username || 
                                           session.user.user_metadata?.full_name || 
                                           session.user.email.split('@')[0];
                }
            }
            
            // Update profile image if on dashboard
            const profileImage = document.getElementById('profile-image');
            if (profileImage) {
                // Try to get avatar from profiles table first
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('avatar_url')
                    .eq('id', session.user.id)
                    .single();
                
                if (!profileError && profile && profile.avatar_url) {
                    profileImage.src = profile.avatar_url;
                } else if (session.user.user_metadata?.avatar_url) {
                    // Fallback to metadata
                    profileImage.src = session.user.user_metadata.avatar_url;
                }
            }
        } else {
            // If on a protected page, redirect to login
            const isProtectedPage = !['index.html', 'login.html', 'signup.html', 'reset-password.html', 'reset-confirm.html'].some(page => 
                window.location.pathname.endsWith(page)
            );
            
            if (isProtectedPage) {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
            }
        }
    } catch (error) {
        console.error('Error updating auth UI:', error);
    }
}

/**
 * Show error message
 */
function showError(errorElement, message) {
    if (typeof showToast === 'function') {
        showToast(message, 'error');
        return;
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

/**
 * Show or hide loading state on a button
 * @param {HTMLButtonElement} button - The button element to update
 * @param {boolean} isLoading - Whether to show or hide loading state
 */
function showLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.textContent);
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || (button.closest('#login-form') ? 'Login' : button.closest('#signup-form') ? 'Create Account' : 'Send Magic Link');
    }
}

/**
 * Check if password meets strength requirements
 * @param {string} password - The password to check
 * @returns {boolean} - Whether the password is strong enough
 */
function isPasswordStrong(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
    
    // Password is strong if it meets at least 4 requirements
    return Object.values(requirements).filter(Boolean).length >= 4;
}

/**
 * Set up social login buttons
 */
function setupSocialLoginButtons() {
    // Google login buttons
    const googleLoginBtns = document.querySelectorAll('#google-login, #google-signup');
    googleLoginBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Google login button clicked');
                handleSocialLogin('google');
            });
        }
    });
    
    // Facebook login buttons
    const facebookLoginBtns = document.querySelectorAll('#facebook-login, #facebook-signup');
    facebookLoginBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Facebook login button clicked');
                handleSocialLogin('facebook');
            });
        }
    });
}

/**
 * Handle OAuth redirect
 */
async function handleOAuthRedirect() {
    console.log('Handling OAuth redirect');
    
    const hashParams = new URLSearchParams(window.location.hash.substr(1));
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');
    
    if (error) {
        console.error('OAuth error:', error, errorDescription);
        if (typeof showToast === 'function') {
            showToast(`Authentication error: ${errorDescription || error}`, 'error');
        } else {
            alert(`Authentication error: ${errorDescription || error}`);
        }
        
        // Clean the URL - remove hash parameters
        window.history.replaceState(null, document.title, window.location.pathname);
        return;
    }
    
    if (hashParams.get('access_token')) {
        console.log('OAuth login successful');
        if (typeof showToast === 'function') {
            showToast('Login successful! Redirecting...', 'success');
        }
        
        // Clean the URL - remove hash parameters
        window.history.replaceState(null, document.title, window.location.pathname);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    }
} 