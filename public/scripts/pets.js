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

// Initialize Supabase client
function initSupabase() {
    const SUPABASE_URL = window.SUPABASE_URL;
    const SUPABASE_KEY = window.SUPABASE_KEY;
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
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

// Preview edit pet image before upload
function previewEditPetImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const imgPreview = document.getElementById('edit-pet-image-preview');
        imgPreview.src = event.target.result;
        imgPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Handle adding a new pet
async function handleAddPet(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    submitBtn.disabled = true;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    const formData = new FormData(form);
    const petData = {
        name: formData.get('name'),
        type: formData.get('type'),
        breed: formData.get('breed'),
        age: formData.get('age'),
        weight: formData.get('weight'),
        notes: formData.get('notes'),
        user_id: user.id
    };
    
    // Handle image upload if provided
    const imageFile = formData.get('image');
    if (imageFile.size > 0) {
        const fileName = `pet_${user.id}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await window.supabase.storage
            .from('pet-images')
            .upload(fileName, imageFile);
        
        if (uploadError) {
            submitBtn.innerHTML = 'Add Pet';
            submitBtn.disabled = false;
            showToast('Error uploading image: ' + uploadError.message, 'error');
            return;
        }
        
        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = window.supabase.storage
            .from('pet-images')
            .getPublicUrl(fileName);
        
        petData.image_url = publicUrl;
    }
    
    // Insert the pet data
    const { data, error } = await window.supabase
        .from('pets')
        .insert([petData])
        .select();
    
    // Reset form state
    submitBtn.innerHTML = 'Add Pet';
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error adding pet: ' + error.message, 'error');
        return;
    }
    
    // Close modal and refresh list
    document.getElementById('add-pet-modal').classList.remove('active');
    showToast('Pet added successfully!', 'success');
    form.reset();
    document.getElementById('pet-image-preview').style.display = 'none';
    loadUserPets();
}

// Show modal for editing a pet
async function showEditPetModal(petId) {
    const { data: pet, error } = await window.supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();
    
    if (error) {
        showToast('Error loading pet: ' + error.message, 'error');
        return;
    }
    
    const modal = document.getElementById('edit-pet-modal');
    const form = modal.querySelector('form');
    
    // Reset form
    form.reset();
    form.dataset.petId = petId;
    
    // Set form values
    form.querySelector('#edit-pet-name').value = pet.name;
    form.querySelector('#edit-pet-type').value = pet.type;
    form.querySelector('#edit-pet-breed').value = pet.breed || '';
    form.querySelector('#edit-pet-age').value = pet.age || '';
    form.querySelector('#edit-pet-weight').value = pet.weight || '';
    form.querySelector('#edit-pet-notes').value = pet.notes || '';
    
    // Set image preview if available
    const imgPreview = document.getElementById('edit-pet-image-preview');
    if (pet.image_url) {
        imgPreview.src = pet.image_url;
        imgPreview.style.display = 'block';
    } else {
        imgPreview.style.display = 'none';
    }
    
    // Show modal
    modal.classList.add('active');
}

// Handle editing a pet
async function handleEditPet(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const petId = form.dataset.petId;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    const { data: { user } } = await window.supabase.auth.getUser();
    
    const formData = new FormData(form);
    const petData = {
        name: formData.get('name'),
        type: formData.get('type'),
        breed: formData.get('breed'),
        age: formData.get('age'),
        weight: formData.get('weight'),
        notes: formData.get('notes')
    };
    
    // Handle image upload if provided
    const imageFile = formData.get('image');
    if (imageFile.size > 0) {
        const fileName = `pet_${user.id}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await window.supabase.storage
            .from('pet-images')
            .upload(fileName, imageFile);
        
        if (uploadError) {
            submitBtn.innerHTML = 'Save Changes';
            submitBtn.disabled = false;
            showToast('Error uploading image: ' + uploadError.message, 'error');
            return;
        }
        
        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = window.supabase.storage
            .from('pet-images')
            .getPublicUrl(fileName);
        
        petData.image_url = publicUrl;
    }
    
    // Update the pet data
    const { error } = await window.supabase
        .from('pets')
        .update(petData)
        .eq('id', petId);
    
    // Reset form state
    submitBtn.innerHTML = 'Save Changes';
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error updating pet: ' + error.message, 'error');
        return;
    }
    
    // Close modal and refresh list
    document.getElementById('edit-pet-modal').classList.remove('active');
    showToast('Pet updated successfully!', 'success');
    loadUserPets();
}

