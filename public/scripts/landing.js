/**
 * Landing page JavaScript for Automatic Pet Feeder
 * Handles landing page specific functionality like testimonial slider, 
 * smooth scrolling, and contact form.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    initTestimonialSlider();
    initSmoothScroll();
    initContactForm();
    initAnimatedSections();
    checkAuthStatus();
});

/**
 * Initialize testimonial slider with improved animation performance
 */
function initTestimonialSlider() {
    const testimonialContainer = document.querySelector('.testimonial-slider');
    if (!testimonialContainer) return;
    
    const slides = testimonialContainer.querySelectorAll('.testimonial-slide');
    const nextBtn = testimonialContainer.querySelector('.testimonial-next');
    const prevBtn = testimonialContainer.querySelector('.testimonial-prev');
    const indicators = testimonialContainer.querySelectorAll('.testimonial-indicator');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    let autoSlideInterval;
    let isHovering = false;
    
    // Function to show a specific slide
    function showSlide(index) {
        // Add animate class for better performance
        slides.forEach(slide => slide.classList.add('animate'));
        
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
            slide.setAttribute('aria-hidden', 'true');
        });
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
            indicator.setAttribute('aria-selected', i === index);
        });
        
        // Show the selected slide
        slides[index].classList.add('active');
        slides[index].setAttribute('aria-hidden', 'false');
        
        // Remove animate class after animation completes
        setTimeout(() => {
            slides.forEach(slide => slide.classList.remove('animate'));
        }, 500);
        
        currentSlide = index;
    }
    
    // Show the first slide
    showSlide(0);
    
    // Set up auto-advancing slides
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            if (!isHovering) {
                const nextSlide = (currentSlide + 1) % slides.length;
                showSlide(nextSlide);
            }
        }, 5000);
    }
    
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }
    
    // Add click handlers for navigation
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            stopAutoSlide();
            const nextSlide = (currentSlide + 1) % slides.length;
            showSlide(nextSlide);
            startAutoSlide();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            stopAutoSlide();
            const prevSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(prevSlide);
            startAutoSlide();
        });
    }
    
    // Add click handlers for indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', (e) => {
            e.preventDefault();
            stopAutoSlide();
            showSlide(index);
            startAutoSlide();
        });
    });
    
    // Pause auto-sliding when hovering over slider
    testimonialContainer.addEventListener('mouseenter', () => {
        isHovering = true;
    });
    
    testimonialContainer.addEventListener('mouseleave', () => {
        isHovering = false;
    });
    
    // Add keyboard navigation
    testimonialContainer.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            stopAutoSlide();
            const prevSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(prevSlide);
            startAutoSlide();
        } else if (e.key === 'ArrowRight') {
            stopAutoSlide();
            const nextSlide = (currentSlide + 1) % slides.length;
            showSlide(nextSlide);
            startAutoSlide();
        }
    });
    
    // Set appropriate ARIA attributes for accessibility
    testimonialContainer.setAttribute('aria-roledescription', 'carousel');
    testimonialContainer.setAttribute('aria-live', 'polite');
    
    slides.forEach((slide, index) => {
        slide.setAttribute('aria-roledescription', 'slide');
        slide.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
    });
    
    // Start auto-sliding
    startAutoSlide();
}

/**
 * Initialize smooth scrolling for anchor links with performance improvements
 */
function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Calculate target position with header offset
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
                
                // Use requestAnimationFrame for smoother scrolling
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                });
                
                // Update the URL hash without scrolling
                history.pushState(null, null, targetId);
            }
        });
    });
}

/**
 * Initialize the contact form with improved animation
 */
