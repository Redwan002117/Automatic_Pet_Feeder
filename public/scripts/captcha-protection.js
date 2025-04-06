/**
 * Captcha Protection Module for Automatic Pet Feeder
 * Implements Cloudflare Turnstile captcha for Supabase Attack Protection
 */

// Global variables
let turnstileWidgets = {};
let turnstileLoaded = false;

/**
 * Initialize captcha protection on the page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load Turnstile script if we're on an auth page
    if (isAuthPage()) {
        console.log('Auth page detected, initializing captcha protection');
        
        // Initialize captcha for forms once Turnstile is loaded
        window.onloadTurnstile = function() {
            console.log('Turnstile loaded successfully');
            turnstileLoaded = true;
            initCaptchaForForms();
        };
        
        // Add global error handler for Turnstile
        window.addEventListener('error', function(event) {
            // Check if the error is related to Turnstile
            if (event.filename && event.filename.includes('turnstile') || 
                (event.error && event.error.message && event.error.message.includes('Turnstile'))) {
                console.error('Turnstile error detected:', event.error || event.message);
                
                // If Turnstile failed to load or initialize properly, try to reload it
                if (!turnstileLoaded) {
                    console.log('Attempting to reload Turnstile after error');
                    // Remove existing script if any
                    if (document.getElementById('turnstile-script')) {
                        document.getElementById('turnstile-script').remove();
                    }
                    // Reload with delay
                    setTimeout(loadTurnstileScript, 1500);
                }
                
                // Prevent the error from bubbling up to the global handler
                event.preventDefault();
            }
        }, true);
        
        // Load the Turnstile script
        loadTurnstileScript();
        
        // Set a backup timer to check if Turnstile loaded
        setTimeout(function() {
            if (!turnstileLoaded) {
                console.warn('Turnstile not loaded after timeout, attempting recovery');
                // Try to initialize forms anyway in case the callback wasn't triggered
                initCaptchaForForms();
            }
        }, 8000);
    }
});

/**
 * Check if current page is an authentication page
 * @returns {boolean} True if on login, signup, or password reset page
 */
function isAuthPage() {
    const path = window.location.pathname.toLowerCase();
    return path.includes('login.html') || 
           path.includes('signup.html') || 
           path.includes('reset-password.html') ||
           path.includes('reset-confirm.html');
}

/**
 * Load the Turnstile script
 */
function loadTurnstileScript() {
    if (document.getElementById('turnstile-script')) return;
    
    const script = document.createElement('script');
    script.id = 'turnstile-script';
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstile';
    script.async = true;
    script.defer = true;
    
    // Add error handling for script loading
    script.onerror = function() {
        console.error('Failed to load Turnstile script');
        // Remove the failed script
        if (document.getElementById('turnstile-script')) {
            document.getElementById('turnstile-script').remove();
        }
        // Retry loading after a delay
        setTimeout(() => {
            loadTurnstileScript();
        }, 2000);
    };
    
    document.head.appendChild(script);
    
    console.log('Turnstile script loading...');
    
    // Set a timeout to check if Turnstile loaded successfully
    setTimeout(() => {
        if (!turnstileLoaded) {
            console.warn('Turnstile not loaded after timeout, retrying...');
            // Remove the script and try again
            if (document.getElementById('turnstile-script')) {
                document.getElementById('turnstile-script').remove();
            }
            loadTurnstileScript();
        }
    }, 5000);
}

/**
 * Initialize captcha for all authentication forms on the page
 */
function initCaptchaForForms() {
    // Password login form
    addCaptchaToForm('password-login-form', 'login-captcha-container');
    
    // Magic link login form
    addCaptchaToForm('magic-link-login-form', 'magic-link-captcha-container');
    
    // Signup form
    addCaptchaToForm('signup-form', 'signup-captcha-container');
    
    // Password reset form
    addCaptchaToForm('reset-password-form', 'reset-captcha-container');
    
    // Password reset confirmation form
    addCaptchaToForm('reset-confirm-form', 'reset-confirm-captcha-container');
    
    console.log('Captcha initialized for auth forms');
}

/**
 * Add captcha to a specific form
 * @param {string} formId - The ID of the form to add captcha to
 * @param {string} containerId - The ID of the container where captcha will be rendered
 */