// Confirm before deleting a pet
function confirmDeletePet(petId) {
    if (confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
        deletePet(petId);
    }
}

// Delete a pet
async function deletePet(petId) {
    showToast('Deleting pet...', 'info');
    
    // First get the pet to check if it has an image to delete
    const { data: pet, error: fetchError } = await window.supabase
        .from('pets')
        .select('image_url')
        .eq('id', petId)
        .single();
    
    if (fetchError) {
        showToast('Error fetching pet: ' + fetchError.message, 'error');
        return;
    }
    
    // Delete the pet
    const { error } = await window.supabase
        .from('pets')
        .delete()
        .eq('id', petId);
    
    if (error) {
        showToast('Error deleting pet: ' + error.message, 'error');
        return;
    }
    
    // If the pet had an image, delete it from storage
    if (pet.image_url) {
        // Extract the file name from the URL
        const urlParts = pet.image_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        const { error: storageError } = await window.supabase.storage
            .from('pet-images')
            .remove([fileName]);
        
        if (storageError) {
            console.error('Error deleting pet image:', storageError);
        }
    }
    
    showToast('Pet deleted successfully!', 'success');
    
    // Reload the pet list
    loadUserPets();
}

// Show modal for assigning a device to a pet
async function showAssignDeviceModal(petId) {
    const { data: { user } } = await window.supabase.auth.getUser();
    
    // Get the pet
    const { data: pet, error: petError } = await window.supabase
        .from('pets')
        .select('*')
        .eq('id', petId)
        .single();
    
    if (petError) {
        showToast('Error loading pet: ' + petError.message, 'error');
        return;
    }
    
    // Get available devices
    const { data: devices, error: devicesError } = await window.supabase
        .from('devices')
        .select('*')
        .eq('user_id', user.id);
    
    if (devicesError) {
        showToast('Error loading devices: ' + devicesError.message, 'error');
        return;
    }
    
    if (devices.length === 0) {
        showToast('You need to add a device first', 'info');
        return;
    }
    
    const modal = document.getElementById('assign-device-modal');
    const form = modal.querySelector('form');
    const deviceSelect = form.querySelector('#assign-device');
    
    // Reset form
    form.reset();
    form.dataset.petId = petId;
    
    // Update pet name in the modal
    modal.querySelector('.modal-title').textContent = `Assign Device to ${pet.name}`;
    
    // Clear previous options
    deviceSelect.innerHTML = '';
    
    // Add device options
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.id;
        option.textContent = device.name;
        deviceSelect.appendChild(option);
    });
    
    // If pet already has a device, select it
    if (pet.device_id) {
        const option = deviceSelect.querySelector(`option[value="${pet.device_id}"]`);
        if (option) {
            option.selected = true;
        }
    }
    
    // Add event listener for form submission
    form.onsubmit = handleAssignDevice;
    
    // Show modal
    modal.classList.add('active');
}

// Handle assigning a device to a pet
async function handleAssignDevice(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const petId = form.dataset.petId;
    const deviceId = form.querySelector('#assign-device').value;
    
    // Show loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Assigning...';
    submitBtn.disabled = true;
    
    // Update the pet with the device id
    const { error } = await window.supabase
        .from('pets')
        .update({ device_id: deviceId })
        .eq('id', petId);
    
    // Reset form state
    submitBtn.innerHTML = 'Assign Device';
    submitBtn.disabled = false;
    
    if (error) {
        showToast('Error assigning device: ' + error.message, 'error');
        return;
    }
    
    // Close modal and refresh list
    document.getElementById('assign-device-modal').classList.remove('active');
    showToast('Device assigned successfully!', 'success');
    loadUserPets();
}

// Helper functions
function showLoading(selector) {
    const container = document.querySelector(selector);
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
}

function hideLoading(selector) {
    const container = document.querySelector(selector);
    const spinner = container.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

function showError(selector, message) {
    const container = document.querySelector(selector);
    container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideToast(toast);
    }, 5000);
    
    // Add event listener for close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        hideToast(toast);
    });
}

function hideToast(toast) {
    toast.classList.remove('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
} 