function initContactForm() {
    const contactForm = document.querySelector('#contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Basic validation
        const nameInput = contactForm.querySelector('#name');
        const emailInput = contactForm.querySelector('#email');
        const messageInput = contactForm.querySelector('#message');
        let isValid = true;
        
        if (!nameInput.value.trim()) {
            isValid = false;
            nameInput.classList.add('error');
        } else {
            nameInput.classList.remove('error');
        }
        
        if (!emailInput.value.trim() || !emailInput.value.includes('@')) {
            isValid = false;
            emailInput.classList.add('error');
        } else {
            emailInput.classList.remove('error');
        }
        
        if (!messageInput.value.trim()) {
            isValid = false;
            messageInput.classList.add('error');
        } else {
            messageInput.classList.remove('error');
        }
        
        if (!isValid) {
            const errorMessage = contactForm.querySelector('.error-message') ||
                               document.createElement('div');
            errorMessage.className = 'error-message animate';
            errorMessage.textContent = 'Please fill out all fields correctly.';
            
            if (!contactForm.querySelector('.error-message')) {
                contactForm.prepend(errorMessage);
            }
            
            // Remove animation class after transition
            setTimeout(() => {
                errorMessage.classList.remove('animate');
            }, 300);
            
            return;
        }
        
        // Get the submit button
        const submitButton = contactForm.querySelector('button[type="submit"]');
        
        // Show loading state
        if (submitButton) {
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
        
        // Simulate a network delay for demo purposes
        setTimeout(() => {
            // Create success message with animation
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message animate';
            successMessage.textContent = 'Thank you for your message! We will get back to you soon.';
            
            // Reset form
            contactForm.reset();
            
            // Replace form with success message
            contactForm.style.opacity = '0';
            contactForm.style.transform = 'translateY(20px)';
            contactForm.style.transition = 'opacity 300ms, transform 300ms';
            
            setTimeout(() => {
                contactForm.parentNode.insertBefore(successMessage, contactForm);
                contactForm.style.display = 'none';
                
                // Remove animation class after transition
                setTimeout(() => {
                    successMessage.classList.remove('animate');
                }, 300);
            }, 300);
            
        }, 1500); // Simulate network delay
    });
}

/**
 * Initialize animated sections using Intersection Observer
 */
function initAnimatedSections() {
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in, .feature-card, .hero-content, .cta-content');
    
    if (!animatedElements.length) return;
    
    // Add animate-on-scroll class to all elements that need animation
    animatedElements.forEach(element => {
        if (!element.classList.contains('animate-on-scroll')) {
            element.classList.add('animate-on-scroll');
        }
    });
    
    // Use Intersection Observer for better performance
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    entry.target.classList.add('animate-visible');
                    
                    // Remove observer after animation
                    setTimeout(() => {
                        entry.target.classList.remove('animate');
                        entry.target.classList.add('animation-done');
                        observer.unobserve(entry.target);
                    }, 1000);
                }
            });
        },
        { threshold: 0.1 }
    );
    
    // Observe each element
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Check auth status and update header buttons
 */
function checkAuthStatus() {
    // Check if Supabase is defined
    if (typeof supabase === 'undefined') {
        console.warn('Supabase client not found. Authentication status cannot be checked.');
        return;
    }
    
    // Get elements
    const loginButton = document.querySelector('.login-button');
    const signupButton = document.querySelector('.signup-button');
    const dashboardButton = document.querySelector('.dashboard-button');
    const logoutButton = document.querySelector('.logout-button');
    
    // Check if user is logged in
    const user = supabase.auth.user();
    
    if (user) {
        // User is logged in
        if (loginButton) loginButton.style.display = 'none';
        if (signupButton) signupButton.style.display = 'none';
        if (dashboardButton) dashboardButton.style.display = 'inline-block';
        if (logoutButton) {
            logoutButton.style.display = 'inline-block';
            
            // Add logout functionality
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                // Show loading state
                logoutButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                
                // Sign out
                try {
                    await supabase.auth.signOut();
                    window.location.href = '/index.html';
                } catch (error) {
                    console.error('Logout error:', error);
                }
            });
        }
    } else {
        // User is not logged in
        if (loginButton) loginButton.style.display = 'inline-block';
        if (signupButton) signupButton.style.display = 'inline-block';
        if (dashboardButton) dashboardButton.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'none';
    }
} 