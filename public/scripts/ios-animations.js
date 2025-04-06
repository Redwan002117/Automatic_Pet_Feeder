/**
 * iOS-style animations for Automatic Pet Feeder web app
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animation observer
    initScrollAnimations();
    
    // Initialize iOS-style interaction effects
    initInteractionEffects();
    
    // Initialize header effects
    initHeaderEffects();
    
    // Initialize FAQ accordions
    initFAQAccordions();
    
    // Initialize testimonial slider
    initTestimonialSlider();
    
    // Initialize mobile menu
    initMobileMenu();
});

// Function to initialize scroll-based animations
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.ios-animate');
    
    // Create intersection observer for scroll animations
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Start observing elements
        animatedElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        animatedElements.forEach(element => {
            element.classList.add('animated');
        });
    }
}

// Function to initialize iOS-style interaction effects
function initInteractionEffects() {
    // Add tap/active state to buttons
    const interactiveElements = document.querySelectorAll(
        '.ios-button, .ios-card, .ios-feature-card, .ios-nav-link, .ios-pricing-card'
    );
    
    interactiveElements.forEach(element => {
        // Touch start - scale down slightly
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.97)';
            this.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
            
            // Add haptic feedback if available
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(5);
            }
        }, { passive: true });
        
        // Touch end - scale back to normal
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        }, { passive: true });
        
        // Mouse interactions for desktop
        element.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.97)';
            this.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
        });
        
        element.addEventListener('mouseup', function() {
            this.style.transform = '';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Smooth scroll with iOS-like easing
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Add small haptic feedback
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(5);
                }
            }
        });
    });
}

// Function to initialize header effects
function initHeaderEffects() {
    const header = document.querySelector('.ios-header');
    
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
}

// Function to initialize FAQ accordions
function initFAQAccordions() {
    const faqItems = document.querySelectorAll('.ios-faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.ios-faq-question');
        const answer = item.querySelector('.ios-faq-answer');
        
        if (question && answer) {
            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');
                
                // Close all other FAQs
                faqItems.forEach(faqItem => {
                    if (faqItem !== item) {
                        faqItem.classList.remove('active');
                    }
                });
                
                // Toggle current FAQ
                item.classList.toggle('active');
                
                // Add haptic feedback
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(5);
                }
            });
        }
    });
}

// Function to initialize testimonial slider
function initTestimonialSlider() {
    const testimonialSlides = document.querySelectorAll('.ios-testimonial-slide');
    const testimonialDots = document.querySelectorAll('.ios-testimonial-dot');
    
    if (testimonialSlides.length > 0 && testimonialDots.length > 0) {
        let currentSlide = 0;
        
        // Function to show a specific slide
        function showSlide(index) {
            testimonialSlides.forEach(slide => slide.classList.remove('active'));
            testimonialDots.forEach(dot => dot.classList.remove('active'));
            
            testimonialSlides[index].classList.add('active');
            testimonialDots[index].classList.add('active');
            currentSlide = index;
        }
        
        // Add click event to dots
        testimonialDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                
                // Add haptic feedback
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(5);
                }
            });
        });
        
        // Auto-rotate slides every 5 seconds
        setInterval(() => {
            let nextSlide = currentSlide + 1;
            if (nextSlide >= testimonialSlides.length) {
                nextSlide = 0;
            }
            showSlide(nextSlide);
        }, 5000);
    }
}

// Function to initialize mobile menu
function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuClose = document.querySelector('.mobile-menu-close');
    
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.classList.add('menu-open');
            
            // Add haptic feedback if available
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
        });
        
        // Close menu when clicking on close button
        if (menuClose) {
            menuClose.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                // Add haptic feedback if available
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(10);
                }
            });
        }
        
        // Close menu when clicking on menu links
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }
}

// Modal handling for iOS-style presentation
function initModals() {
    // Modal triggers
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modalCloseButtons = document.querySelectorAll('.ios-modal-close');
    
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                modal.classList.add('visible');
                document.body.classList.add('modal-open');
                
                // Add haptic feedback
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(10);
                }
            }
        });
    });
    
    // Close button handlers
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.ios-modal');
            closeModal(modal);
        });
    });
    
    // Close when clicking outside the modal content
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('ios-modal')) {
            closeModal(e.target);
        }
    });
    
    // Close with escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const visibleModal = document.querySelector('.ios-modal.visible');
            if (visibleModal) {
                closeModal(visibleModal);
            }
        }
    });
    
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('visible');
            document.body.classList.remove('modal-open');
            
            // Add haptic feedback
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(5);
            }
        }
    }
}

// Initialize iOS segmented controls
function initSegmentedControls() {
    const segmentControls = document.querySelectorAll('.ios-segmented-control');
    
    segmentControls.forEach(control => {
        const segments = control.querySelectorAll('.ios-segment');
        const slider = control.querySelector('.ios-segment-slider');
        
        segments.forEach((segment, index) => {
            segment.addEventListener('click', () => {
                // Remove active class from all segments
                segments.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked segment
                segment.classList.add('active');
                
                // Move the slider
                if (slider) {
                    slider.style.width = `${segment.offsetWidth}px`;
                    slider.style.transform = `translateX(${segment.offsetLeft}px)`;
                }
                
                // Add haptic feedback
                if (window.navigator && window.navigator.vibrate) {
                    window.navigator.vibrate(5);
                }
                
                // Trigger any associated content changes
                const targetId = segment.getAttribute('data-target');
                if (targetId) {
                    const targetContents = document.querySelectorAll('.ios-segment-content');
                    targetContents.forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    const activeContent = document.getElementById(targetId);
                    if (activeContent) {
                        activeContent.classList.add('active');
                    }
                }
            });
        });
        
        // Initialize the slider position
        if (slider && segments.length > 0) {
            const activeSegment = control.querySelector('.ios-segment.active') || segments[0];
            slider.style.width = `${activeSegment.offsetWidth}px`;
            slider.style.transform = `translateX(${activeSegment.offsetLeft}px)`;
        }
    });
}

// Toggle iOS switches
function initSwitches() {
    const iosSwitches = document.querySelectorAll('.ios-switch');
    
    iosSwitches.forEach(switchEl => {
        switchEl.addEventListener('change', function() {
            // Add haptic feedback
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(10);
            }
            
            // Trigger any associated actions
            const targetId = this.getAttribute('data-target');
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    if (this.checked) {
                        targetElement.classList.add('active');
                    } else {
                        targetElement.classList.remove('active');
                    }
                }
            }
        });
    });
}

// Export helpers for external use
window.iosUI = {
    initScrollAnimations,
    initInteractionEffects,
    initHeaderEffects,
    initFAQAccordions,
    initTestimonialSlider,
    initMobileMenu,
    initModals,
    initSegmentedControls,
    initSwitches
};
