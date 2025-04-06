// Supabase Configuration

// Initialize Supabase client
const supabaseUrl = window.appConfig ? window.appConfig.SUPABASE_URL : null;
const supabaseKey = window.appConfig ? window.appConfig.SUPABASE_ANON_KEY : null;

// Make sure we're using the correct Supabase client reference
const supabase = window.supabaseJs ? window.supabaseJs.createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
});

// Check if user is authenticated
async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
}

// Get current user
async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Sign up with email and password
async function signUp(email, password, username) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        });

        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error signing up:', error.message);
        return { data: null, error };
    }
}

// Sign in with email and password
async function signIn(email, password, rememberMe = false) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
            options: {
                persistSession: rememberMe
            }
        });

        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error signing in:', error.message);
        return { data: null, error };
    }
}

// Sign in with Google
async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/pages/dashboard.html`
            }
        });

        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error signing in with Google:', error.message);
        return { data: null, error };
    }
}

// Sign out
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        return { error: null };
    } catch (error) {
        console.error('Error signing out:', error.message);
        return { error };
    }
}

// Reset password
async function resetPassword(email) {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/pages/reset-password-confirm.html`
        });

        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error resetting password:', error.message);
        return { data: null, error };
    }
}

// Update user password
async function updatePassword(newPassword) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error updating password:', error.message);
        return { data: null, error };
    }
}

// Update user profile
async function updateProfile(updates) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error updating profile:', error.message);
        return { data: null, error };
    }
}

// Check if user has admin role
async function isAdmin() {
    try {
        const user = await getCurrentUser();
        
        if (!user) return false;
        
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
            
        if (error) throw error;
        
        return data.role === 'admin';
    } catch (error) {
        console.error('Error checking admin status:', error.message);
        return false;
    }
}

// Database Operations

// Get user's devices
async function getUserDevices() {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('devices')
            .select('*')
            .eq('user_id', user.id);
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching devices:', error.message);
        return { data: null, error };
    }
}

// Add new device
async function addDevice(deviceData) {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('devices')
            .insert([{ ...deviceData, user_id: user.id }])
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error adding device:', error.message);
        return { data: null, error };
    }
}

// Update device
async function updateDevice(deviceId, updates) {
    try {
        const { data, error } = await supabase
            .from('devices')
            .update(updates)
            .eq('id', deviceId)
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error updating device:', error.message);
        return { data: null, error };
    }
}

// Delete device
async function deleteDevice(deviceId) {
    try {
        const { error } = await supabase
            .from('devices')
            .delete()
            .eq('id', deviceId);
            
        if (error) throw error;
        
        return { error: null };
    } catch (error) {
        console.error('Error deleting device:', error.message);
        return { error };
    }
}

// Get user's pets
async function getUserPets() {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('user_id', user.id);
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching pets:', error.message);
        return { data: null, error };
    }
}

// Add new pet
async function addPet(petData) {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('pets')
            .insert([{ ...petData, user_id: user.id }])
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error adding pet:', error.message);
        return { data: null, error };
    }
}

// Update pet
async function updatePet(petId, updates) {
    try {
        const { data, error } = await supabase
            .from('pets')
            .update(updates)
            .eq('id', petId)
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error updating pet:', error.message);
        return { data: null, error };
    }
}

// Delete pet
async function deletePet(petId) {
    try {
        const { error } = await supabase
            .from('pets')
            .delete()
            .eq('id', petId);
            
        if (error) throw error;
        
        return { error: null };
    } catch (error) {
        console.error('Error deleting pet:', error.message);
        return { error };
    }
}

// Get user's feeding schedules
async function getFeedingSchedules() {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('feeding_schedules')
            .select('*, devices(*), pets(*)')
            .eq('user_id', user.id)
            .order('scheduled_time', { ascending: true });
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching feeding schedules:', error.message);
        return { data: null, error };
    }
}

// Add new feeding schedule
async function addFeedingSchedule(scheduleData) {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('feeding_schedules')
            .insert([{ ...scheduleData, user_id: user.id }])
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error adding feeding schedule:', error.message);
        return { data: null, error };
    }
}

// Update feeding schedule
async function updateFeedingSchedule(scheduleId, updates) {
    try {
        const { data, error } = await supabase
            .from('feeding_schedules')
            .update(updates)
            .eq('id', scheduleId)
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error updating feeding schedule:', error.message);
        return { data: null, error };
    }
}

// Delete feeding schedule
async function deleteFeedingSchedule(scheduleId) {
    try {
        const { error } = await supabase
            .from('feeding_schedules')
            .delete()
            .eq('id', scheduleId);
            
        if (error) throw error;
        
        return { error: null };
    } catch (error) {
        console.error('Error deleting feeding schedule:', error.message);
        return { error };
    }
}

// Get user's feeding history
async function getFeedingHistory(limit = 20, offset = 0) {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        const { data, error } = await supabase
            .from('feeding_history')
            .select('*, devices(*), pets(*)')
            .eq('user_id', user.id)
            .order('feeding_time', { ascending: false })
            .range(offset, offset + limit - 1);
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching feeding history:', error.message);
        return { data: null, error };
    }
}

// Manual feeding
async function manualFeeding(deviceId, petId, portionSize) {
    try {
        const user = await getCurrentUser();
        
        if (!user) throw new Error('User not authenticated');
        
        // First log the feeding action
        const { data, error } = await supabase
            .from('feeding_history')
            .insert([{
                device_id: deviceId,
                pet_id: petId,
                user_id: user.id,
                portion_size: portionSize,
                feeding_time: new Date().toISOString(),
                feeding_type: 'manual',
                status: 'success'
            }])
            .select();
            
        if (error) throw error;
        
        // Then trigger device feeding via Supabase Function or other mechanism
        // This would typically involve a separate API call or realtime event
        // to the actual feeding device
        
        return { data, error: null };
    } catch (error) {
        console.error('Error triggering manual feeding:', error.message);
        return { data: null, error };
    }
}

// Admin functions

// Get all users (admin only)
async function getAllUsers() {
    try {
        const isUserAdmin = await isAdmin();
        
        if (!isUserAdmin) throw new Error('Unauthorized: Admin access required');
        
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error fetching users:', error.message);
        return { data: null, error };
    }
}

// Update user role (admin only)
async function updateUserRole(userId, newRole) {
    try {
        const isUserAdmin = await isAdmin();
        
        if (!isUserAdmin) throw new Error('Unauthorized: Admin access required');
        
        const { data, error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)
            .select();
            
        if (error) throw error;
        
        return { data, error: null };
    } catch (error) {
        console.error('Error updating user role:', error.message);
        return { data: null, error };
    }
}

// Make functions available globally
window.supabaseAuth = {
    isAuthenticated,
    getCurrentUser,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile
};