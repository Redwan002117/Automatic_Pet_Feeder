/**
 * Captcha Protection Module for Automatic Pet Feeder
 * Implements Cloudflare Turnstile captcha for Supabase Attack Protection
 */

// Global variables
let turnstileWidgets = {};
let turnstileLoaded = false;
let turnstileRetryCount = 0;
const MAX_TURNSTILE_RETRIES = 3;

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
            turnstileRetryCount = 0;
            initCaptchaForForms();
        };
        
        // Add global error handler for Turnstile
        window.addEventListener('error', function(event) {
            // Check if the error is related to Turnstile
            if (event.filename && event.filename.includes('turnstile') || 
                (event.error && event.error.message && event.error.message.includes('Turnstile'))) {
                console.error('Turnstile error detected:', event.error || event.message);
                
                // If Turnstile failed to load or initialize properly, try to reload it
                if (!turnstileLoaded && turnstileRetryCount < MAX_TURNSTILE_RETRIES) {
                    console.log(`Attempting to reload Turnstile after error (attempt ${turnstileRetryCount + 1}/${MAX_TURNSTILE_RETRIES})`);
                    turnstileRetryCount++;
                    
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
    // Updated to work with both URL structures - with or without /public/
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
        
        // Check if we've reached the retry limit
        if (turnstileRetryCount < MAX_TURNSTILE_RETRIES) {
            turnstileRetryCount++;
            console.log(`Retrying Turnstile script load (attempt ${turnstileRetryCount}/${MAX_TURNSTILE_RETRIES})`);
            // Retry loading after a delay
            setTimeout(() => {
                loadTurnstileScript();
            }, 2000);
        } else {
            console.error(`Maximum retry attempts (${MAX_TURNSTILE_RETRIES}) reached. Using fallback.`);
            // Display fallback for all captcha containers
            displayCaptchaFallbacks();
        }
    };
    
    document.head.appendChild(script);
    
    console.log('Turnstile script loading...');
    
    // Set a timeout to check if Turnstile loaded successfully
    setTimeout(() => {
        if (!turnstileLoaded && turnstileRetryCount < MAX_TURNSTILE_RETRIES) {
            console.warn('Turnstile not loaded after timeout, retrying...');
            turnstileRetryCount++;
            // Remove the script and try again
            if (document.getElementById('turnstile-script')) {
                document.getElementById('turnstile-script').remove();
            }
            loadTurnstileScript();
        } else if (!turnstileLoaded) {
            console.error(`Maximum retry attempts (${MAX_TURNSTILE_RETRIES}) reached. Using fallback.`);
            displayCaptchaFallbacks();
        }
    }, 5000);
}

/**
 * Display fallbacks for all captcha containers when Turnstile fails to load
 */
function displayCaptchaFallbacks() {
    const containers = [
        'login-captcha-container',
        'magic-link-captcha-container',
        'signup-captcha-container',
        'reset-captcha-container',
        'reset-confirm-captcha-container'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="captcha-fallback">
                    <p>Captcha verification is temporarily unavailable.</p>
                    <input type="hidden" id="${containerId}-token" name="cf-turnstile-response" value="fallback_token">
                    <p class="small-text">You may proceed with form submission.</p>
                </div>
            `;
        }
    });
    
    // Set a global flag to indicate we're in fallback mode
    window.turnstileFallbackMode = true;
}

/**
 * Initialize captcha for all authentication forms on the page
 */
function initCaptchaForForms() {
    // Find all forms that need captcha protection
    const forms = document.querySelectorAll('form[data-captcha="true"]');
    
    forms.forEach(form => {
        const formId = form.id;
        let captchaContainerId;
        
        // Determine captcha container ID based on form ID
        switch (formId) {
            case 'login-form':
                captchaContainerId = 'login-captcha-container';
                break;
            case 'magic-link-form':
                captchaContainerId = 'magic-link-captcha-container';
                break;
            case 'signup-form':
                captchaContainerId = 'signup-captcha-container';
                break;
            case 'reset-form':
                captchaContainerId = 'reset-captcha-container';
                break;
            case 'reset-confirm-form':
                captchaContainerId = 'reset-confirm-captcha-container';
                break;
            default:
                // If no specific ID, use a generic ID based on the form ID
                captchaContainerId = `${formId}-captcha-container`;
        }
        
        // Find or create captcha container
        let captchaContainer = document.getElementById(captchaContainerId);
        if (!captchaContainer) {
            console.warn(`Captcha container #${captchaContainerId} not found, creating one`);
            captchaContainer = document.createElement('div');
            captchaContainer.id = captchaContainerId;
            captchaContainer.classList.add('captcha-container');
            
            // Find submit button to insert before
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                form.insertBefore(captchaContainer, submitButton);
            } else {
                form.appendChild(captchaContainer);
            }
        }
        
        // Render captcha in the container
        renderCaptcha(captchaContainerId);
        
        // Add form submission handler
        form.addEventListener('submit', function(event) {
            // Find the token input
            const tokenInput = document.getElementById(`${captchaContainerId}-token`);
            
            // Check if we're in fallback mode or have a valid token
            if (!window.turnstileFallbackMode && (!tokenInput || !tokenInput.value)) {
                console.log('Captcha validation required');
                event.preventDefault();
                
                // Highlight the captcha container to draw attention
                captchaContainer.style.borderColor = 'red';
                captchaContainer.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.5)';
                
                // Show error message
                const errorElement = form.querySelector('.auth-error');
                if (errorElement) {
                    errorElement.textContent = 'Please complete the captcha verification';
                    errorElement.style.display = 'block';
                }
                
                // Re-render captcha
                renderCaptcha(captchaContainerId);
                
                // Focus on captcha container for accessibility
                captchaContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

/**
 * Render the Turnstile captcha in the specified container
 * @param {string} containerId - The ID of the container where captcha will be rendered
 */
function renderCaptcha(containerId) {
    if (!turnstileLoaded) {
        if (turnstileRetryCount < MAX_TURNSTILE_RETRIES) {
            console.warn('Turnstile not loaded yet, will retry');
            setTimeout(() => renderCaptcha(containerId), 500);
            return;
        } else {
            console.error('Failed to load Turnstile after maximum retries');
            // Display fallback for this container
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="captcha-fallback">
                        <p>Captcha verification is temporarily unavailable.</p>
                        <input type="hidden" id="${containerId}-token" name="cf-turnstile-response" value="fallback_token">
                        <p class="small-text">You may proceed with form submission.</p>
                    </div>
                `;
            }
            return;
        }
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
        
        // Get the domain for the site key
        // This ensures the domain is consistent regardless of URL structure changes
        const domain = window.location.hostname;
        
        // Render new widget with updated site key
        turnstileWidgets[containerId] = turnstile.render(container, {
            sitekey: '1x0000000000000000000AA', // Updated Cloudflare Turnstile site key
            theme: 'auto', // Auto-adjust to light/dark mode
            appearance: 'interaction-only', // Less intrusive appearance
            retry: 'auto', // Auto retry on failure
            size: 'normal',
            domain: domain, // Explicitly set the domain
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
            'error-callback': function(error) {
                console.warn('Turnstile encountered an error:', error);
                
                // If there are repeated errors, switch to fallback
                if (error && (error.includes('invalid domain') || error.includes('sitekey invalid'))) {
                    console.error('Domain validation error with Turnstile, using fallback');
                    
                    // Display fallback for this container
                    container.innerHTML = `
                        <div class="captcha-fallback">
                            <p>Captcha verification is temporarily unavailable.</p>
                            <input type="hidden" id="${containerId}-token" name="cf-turnstile-response" value="fallback_token">
                            <p class="small-text">You may proceed with form submission.</p>
                        </div>
                    `;
                    return;
                }
                
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
                <input type="hidden" id="${containerId}-token" name="cf-turnstile-response" value="fallback_token">
                <p class="small-text">You may proceed with form submission.</p>
                <button type="button" class="retry-captcha-btn" onclick="renderCaptcha('${containerId}')">Retry Captcha</button>
            </div>
        `;
    }
}