function addCaptchaToForm(formId, containerId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Create container for captcha if it doesn't exist
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'captcha-container ios-captcha-container';
        
        // Find the submit button and insert captcha before it
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.parentNode.insertBefore(container, submitButton);
        } else {
            form.appendChild(container);
        }
    }
    
    // Add event listener to form for submission
    form.addEventListener('submit', handleFormSubmitWithCaptcha);
    
    // Render the captcha
    renderCaptcha(containerId);
}

/**
 * Render the Turnstile captcha in the specified container
 * @param {string} containerId - The ID of the container where captcha will be rendered
 */
function renderCaptcha(containerId) {
    if (!turnstileLoaded) {
        console.warn('Turnstile not loaded yet, will retry');
        setTimeout(() => renderCaptcha(containerId), 500);
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        // Clear any existing widget
        if (turnstileWidgets[containerId]) {
            try {
                turnstileWidgets[containerId].reset();
            } catch (resetError) {
                console.warn('Error resetting existing widget:', resetError);
            }
            delete turnstileWidgets[containerId];
        }
        
        // Clear container contents to ensure clean rendering
        container.innerHTML = '';
        
        // Render new widget
        turnstileWidgets[containerId] = turnstile.render(container, {
            sitekey: '0x4AAAAAAADnPIDojx_H9bMd', // Valid Cloudflare Turnstile site key
            theme: 'auto', // Auto-adjust to light/dark mode
            appearance: 'interaction-only', // Less intrusive appearance
            retry: 'auto', // Auto retry on failure
            size: 'normal',
            tabindex: 0, // Ensure it's focusable for accessibility
            callback: function(token) {
                // Store token in a hidden input field
                let tokenInput = document.getElementById(`${containerId}-token`);
                if (!tokenInput) {
                    tokenInput = document.createElement('input');
                    tokenInput.type = 'hidden';
                    tokenInput.id = `${containerId}-token`;
                    tokenInput.name = 'cf-turnstile-response';
                    container.parentNode.appendChild(tokenInput);
                }
                tokenInput.value = token;
                
                // Remove any error messages
                const errorElement = container.closest('form').querySelector('.auth-error');
                if (errorElement && errorElement.textContent.includes('captcha')) {
                    errorElement.style.display = 'none';
                }
                
                // Reset container styling if it was highlighted for error
                container.style.borderColor = '';
                container.style.boxShadow = '';
            },
            'error-callback': function() {
                console.warn('Turnstile encountered an error');
                // Try to reset the widget
                if (turnstileWidgets[containerId]) {
                    setTimeout(() => {
                        try {
                            turnstile.reset(turnstileWidgets[containerId]);
                        } catch (resetError) {
                            console.error('Error resetting captcha:', resetError);
                            // If reset fails, try to re-render from scratch
                            delete turnstileWidgets[containerId];
                            setTimeout(() => renderCaptcha(containerId), 1500);
                        }
                    }, 1000);
                }
            },
            'expired-callback': function() {
                console.log('Captcha token expired, refreshing');
                if (turnstileWidgets[containerId]) {
                    try {
                        turnstile.reset(turnstileWidgets[containerId]);
                    } catch (resetError) {
                        console.error('Error resetting expired captcha:', resetError);
                        // If reset fails, try to re-render from scratch
                        delete turnstileWidgets[containerId];
                        setTimeout(() => renderCaptcha(containerId), 1000);
                    }
                }
            }
        });
        
        // Verify the widget was created successfully
        if (!turnstileWidgets[containerId]) {
            throw new Error('Widget creation failed');
        }
    } catch (error) {
        console.error('Error rendering captcha:', error);
        
        // Add a fallback message to the container
        container.innerHTML = `
            <div class="captcha-fallback">
                <p>Captcha verification is temporarily unavailable.</p>
                <button type="button" class="retry-captcha-btn" onclick="renderCaptcha('${containerId}')">Retry Captcha</button>
            </div>
        `;
        
        // Try again after a delay
        setTimeout(() => {
            if (!turnstileWidgets[containerId]) {
                renderCaptcha(containerId);
            }
        }, 3000);
    }
}

/**
 * Handle form submission with captcha verification
 * @param {Event} event - The form submission event
 */
