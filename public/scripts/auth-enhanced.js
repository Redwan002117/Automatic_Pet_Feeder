/**
 * Enhanced authentication features for Automatic Pet Feeder
 * - Magic link login
 * - Username availability checking
 * - Improved password strength meter
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth tab switching functionality
    initAuthTabs();
    
    // Initialize username availability checking
    initUsernameCheck();
    
    // Handle magic link form submission
    initMagicLinkSubmission();
    
    // Enhance password strength meter with live feedback
    enhancePasswordStrengthMeter();
});

/**
 * Initialize auth tab switching between password and magic link login
 */
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-option');
    const forms = document.querySelectorAll('.auth-form');
    
    if (tabs.length === 0) return; // No tabs found
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Get the target form
            const targetId = this.getAttribute('data-target');
            const targetForm = document.getElementById(targetId + '-form');
            
            if (!targetForm) return;
            
            // Update tab active state
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update form visibility
            forms.forEach(form => form.classList.remove('active'));
            targetForm.classList.add('active');
            
            // Clear any existing error messages
            const errorElement = document.querySelector('.auth-error');
            const successElement = document.querySelector('.auth-success');
            if (errorElement) errorElement.style.display = 'none';
            if (successElement) successElement.style.display = 'none';
        });
    });
}

/**
 * Initialize username availability checking
 */
function initUsernameCheck() {
    const usernameInput = document.getElementById('signup-username');
    const statusElement = document.getElementById('username-status');
    
    if (!usernameInput || !statusElement) return;
    
    let debounceTimer;
    
    usernameInput.addEventListener('input', function() {
        const username = this.value.trim();
        
        // Clear any previous debounce timer
        clearTimeout(debounceTimer);
        
        // Clear status if empty
        if (!username) {
            statusElement.textContent = '';
            statusElement.className = '';
            return;
        }
        
        // Show checking status
        statusElement.textContent = 'Checking availability...';
        statusElement.className = 'checking';
        
        // Debounce the input to avoid too many requests
        debounceTimer = setTimeout(() => {
            checkUsernameAvailability(username);
        }, 500);
    });
    
    /**
     * Check if a username is available
     * @param {string} username - The username to check
     */
    async function checkUsernameAvailability(username) {
        try {
            // Validate username format first
            if (!isValidUsername(username)) {
                statusElement.textContent = 'Username must be 3-20 characters with only letters, numbers, underscores, or hyphens';
                statusElement.className = 'unavailable';
                return;
            }
            
            if (!window.supabase) {
                console.error('Supabase client not initialized');
                return;
            }
            
            // Check if username exists in database
            const { data, error } = await window.supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();
            
            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
                console.error('Error checking username:', error);
                statusElement.textContent = 'Error checking availability';
                statusElement.className = 'unavailable';
                return;
            }
            
            if (data) {
                // Username exists
                statusElement.textContent = 'Username is already taken';
                statusElement.className = 'unavailable';
            } else {
                // Username is available
                statusElement.textContent = 'Username is available';
                statusElement.className = 'available';
            }
        } catch (error) {
            console.error('Failed to check username:', error);
            statusElement.textContent = 'Error checking availability';
            statusElement.className = 'unavailable';
        }
    }
    
    /**
     * Validate username format
     * @param {string} username - The username to validate
     * @returns {boolean} - Whether the username is valid
     */
    function isValidUsername(username) {
        // Username must be 3-20 characters, only letters, numbers, underscores, or hyphens
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        return usernameRegex.test(username);
    }
}

/**
 * Initialize magic link form submission
 */
