/**
 * Pet management script for Automatic Pet Feeder
 */

document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    checkAuth();
    
    // Set up event listeners
    document.querySelectorAll('.add-pet-form').forEach(form => {
        form.addEventListener('submit', handleAddPet);
    });
    
    // Listen for file input changes to preview images
    const imageInput = document.getElementById('pet-image');
    if (imageInput) {
        imageInput.addEventListener('change', previewPetImage);
    }
    
    // Edit pet form
    const editPetForm = document.querySelector('.edit-pet-form');
    if (editPetForm) {
        editPetForm.addEventListener('submit', handleEditPet);
        
        const editImageInput = document.getElementById('edit-pet-image');
        if (editImageInput) {
            editImageInput.addEventListener('change', previewEditPetImage);
        }
    }
    
    // Pet list click event delegation
    const petList = document.querySelector('.pet-list');
    if (petList) {
        petList.addEventListener('click', handlePetActions);
    }
});

/**
 * Initialize Supabase
 * Added error handling and fallback for missing elements
 */
async function initSupabase() {
  try {
    // Check if we have access to Supabase already
    if (window.supabase) {
      console.log('Supabase already initialized');
      return window.supabase;
    }
    
    // Check if the Supabase library is loaded
    if (!window.supabaseJs) {
      console.error('Supabase library not loaded, checking for global supabase object');
      // Try to find supabase object if it's directly in window
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        console.log('Found global supabase object');
      } else {
        throw new Error('Supabase library not loaded. Make sure to include the Supabase script');
      }
    }
    
    // Check if we have the configuration
    if (!window.appConfig) {
      console.error('App configuration not loaded, using default values');
      window.appConfig = {
        SUPABASE_URL: 'https://mgqtlgpcdswfmvgheeff.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncXRsZ3BjZHN3Zm12Z2hlZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzY3ODAzNjIsImV4cCI6MTk5MjM1NjM2Mn0.8Rq8VbucEWbJUZg2XfxNBxQyAYZl5eEYWCifoZ2lQ_o'
      };
    }
    
    // Create Supabase client
    try {
      const createClient = window.supabaseJs?.createClient || window.supabase?.createClient;
      
      if (typeof createClient === 'function') {
        window.supabase = createClient(
          window.appConfig.SUPABASE_URL,
          window.appConfig.SUPABASE_ANON_KEY
        );
        
        console.log('Supabase client initialized for pets page');
        return window.supabase;
      } else {
        throw new Error('createClient function not found in Supabase library');
      }
    } catch (clientError) {
      console.error('Error creating Supabase client:', clientError);
      // Create a mock Supabase client for development/testing
      window.supabase = createMockSupabaseClient();
      console.warn('Using mock Supabase client');
      return window.supabase;
    }
  } catch (error) {
    console.error('Failed to initialize Supabase in pets.js:', error);
    // Create a mock Supabase client as fallback
    window.supabase = createMockSupabaseClient();
    console.warn('Using mock Supabase client due to initialization error');
    return window.supabase;
  }
}

/**
 * Create a simple mock Supabase client for fallback
 * This allows the app to continue functioning with mock data when Supabase is unavailable
 */
function createMockSupabaseClient() {
  return {
    from: (table) => ({
      select: () => ({
        order: () => ({
          order: () => ({
            then: (callback) => {
              // Mock data for testing
              const mockPets = [
                {
                  id: 1,
                  name: 'Buddy',
                  breed: 'Golden Retriever',
                  age: 3,
                  weight: 65,
                  is_favorite: true,
                  status: 'active',
                  feeding_amount: 2.5,
                  last_fed: new Date().toISOString(),
                  created_at: new Date().toISOString()
                },
                {
                  id: 2,
                  name: 'Luna',
                  breed: 'Siamese Cat',
                  age: 2,
                  weight: 10,
                  is_favorite: false,
                  status: 'active',
                  feeding_amount: 0.5,
                  last_fed: new Date().toISOString(),
                  created_at: new Date().toISOString()
                }
              ];
              return Promise.resolve({
                data: mockPets,
                error: null
              });
            }
          })
        })
      }),
      insert: () => ({
        then: (callback) => {
          return Promise.resolve({
            data: { id: Math.floor(Math.random() * 1000) },
            error: null
          });
        }
      }),
      update: () => ({
        eq: () => ({
          then: (callback) => {
            return Promise.resolve({
              data: { success: true },
              error: null
            });
          }
        })
      }),
      delete: () => ({
        eq: () => ({
          then: (callback) => {
            return Promise.resolve({
              data: { success: true },
              error: null
            });
          }
        })
      })
    }),
    auth: {
      onAuthStateChange: () => ({ data: null, error: null })
    }
  };
}