async function handleFormSubmitWithCaptcha(event) {
    event.preventDefault();
    
    const form = event.target;
    const formId = form.id;
    const captchaContainerId = formId === 'password-login-form' ? 'login-captcha-container' :
                              formId === 'magic-link-login-form' ? 'magic-link-captcha-container' :
                              formId === 'signup-form' ? 'signup-captcha-container' :
                              formId === 'reset-password-form' ? 'reset-captcha-container' :
                              'reset-confirm-captcha-container';
    
    // Get captcha token
    const tokenInput = document.getElementById(`${captchaContainerId}-token`);
    const token = tokenInput ? tokenInput.value : null;
    
    if (!token) {
        // If Turnstile is loaded but no token, show error
        if (turnstileLoaded) {
            showCaptchaError(form, 'Please complete the captcha verification');
            // Try to reset the captcha
            if (turnstileWidgets[captchaContainerId]) {
                try {
                    turnstile.reset(turnstileWidgets[captchaContainerId]);
                } catch (resetError) {
                    console.error('Error resetting captcha:', resetError);
                    // If reset fails, try to re-render
                    renderCaptcha(captchaContainerId);
                }
            } else {
                // If widget doesn't exist, try to render it
                renderCaptcha(captchaContainerId);
            }
        } else {
            // If Turnstile isn't loaded, try to load it
            showCaptchaError(form, 'Captcha verification is loading. Please try again in a moment.');
            loadTurnstileScript();
        }
        return;
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent || submitButton.dataset.originalText || 'Submit';
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    
    try {
        // Verify the captcha token first
        const isTokenValid = await verifyCaptchaToken(token);
        
        if (!isTokenValid) {
            throw new Error('Captcha verification failed. Please try again.');
        }
        
        // Get form data
        const formData = new FormData(form);
        const formDataObj = {};
        formData.forEach((value, key) => {
            formDataObj[key] = value;
        });
        
        // Add captcha token to form data
        formDataObj.captchaToken = token;
        
        // Update loading message
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Handle different form types
        if (formId === 'password-login-form') {
            await handlePasswordLogin(formDataObj, form);
        } else if (formId === 'magic-link-login-form') {
            await handleMagicLinkLogin(formDataObj, form);
        } else if (formId === 'signup-form') {
            await handleSignup(formDataObj, form);
        } else if (formId === 'reset-password-form') {
            await handlePasswordReset(formDataObj, form);
        } else if (formId === 'reset-confirm-form') {
            await handlePasswordResetConfirm(formDataObj, form);
        }
    } catch (error) {
        console.error('Form submission error:', error);
        
        // Check for captcha-specific errors
        if (error.message && (error.message.toLowerCase().includes('captcha') || 
                              error.message.toLowerCase().includes('verification') ||
                              error.message.toLowerCase().includes('turnstile'))) {
            showCaptchaError(form, 'Captcha verification failed. Please try again.');
            
            // Generate a new captcha token
            if (turnstileWidgets[captchaContainerId]) {
                try {
                    turnstile.reset(turnstileWidgets[captchaContainerId]);
                } catch (resetError) {
                    console.error('Error resetting captcha after verification error:', resetError);
                    // If reset fails, try to re-render
                    renderCaptcha(captchaContainerId);
                }
            } else {
                renderCaptcha(captchaContainerId);
            }
        } else {
            showCaptchaError(form, error.message || 'An error occurred. Please try again.');
            
            // Reset captcha on other errors too
            if (turnstileWidgets[captchaContainerId]) {
                try {
                    turnstile.reset(turnstileWidgets[captchaContainerId]);
                } catch (resetError) {
                    console.error('Error resetting captcha after form error:', resetError);
                    renderCaptcha(captchaContainerId);
                }
            }
        }
    } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/**
 * Handle password login with captcha
 * @param {Object} formData - The form data including captcha token
 * @param {HTMLFormElement} form - The form element
 */
async function handlePasswordLogin(formData, form) {
    const email = formData.email || document.getElementById('login-email').value;
    const password = formData.password || document.getElementById('login-password').value;
    const captchaToken = formData.captchaToken;
    
    if (!email || !password) {
        throw new Error('Please enter both email and password');
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        // Initialize Supabase client if needed
        if (!window.supabase) {
            if (window.supabaseJs && window.appConfig) {
                window.supabase = window.supabaseJs.createClient(
                    window.appConfig.SUPABASE_URL,
                    window.appConfig.SUPABASE_ANON_KEY
                );
            } else {
                throw new Error('Authentication service not available');
            }
        }
        
        // Sign in with email and password, including captcha token
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                captchaToken
            }
        });
        
        if (error) throw error;
        
        // Redirect to dashboard or stored redirect path
        if (typeof handleSuccessfulLogin === 'function') {
            handleSuccessfulLogin();
        } else {
            window.location.href = '/dashboard.html';
        }
    } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/**
 * Handle magic link login with captcha
 * @param {Object} formData - The form data including captcha token
 * @param {HTMLFormElement} form - The form element
 */
