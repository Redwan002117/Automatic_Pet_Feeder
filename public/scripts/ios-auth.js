/**
 * iOS-style auth pages enhancements
 * Adds improved iOS-like behaviors to the authentication forms
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize iOS-style form behaviors
    initPasswordVisibilityToggles();
    initPasswordStrengthMeter();
    initiOSFormFocus();
    initFormValidation();

    // Initialize social login buttons
    const socialButtons = document.querySelectorAll('.social-login-button');
    
    socialButtons.forEach(button => {
        const provider = button.getAttribute('data-provider');
        if (provider) {
            button.addEventListener('click', async function(event) {
                event.preventDefault();
                
                try {
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
                    
                    // Get redirect URL from query parameters or use dashboard
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectPath = urlParams.get('redirect') || '/dashboard.html';
                    const redirectTo = window.location.origin + redirectPath;
                    
                    console.log(`Starting ${provider} login with redirect to: ${redirectTo}`);
                    
                    // Make sure Supabase is initialized
                    if (!window.supabase && window.supabaseJs && window.appConfig) {
                        window.supabase = window.supabaseJs.createClient(
                            window.appConfig.SUPABASE_URL,
                            window.appConfig.SUPABASE_ANON_KEY
                        );
                    }
                    
                    if (!window.supabase) {
                        throw new Error('Authentication service not available');
                    }
                    
                    // Initiate OAuth login
                    const { data, error } = await window.supabase.auth.signInWithOAuth({
                        provider: provider.toLowerCase(),
                        options: {
                            redirectTo: redirectTo
                        }
                    });
                    
                    if (error) throw error;
                    
                    // If we get here without a redirect, something went wrong
                    console.warn('OAuth flow did not redirect automatically');
                    
                } catch (error) {
                    console.error(`${provider} login error:`, error);
                    
                    // Remove loading overlay
                    const overlay = document.querySelector('.loading-overlay');
                    if (overlay) overlay.remove();
                    
                    // Show error message
                    const errorEl = document.querySelector('.auth-error');
                    if (errorEl) {
                        errorEl.textContent = `Failed to sign in with ${provider}. ${error.message || 'Please try again later.'}`;
                        errorEl.style.display = 'block';
                    }
                }
            });
        }
    });
});

/**
 * Initialize password visibility toggle buttons
 */
function initPasswordVisibilityToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.closest('.password-field').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
            
            // Add haptic-like feedback with subtle transform
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        });
    });
}

/**
 * Initialize password strength meter and requirements checklist
 */
function initPasswordStrengthMeter() {
    const passwordInput = document.getElementById('signup-password');
    if (!passwordInput) return;
    
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    // Password requirement checkmarks
    const reqLength = document.querySelector('.req-length i');
    const reqLower = document.querySelector('.req-lowercase i');
    const reqUpper = document.querySelector('.req-uppercase i');
    const reqNumber = document.querySelector('.req-number i');
    const reqSpecial = document.querySelector('.req-special i');
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        
        // Check password requirements
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
        
        // Calculate strength
        if (hasLength) strength += 1;
        if (hasLower) strength += 1;
        if (hasUpper) strength += 1;
        if (hasNumber) strength += 1;
        if (hasSpecial) strength += 1;
        
        // Update strength bar
        let strengthPercentage = (strength / 5) * 100;
        let strengthColor = '';
        let strengthLabel = '';
        
        if (strengthPercentage <= 20) {
            strengthColor = 'var(--danger-color)';
            strengthLabel = 'Very Weak';
        } else if (strengthPercentage <= 40) {
            strengthColor = 'var(--danger-color)';
            strengthLabel = 'Weak';
        } else if (strengthPercentage <= 60) {
            strengthColor = 'var(--warning-color)';
            strengthLabel = 'Fair';
        } else if (strengthPercentage <= 80) {
            strengthColor = 'var(--success-color)';
            strengthLabel = 'Good';
        } else {
            strengthColor = 'var(--success-color)';
            strengthLabel = 'Strong';
        }
        
        if (strengthBar) {
            strengthBar.style.width = `${strengthPercentage}%`;
            strengthBar.style.backgroundColor = strengthColor;
        }
        
        if (strengthText) {
            strengthText.textContent = strengthLabel;
            strengthText.style.color = strengthColor;
        }
    });
}

/**
 * Add iOS-style focus effects to form inputs
 */