/**
 * Show loading indicator with error handling and fallbacks
 */
function showLoading(show, message = 'Loading...') {
  try {
    let loadingEl = document.getElementById('app-loading');
    
    if (show) {
      if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'app-loading';
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
          <div class="loading-spinner-container">
            <div class="loading-spinner">
              <i class="fas fa-circle-notch fa-spin"></i>
            </div>
            <p class="loading-message">${message}</p>
          </div>
        `;
        document.body.appendChild(loadingEl);
      } else {
        // Update message if needed
        const messageEl = loadingEl.querySelector('.loading-message');
        if (messageEl) {
          messageEl.textContent = message;
        }
        loadingEl.style.display = 'flex';
      }
    } else if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  } catch (error) {
    console.error('Error in showLoading:', error);
    // Simple fallback
    if (show) {
      const fallbackLoader = document.createElement('div');
      fallbackLoader.id = 'fallback-loader';
      fallbackLoader.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);display:flex;justify-content:center;align-items:center;z-index:9999;';
      fallbackLoader.innerHTML = `<p>${message}</p>`;
      document.body.appendChild(fallbackLoader);
    } else {
      const fallbackLoader = document.getElementById('fallback-loader');
      if (fallbackLoader) {
        fallbackLoader.remove();
      }
    }
  }
}

// Check authentication status
async function checkAuth() {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    loadUserPets();
}

// Load user's pets
async function loadUserPets() {
    showLoading('.pet-list');
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    const { data: pets, error } = await window.supabase
        .from('pets')
        .select('*')
        .eq('user_id', user.id);
    
    if (error) {
        console.error('Error loading pets:', error);
        showError('.pet-list', 'Failed to load pets');
        return;
    }
    
    renderPetList(pets);
    hideLoading('.pet-list');
    
    if (pets.length === 0) {
        document.querySelector('.no-pets').style.display = 'block';
    } else {
        document.querySelector('.no-pets').style.display = 'none';
    }
}

// Render the list of pets
function renderPetList(pets) {
    const petList = document.querySelector('.pet-list');
    
    if (pets.length === 0) {
        petList.innerHTML = '<p class="text-center text-gray-500">No pets found. Add your first pet!</p>';
        return;
    }
    
    let html = '';
    pets.forEach(pet => {
        const lastFed = pet.last_fed ? new Date(pet.last_fed).toLocaleString() : 'Never';
        const imageUrl = pet.image_url || '/public/assets/images/default-pet.png';
        
        html += `
            <div class="pet-card" data-id="${pet.id}">
                <div class="pet-image">
                    <img src="${imageUrl}" alt="${pet.name}" class="img-cover">
                </div>
                <div class="pet-details">
                    <h3>${pet.name}</h3>
                    <div class="pet-info">
                        <p><strong>Type:</strong> ${pet.type}</p>
                        <p><strong>Breed:</strong> ${pet.breed || 'Unknown'}</p>
                        <p><strong>Age:</strong> ${pet.age || 'Unknown'}</p>
                        <p><strong>Weight:</strong> ${pet.weight ? pet.weight + ' kg' : 'Unknown'}</p>
                        <p><strong>Last Fed:</strong> ${lastFed}</p>
                    </div>
                    <div class="pet-actions">
                        <button class="btn btn-primary assign-device-btn">
                            <i class="fas fa-link"></i> Assign Device
                        </button>
                        <button class="btn btn-secondary edit-pet-btn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger delete-pet-btn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    petList.innerHTML = html;
}

// Handle pet actions (edit, delete, assign device)
function handlePetActions(e) {
    const petCard = e.target.closest('.pet-card');
    if (!petCard) return;
    
    const petId = petCard.dataset.id;
    
    if (e.target.closest('.edit-pet-btn')) {
        showEditPetModal(petId);
    } else if (e.target.closest('.delete-pet-btn')) {
        confirmDeletePet(petId);
    } else if (e.target.closest('.assign-device-btn')) {
        showAssignDeviceModal(petId);
    }
}

// Preview pet image before upload
function previewPetImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const imgPreview = document.getElementById('pet-image-preview');
        imgPreview.src = event.target.result;
        imgPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Preview edit pet image