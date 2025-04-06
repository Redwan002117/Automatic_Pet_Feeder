/**
 * Landing page specific JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize landing page components
  initAccordion();
  initTestimonialSlider();
  setupContactForm();
  setupNewsletterForm();
});

/**
 * Initialize accordion for FAQ section
 */
function initAccordion() {
  const accordionItems = document.querySelectorAll('.faq-item');
  
  accordionItems.forEach(item => {
    const header = item.querySelector('.faq-question');
    const icon = header.querySelector('.faq-toggle i');
    const content = item.querySelector('.faq-answer');
    
    // Add initial height of 0 to closed items
    if (!item.classList.contains('active')) {
      content.style.height = '0px';
      content.style.opacity = '0';
    } else {
      content.style.height = content.scrollHeight + 'px';
      content.style.opacity = '1';
    }
    
    header.addEventListener('click', () => {
      // Close other items
      accordionItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const otherIcon = otherItem.querySelector('.faq-toggle i');
          const otherContent = otherItem.querySelector('.faq-answer');
          
          otherIcon.className = 'fas fa-plus';
          otherContent.style.height = '0px';
          otherContent.style.opacity = '0';
        }
      });
      
      // Toggle current item
      const isActive = item.classList.contains('active');
      
      if (isActive) {
        content.style.height = '0px';
        content.style.opacity = '0';
        item.classList.remove('active');
        icon.className = 'fas fa-plus';
      } else {
        content.style.height = content.scrollHeight + 'px';
        content.style.opacity = '1';
        item.classList.add('active');
        icon.className = 'fas fa-minus';
      }
    });
  });
}

/**
 * Initialize testimonial slider
 */
function initTestimonialSlider() {
  const slides = document.querySelectorAll('.testimonial-slide');
  const indicators = document.querySelectorAll('.testimonial-indicator');
  const prevBtn = document.querySelector('.testimonial-prev');
  const nextBtn = document.querySelector('.testimonial-next');
  
  if (!slides.length) return;
  
  let currentIndex = 0;
  
  function showSlide(index) {
    // Hide all slides
    slides.forEach(slide => {
      slide.classList.remove('active');
      slide.style.opacity = '0';
      slide.style.transform = 'translateX(20px)';
    });
    
    // Deactivate all indicators
    indicators.forEach(indicator => {
      indicator.classList.remove('active');
    });
    
    // Show active slide with animation
    slides[index].classList.add('active');
    slides[index].style.opacity = '1';
    slides[index].style.transform = 'translateX(0)';
    
    // Activate corresponding indicator
    indicators[index].classList.add('active');
    
    currentIndex = index;
  }
  
  // Initialize first slide
  showSlide(currentIndex);
  
  // Event listeners for next/prev buttons
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= slides.length) nextIndex = 0;
      showSlide(nextIndex);
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = slides.length - 1;
      showSlide(prevIndex);
    });
  }
  
  // Event listeners for indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      showSlide(index);
    });
  });
  
  // Auto advance slides
  setInterval(() => {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= slides.length) nextIndex = 0;
    showSlide(nextIndex);
  }, 5000);
}

/**
 * Setup contact form submission
 */
function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');
    
    // Simple validation
    if (!name || !email || !subject || !message) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    // Show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    // Simulate form submission (replace with actual API call)
    try {
      // In a real app, you would send this data to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
      
      // Reset form
      contactForm.reset();
      
    } catch (error) {
      showToast('Failed to send message. Please try again later.', 'error');
    } finally {
      // Restore button state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

/**
 * Setup newsletter form submission
 */
function setupNewsletterForm() {
  const newsletterForm = document.querySelector('.newsletter-form');
  
  if (!newsletterForm) return;
  
  newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get email
    const email = newsletterForm.querySelector('input[type="email"]').value;
    
    // Simple validation
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }
    
    // Show loading state
    const submitButton = newsletterForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Simulate subscription (replace with actual API call)
    try {
      // In a real app, you would send this data to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      showToast('Thanks for subscribing to our newsletter!', 'success');
      
      // Reset form
      newsletterForm.reset();
      
    } catch (error) {
      showToast('Failed to subscribe. Please try again later.', 'error');
    } finally {
      // Restore button state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 */
function showToast(message, type = 'info') {
  // Use utility function if available
  if (typeof window.utils !== 'undefined' && typeof window.utils.showToast === 'function') {
    window.utils.showToast(message, type);
    return;
  }
  
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Add icon based on type
  let icon;
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  // Create toast content
  toast.innerHTML = `
    <div class="toast-content">
      ${icon}
      <span>${message}</span>
    </div>
    <button class="toast-close" aria-label="Close notification">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toast);
  
  // Add close event listener
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toast));
  
  // Automatically dismiss after duration
  setTimeout(() => dismissToast(toast), 5000);
}

/**
 * Dismiss a toast notification
 * @param {HTMLElement} toast - Toast element to dismiss
 */
function dismissToast(toast) {
  toast.classList.add('toast-hiding');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 300);
}