function initMagicLinkSubmission() {
    const magicLinkForm = document.getElementById('magic-link-login-form');
    
    if (!magicLinkForm) return;
    
    magicLinkForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const emailInput = document.getElementById('magic-link-email');
        const submitButton = magicLinkForm.querySelector('button[type="submit"]');
        const errorElement = document.querySelector('.auth-error');
        const successElement = document.querySelector('.auth-success');
        
        if (!emailInput || !submitButton) return;
        
        const email = emailInput.value.trim();
        
        // Validate email
        if (!email || !isValidEmail(email)) {
            if (errorElement) {
                errorElement.textContent = 'Please enter a valid email address';
                errorElement.style.display = 'block';
            }
            return;
        }
        
        // Show loading state
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        try {
            // Make sure Supabase client is initialized
            if (!window.supabase) {
                if (window.supabaseJs && window.appConfig) {
                    try {
                        window.supabase = window.supabaseJs.createClient(
                            window.appConfig.SUPABASE_URL,
                            window.appConfig.SUPABASE_ANON_KEY
                        );
                    } catch (initError) {
                        console.error('Failed to initialize Supabase:', initError);
                        throw new Error('Unable to connect to authentication service. Please try again later.');
                    }
                } else {
                    throw new Error('Authentication service not available. Please try again later.');
                }
            }
            
            // Get the current URL for redirection after login
            const redirectTo = `${window.location.origin}/dashboard.html`;
            
            // Send magic link
            const { error } = await window.supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectTo,
                    captchaToken: document.getElementById('magic-link-captcha-container-token')?.value
                }
            });
            
            if (error) {
                throw error;
            }
            
            // Show success message
            if (errorElement) errorElement.style.display = 'none';
            if (successElement) {
                successElement.textContent = 'Magic link sent! Check your email to sign in.';
                successElement.style.display = 'block';
            }
            
            // Clear the form
            emailInput.value = '';
            
        } catch (error) {
            console.error('Magic link error:', error);
            
            if (errorElement) {
                // Show a more user-friendly error message
                let errorMessage = 'Failed to send magic link. Please try again later.';
                
                if (error.message && error.message.includes('fetch')) {
                    errorMessage = 'Network error: Please check your internet connection and try again.';
                } else if (error.message && error.message.includes('rate limit')) {
                    errorMessage = 'Too many attempts. Please wait a few minutes before trying again.';
                } else if (error.message) {
                    errorMessage = error.message;
                }
                
                errorElement.textContent = errorMessage;
                errorElement.style.display = 'block';
            }
            if (successElement) successElement.style.display = 'none';
            
        } finally {
            // Restore button state after a short delay
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }, 1000);
        }
    });
    
    /**
     * Validate email format
     * @param {string} email - The email to validate
     * @returns {boolean} - Whether the email is valid
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

/**
 * Enhance password strength meter with live feedback
 */