async function handleMagicLinkLogin(formData, form) {
    const email = formData.email || document.getElementById('magic-link-email').value;
    const captchaToken = formData.captchaToken;
    
    if (!email) {
        throw new Error('Please enter your email address');
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Initialize Supabase client if needed
        if (!window.supabase) {
            if (window.supabaseJs && window.appConfig) {
                window.supabase = window.supabaseJs.createClient(
                    window.appConfig.SUPABASE_URL,
                    window.appConfig.SUPABASE_ANON_KEY
                );
            } else {
                throw new Error('Authentication service not available');
            }
        }
        
        // Get the current URL for redirection after login
        const redirectTo = `${window.location.origin}/dashboard.html`;
        
        // Send magic link with captcha token
        const { error } = await window.supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: redirectTo,
                captchaToken
            }
        });
        
        if (error) throw error;
        
        // Show success message
        const errorElement = document.querySelector('.auth-error');
        const successElement = document.querySelector('.auth-success');
        if (errorElement) errorElement.style.display = 'none';
        if (successElement) {
            successElement.textContent = 'Magic link sent! Check your email to sign in.';
            successElement.style.display = 'block';
        }
        
        // Clear the form
        document.getElementById('magic-link-email').value = '';
    } finally {
        // Restore button state after a short delay
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }, 1000);
    }
}

/**
 * Handle signup with captcha
 * @param {Object} formData - The form data including captcha token
 * @param {HTMLFormElement} form - The form element
 */
async function handleSignup(formData, form) {
    const email = formData.email || document.getElementById('signup-email').value;
    const password = formData.password || document.getElementById('signup-password').value;
    const username = formData.username || (document.getElementById('signup-username') ? document.getElementById('signup-username').value : null);
    const captchaToken = formData.captchaToken;
    
    if (!email || !password) {
        throw new Error('Please enter both email and password');
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    try {
        // Initialize Supabase client if needed
        if (!window.supabase) {
            if (window.supabaseJs && window.appConfig) {
                window.supabase = window.supabaseJs.createClient(
                    window.appConfig.SUPABASE_URL,
                    window.appConfig.SUPABASE_ANON_KEY
                );
            } else {
                throw new Error('Authentication service not available');
            }
        }
        
        // Get the current URL for redirection after signup
        const redirectTo = `${window.location.origin}/dashboard.html`;
        
        // Sign up with email and password, including captcha token
        const { data, error } = await window.supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: redirectTo,
                data: { username },
                captchaToken
            }
        });
        
        if (error) throw error;
        
        // Show success message
        const errorElement = document.querySelector('.auth-error');
        const successElement = document.querySelector('.auth-success');
        if (errorElement) errorElement.style.display = 'none';
        if (successElement) {
            successElement.textContent = 'Account created! Please check your email to verify your account.';
            successElement.style.display = 'block';
        }
        
        // Clear the form
        form.reset();
    } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/**
 * Handle password reset with captcha
 * @param {Object} formData - The form data including captcha token
 * @param {HTMLFormElement} form - The form element
 */
async function handlePasswordReset(formData, form) {
    const email = formData.email || document.getElementById('email').value;
    const captchaToken = formData.captchaToken;
    
    if (!email) {
        throw new Error('Please enter your email address');
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        // Initialize Supabase client if needed
        if (!window.supabase) {
            if (window.supabaseJs && window.appConfig) {
                window.supabase = window.supabaseJs.createClient(
                    window.appConfig.SUPABASE_URL,
                    window.appConfig.SUPABASE_ANON_KEY
                );
            } else {
                throw new Error('Authentication service not available');
            }
        }
        
        // Get the current URL for redirection after reset
        const redirectTo = `${window.location.origin}/reset-confirm.html`;
        
        // Send password reset email with captcha token
        const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
            options: {
                redirectTo,
                captchaToken
            }
        });
        
        if (error) throw error;
        
        // Show success message
        const errorElement = document.getElementById('reset-error');
        const successElement = document.getElementById('reset-success');
        if (errorElement) errorElement.style.display = 'none';
        if (successElement) {
            successElement.textContent = 'Password reset link sent! Check your email to reset your password.';
            successElement.style.display = 'block';
        }
        
        // Clear the form
        document.getElementById('email').value = '';
    } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/**
 * Handle password reset confirmation with captcha
 * @param {Object} formData - The form data including captcha token
 * @param {HTMLFormElement} form - The form element
 */