function initiOSFormFocus() {
    const inputs = document.querySelectorAll('.auth-form-input');
    
    inputs.forEach(input => {
        // On focus, add subtle animation
        input.addEventListener('focus', function() {
            this.style.transition = 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease';
            this.style.transform = 'translateY(-1px)';
        });
        
        // On blur, remove animation
        input.addEventListener('blur', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

/**
 * Initialize real-time form validation with iOS-style feedback
 */
function initFormValidation() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // Handle login form validation
    if (loginForm) {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        // Add real-time validation
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                validateEmail(this);
            });
        }
        
        // Submit validation
        loginForm.addEventListener('submit', function(e) {
            let isValid = true;
            
            if (emailInput && !validateEmail(emailInput)) {
                isValid = false;
            }
            
            if (passwordInput && !passwordInput.value.trim()) {
                showInputError(passwordInput, 'Please enter your password');
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
                // Add subtle shake animation to form on error
                this.style.animation = 'shakeX 0.5s';
                setTimeout(() => {
                    this.style.animation = '';
                }, 500);
            }
        });
    }
    
    // Handle signup form validation
    if (signupForm) {
        const emailInput = document.getElementById('signup-email');
        const passwordInput = document.getElementById('signup-password');
        const confirmInput = document.getElementById('signup-password-confirm');
        const termsCheckbox = document.getElementById('terms-checkbox');
        
        // Add real-time validation
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                validateEmail(this);
            });
        }
        
        if (passwordInput && confirmInput) {
            confirmInput.addEventListener('blur', function() {
                if (passwordInput.value !== this.value) {
                    showInputError(this, 'Passwords do not match');
                } else {
                    clearInputError(this);
                }
            });
        }
        
        // Submit validation
        signupForm.addEventListener('submit', function(e) {
            let isValid = true;
            
            if (emailInput && !validateEmail(emailInput)) {
                isValid = false;
            }
            
            if (passwordInput) {
                // Check password strength (must be at least fair)
                const strength = calculatePasswordStrength(passwordInput.value);
                if (strength < 3) {
                    showInputError(passwordInput, 'Password is not strong enough');
                    isValid = false;
                } else {
                    clearInputError(passwordInput);
                }
            }
            
            if (confirmInput) {
                if (!confirmInput.value.trim()) {
                    showInputError(confirmInput, 'Please confirm your password');
                    isValid = false;
                } else if (passwordInput && passwordInput.value !== confirmInput.value) {
                    showInputError(confirmInput, 'Passwords do not match');
                    isValid = false;
                } else {
                    clearInputError(confirmInput);
                }
            }
            
            if (termsCheckbox && !termsCheckbox.checked) {
                // Find parent wrapper to show error
                const wrapper = termsCheckbox.closest('.auth-checkbox-wrapper');
                if (wrapper) {
                    wrapper.classList.add('error');
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'field-error';
                    errorMsg.textContent = 'You must agree to the terms';
                    // Remove any existing error first
                    const existingError = wrapper.nextElementSibling;
                    if (existingError && existingError.classList.contains('field-error')) {
                        existingError.remove();
                    }
                    wrapper.after(errorMsg);
                }
                isValid = false;
            }
            
            if (!isValid) {
                e.preventDefault();
                // Add subtle shake animation to form on error
                this.style.animation = 'shakeX 0.5s';
                setTimeout(() => {
                    this.style.animation = '';
                }, 500);
            }
        });
    }
}

/**
 * Helper function to validate email with iOS-style UI feedback
 */
function validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
        showInputError(input, 'Email is required');
        return false;
    } else if (!emailRegex.test(email)) {
        showInputError(input, 'Please enter a valid email address');
        return false;
    } else {
        clearInputError(input);
        return true;
    }
}

/**
 * Show input error with iOS-style appearance
 */
function showInputError(input, message) {
    input.classList.add('error');
    
    // Find or create error message element
    let errorElement = input.parentElement.querySelector('.field-error');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        input.parentElement.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Add subtle shake animation to the input
    input.style.animation = 'shakeX 0.5s';
    setTimeout(() => {
        input.style.animation = '';
    }, 500);
}

/**
 * Clear input error
 */
function clearInputError(input) {
    input.classList.remove('error');
    
    // Find and hide error message
    const errorElement = input.parentElement.querySelector('.field-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * Calculate password strength (returns 0-5)
 */
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Check password requirements
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
}

// Add iOS-style shake animation
const style = document.createElement('style');
style.textContent = `
@keyframes shakeX {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.auth-form-input.error {
  border-color: var(--danger-color);
  background-color: rgba(255, 59, 48, 0.05);
}

.field-error {
  color: var(--danger-color);
  font-size: var(--font-size-xs);
  margin-top: var(--space-1);
  display: none;
}

.auth-checkbox-wrapper.error label:before {
  border-color: var(--danger-color);
  background-color: rgba(255, 59, 48, 0.05);
}
`;

document.head.appendChild(style);