function enhancePasswordStrengthMeter() {
    const passwordInput = document.getElementById('signup-password');
    if (!passwordInput) return;
    
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    // Get requirement elements
    const reqLength = document.querySelector('.req-length i');
    const reqLower = document.querySelector('.req-lowercase i');
    const reqUpper = document.querySelector('.req-uppercase i');
    const reqNumber = document.querySelector('.req-number i');
    const reqSpecial = document.querySelector('.req-special i');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        // Check requirements
        const hasLength = password.length >= 8;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        
        // Update requirement icons
        if (reqLength) reqLength.className = hasLength ? 'fas fa-check-circle' : 'far fa-circle';
        if (reqLower) reqLower.className = hasLower ? 'fas fa-check-circle' : 'far fa-circle';
        if (reqUpper) reqUpper.className = hasUpper ? 'fas fa-check-circle' : 'far fa-circle';
        if (reqNumber) reqNumber.className = hasNumber ? 'fas fa-check-circle' : 'far fa-circle';
        if (reqSpecial) reqSpecial.className = hasSpecial ? 'fas fa-check-circle' : 'far fa-circle';
        
        // Calculate strength (0-5)
        let strength = 0;
        if (hasLength) strength++;
        if (hasLower) strength++;
        if (hasUpper) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;
        
        // Update strength bar and text
        if (strengthBar && strengthText) {
            // Remove all existing classes
            strengthBar.className = 'strength-bar';
            strengthText.className = 'strength-text';
            
            // Apply appropriate class based on strength
            let strengthClass, strengthLabel;
            if (strength === 0 || password.length === 0) {
                strengthClass = '';
                strengthLabel = '';
                strengthBar.style.width = '0';
            } else if (strength <= 2) {
                strengthClass = 'weak';
                strengthLabel = 'Weak';
            } else if (strength === 3) {
                strengthClass = 'fair';
                strengthLabel = 'Fair';
            } else if (strength === 4) {
                strengthClass = 'good';
                strengthLabel = 'Good';
            } else {
                strengthClass = 'strong';
                strengthLabel = 'Strong';
            }
            
            if (strengthClass) {
                strengthBar.classList.add(strengthClass);
                strengthText.classList.add(strengthClass);
                strengthText.textContent = strengthLabel;
            }
        }
        
        // Update confirm password validation if it exists
        const confirmPasswordInput = document.getElementById('signup-password-confirm');
        if (confirmPasswordInput && confirmPasswordInput.value) {
            validatePasswordMatch(password, confirmPasswordInput.value);
        }
    });
    
    // Add confirm password validation
    const confirmPasswordInput = document.getElementById('signup-password-confirm');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = passwordInput.value;
            validatePasswordMatch(password, this.value);
        });
    }
    
    /**
     * Validate that passwords match
     * @param {string} password - The main password
     * @param {string} confirmPassword - The confirmation password
     */
    function validatePasswordMatch(password, confirmPassword) {
        const confirmInput = document.getElementById('signup-password-confirm');
        if (!confirmInput) return;
        
        if (password !== confirmPassword) {
            confirmInput.classList.add('error');
            const errorMsg = confirmInput.parentElement.querySelector('.password-match-error');
            if (!errorMsg) {
                const errorElement = document.createElement('div');
                errorElement.className = 'password-match-error';
                errorElement.style.color = 'var(--danger-color)';
                errorElement.style.fontSize = 'var(--font-size-xs)';
                errorElement.style.marginTop = 'var(--space-1)';
                errorElement.textContent = 'Passwords do not match';
                confirmInput.parentElement.appendChild(errorElement);
            }
        } else {
            confirmInput.classList.remove('error');
            const errorMsg = confirmInput.parentElement.querySelector('.password-match-error');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    }
}

/**
 * Handle social media login
 * @param {string} provider - The provider name (google, facebook, apple)
 */
async function handleSocialLogin(provider) {
    try {
        // Show loading indicator
        showLoadingIndicator(true, `Connecting to ${provider}...`);
        
        // Get the current page as the redirect URL (or dashboard if not specified)
        const urlParams = new URLSearchParams(window.location.search);
        const redirectPath = urlParams.get('redirect') || '/dashboard.html';
        const redirectTo = `${window.location.origin}${redirectPath}`;
        
        console.log(`Logging in with ${provider}, will redirect to: ${redirectTo}`);
        
        // Perform OAuth login with proper redirect URL
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: redirectTo
            }
        });
        
        if (error) {
            throw error;
        }
        
        // No need for immediate redirect, Supabase handles it
        
    } catch (error) {
        console.error(`${provider} login error:`, error);
        showToast(`Failed to sign in with ${provider}. ${error.message || 'Please try again.'}`, 'error');
        showLoadingIndicator(false);
    }
}

/**
 * Show a simple loading indicator
 * @param {boolean} show - Whether to show or hide the loading indicator 
 * @param {string} message - Message to display
 */
function showLoadingIndicator(show, message = 'Loading...') {
    // Use the global loading overlay if it exists, otherwise create one
    if (typeof showSimpleLoading === 'function') {
        showSimpleLoading(show, message);
    } else {
        if (show) {
            const overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.id = 'auth-loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
                <div class="loading-message">${message}</div>
            `;
            document.body.appendChild(overlay);
        } else {
            const overlay = document.getElementById('auth-loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    }
}