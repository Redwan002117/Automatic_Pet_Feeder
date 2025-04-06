/**
 * Provides fallbacks for missing images
 */

// When the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Find all profile images
  const profileImages = document.querySelectorAll('img[src*="profile-placeholder.jpg"]');
  
  // Apply fallback for each profile image
  profileImages.forEach(img => {
    img.onerror = function() {
      this.onerror = null; // Prevent infinite loop
      this.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2UyZTJlMiIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOCA1LjMxIDggMTIgMCAxLjA0LS4xNiAyLjA0LS40NSAyLjk1LS4zMy0uOTQtLjg2LTEuNzYtMS41NS0yLjQ1TDE0IDEzLjU0Yy0xLjIzLTEuMjMtMy41Ny0xLjU0LTUuMDQtMS4wOXYtLjA5YzAtMS43OCAyLjAyLTMuMTUgMi43Ni0zLjE1LjU4IDAgMS43OC41OSAyLjE2IDEuNTQgMS4yMS0uNTEgMi40MS0uODkgMy40My0uODkuMzcgMCAuNjYuMzMuNjYuNzQgMCAyLjItMy4wMSA1LjgtNS4wNiA1LjgtLjcyIDAtMS43My0uOTEtMS45My0xLjQ1LTMuMDYgMS4xLTMuNjEgMy42MS00LjA2IDUuMTRDNC4yOSAyMS4zIDIuOCAxNi4wNiA0LjQgMTEuMDYgNC45NCA4Ljg5IDggNSAxMiA1eiIvPjwvc3ZnPg==';
      this.alt = 'Profile placeholder';
    };
    
    // Try setting the source again to trigger the error handler for already failed images
    const currentSrc = img.src;
    img.src = '';
    img.src = currentSrc;
  });
  
  // Find all pet images
  const petImages = document.querySelectorAll('.pet-image');
  
  // Apply fallback for each pet image
  petImages.forEach(img => {
    img.onerror = function() {
      this.onerror = null; // Prevent infinite loop
      
      // Create a fallback element to replace the image
      const container = this.parentElement;
      const fallback = document.createElement('div');
      fallback.className = 'pet-image-fallback';
      fallback.innerHTML = '<i class="fas fa-paw"></i>';
      
      // Replace the image with the fallback
      if (container) {
        container.replaceChild(fallback, this);
      }
    };
    
    // Try setting the source again to trigger the error handler for already failed images
    if (img.complete && img.naturalHeight === 0) {
      img.onerror();
    }
  });
});