async function handlePasswordResetConfirm(formData, form) {
    const password = formData.password || document.getElementById('password').value;
    const confirmPassword = formData['confirm-password'] || document.getElementById('confirm-password').value;
    const captchaToken = formData.captchaToken;
    
    if (!password || !confirmPassword) {
        throw new Error('Please enter and confirm your new password');
    }
    
    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    // Show loading state
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting password...';
    
    try {
        // Initialize Supabase client if needed
        if (!window.supabase) {
            if (window.supabaseJs && window.appConfig) {
                window.supabase = window.supabaseJs.createClient(
                    window.appConfig.SUPABASE_URL,
                    window.appConfig.SUPABASE_ANON_KEY
                );
            } else {
                throw new Error('Authentication service not available');
            }
        }
        
        // Update user password with captcha token
        const { error } = await window.supabase.auth.updateUser({
            password: password
        }, {
            captchaToken: captchaToken
        });
        
        if (error) throw error;
        
        // Show success message
        const errorElement = document.getElementById('reset-confirm-error');
        const successElement = document.getElementById('reset-confirm-success');
        if (errorElement) errorElement.style.display = 'none';
        if (successElement) {
            successElement.textContent = 'Your password has been updated successfully. You can now log in with your new password.';
            successElement.style.display = 'block';
        }
        
        // Clear the form
        form.reset();
        
        // Add login link
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 3000);
    } finally {
        // Restore button state
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
    }
}

/**
 * Verify captcha token with Supabase
 * @param {string} token - The captcha token to verify
 * @returns {Promise<boolean>} - Whether the token is valid
 */
async function verifyCaptchaToken(token) {
    if (!token) return false;
    
    try {
        // Initialize Supabase client if needed
        if (!window.supabase) {
            if (window.supabaseJs && window.appConfig) {
                window.supabase = window.supabaseJs.createClient(
                    window.appConfig.SUPABASE_URL,
                    window.appConfig.SUPABASE_ANON_KEY
                );
            } else {
                throw new Error('Authentication service not available');
            }
        }
        
        // Use Supabase function to verify token
        // This is a placeholder - in a real implementation, you would call a Supabase function
        // that verifies the token with Cloudflare's API
        
        // For now, we'll assume the token is valid if it's not empty and has a reasonable length
        return token && token.length > 20;
    } catch (error) {
        console.error('Error verifying captcha token:', error);
        return false;
    }
}

/**
 * Show captcha error message
 * @param {HTMLFormElement} form - The form element
 * @param {string} message - The error message to display
 */
function showCaptchaError(form, message) {
    let errorElement;
    
    // Find the appropriate error element based on form ID
    if (form.id === 'reset-password-form') {
        errorElement = document.getElementById('reset-error');
    } else if (form.id === 'reset-confirm-form') {
        errorElement = document.getElementById('reset-confirm-error');
    } else {
        // Try to find error element within the form first
        errorElement = form.querySelector('.auth-error');
        
        // If not found, look for any auth-error on the page
        if (!errorElement) {
            errorElement = document.querySelector('.auth-error');
        }
        
        // If still not found, create one
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'auth-error';
            errorElement.setAttribute('role', 'alert');
            errorElement.setAttribute('aria-live', 'assertive');
            
            // Insert at the beginning of the form
            if (form.firstChild) {
                form.insertBefore(errorElement, form.firstChild);
            } else {
                form.appendChild(errorElement);
            }
        }
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Ensure the error is visible by scrolling to it
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight the captcha container
        const captchaContainerId = form.id === 'password-login-form' ? 'login-captcha-container' :
                                  form.id === 'magic-link-login-form' ? 'magic-link-captcha-container' :
                                  form.id === 'signup-form' ? 'signup-captcha-container' :
                                  form.id === 'reset-password-form' ? 'reset-captcha-container' :
                                  'reset-confirm-captcha-container';
        
        const captchaContainer = document.getElementById(captchaContainerId);
        if (captchaContainer) {
            captchaContainer.style.borderColor = 'var(--danger-color, #FF3B30)';
            captchaContainer.style.boxShadow = '0 0 0 2px rgba(255, 59, 48, 0.2)';
            
            // Reset the highlight after a delay
            setTimeout(() => {
                captchaContainer.style.borderColor = '';
                captchaContainer.style.boxShadow = '';
            }, 3000);
        }
    } else {
        console.error('Error:', message);
        // Fallback to alert if no error element can be found or created
        alert('Error: ' + message);
    }
}