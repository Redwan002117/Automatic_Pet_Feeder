-- Supabase schema for Automatic Pet Feeder application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table to store user profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  verification_sent_at TIMESTAMP WITH TIME ZONE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profiles
CREATE POLICY "Users can view their own profiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Create policy to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to update their own profiles
CREATE POLICY "Users can update their own profiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to insert their own profiles
CREATE POLICY "Users can insert their own profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy to allow admins to insert profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Devices table to store pet feeder devices
CREATE TABLE public.devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  device_id TEXT UNIQUE NOT NULL,
  model TEXT,
  firmware_version TEXT,
  status TEXT DEFAULT 'offline',
  last_connected TIMESTAMP WITH TIME ZONE,
  food_level INTEGER DEFAULT 0,
  battery_level INTEGER DEFAULT 100,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security for devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own devices
CREATE POLICY "Users can view their own devices" ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow admins to view all devices
CREATE POLICY "Admins can view all devices" ON public.devices
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to update their own devices
CREATE POLICY "Users can update their own devices" ON public.devices
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow admins to update all devices
CREATE POLICY "Admins can update all devices" ON public.devices
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to insert their own devices
CREATE POLICY "Users can insert their own devices" ON public.devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow admins to insert devices
CREATE POLICY "Admins can insert devices" ON public.devices
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to delete their own devices
CREATE POLICY "Users can delete their own devices" ON public.devices
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow admins to delete any device
CREATE POLICY "Admins can delete any device" ON public.devices
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Pets table to store pet information
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  species TEXT,
  breed TEXT,
  weight DECIMAL,
  weight_unit TEXT DEFAULT 'lbs',
  age INTEGER,
  gender TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security for pets
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own pets
CREATE POLICY "Users can view their own pets" ON public.pets
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow admins to view all pets
CREATE POLICY "Admins can view all pets" ON public.pets
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to update their own pets
CREATE POLICY "Users can update their own pets" ON public.pets
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow admins to update all pets
CREATE POLICY "Admins can update all pets" ON public.pets
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to insert their own pets
CREATE POLICY "Users can insert their own pets" ON public.pets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow admins to insert pets
CREATE POLICY "Admins can insert pets" ON public.pets
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to delete their own pets
CREATE POLICY "Users can delete their own pets" ON public.pets
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow admins to delete any pet
CREATE POLICY "Admins can delete any pet" ON public.pets
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Feeding schedules table
CREATE TABLE public.feeding_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.devices NOT NULL,
  pet_id UUID REFERENCES public.pets,
  name TEXT,
  amount DECIMAL NOT NULL,
  unit TEXT DEFAULT 'cups',
  time_of_day TIME NOT NULL,
  days TEXT[], -- Array of days of the week ['monday', 'tuesday', etc.]
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security for feeding schedules
ALTER TABLE public.feeding_schedules ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own feeding schedules
CREATE POLICY "Users can view their own feeding schedules" ON public.feeding_schedules
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow admins to view all feeding schedules
CREATE POLICY "Admins can view all feeding schedules" ON public.feeding_schedules
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to update their own feeding schedules
CREATE POLICY "Users can update their own feeding schedules" ON public.feeding_schedules
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow admins to update all feeding schedules
CREATE POLICY "Admins can update all feeding schedules" ON public.feeding_schedules
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to insert their own feeding schedules
CREATE POLICY "Users can insert their own feeding schedules" ON public.feeding_schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow admins to insert feeding schedules
CREATE POLICY "Admins can insert feeding schedules" ON public.feeding_schedules
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to delete their own feeding schedules
CREATE POLICY "Users can delete their own feeding schedules" ON public.feeding_schedules
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow admins to delete any feeding schedule
CREATE POLICY "Admins can delete any feeding schedule" ON public.feeding_schedules
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Feeding events table
CREATE TABLE public.feeding_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  device_id UUID REFERENCES public.devices NOT NULL,
  pet_id UUID REFERENCES public.pets,
  schedule_id UUID REFERENCES public.feeding_schedules,
  amount DECIMAL NOT NULL,
  unit TEXT DEFAULT 'cups',
  status TEXT DEFAULT 'completed',
  fed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security for feeding events
ALTER TABLE public.feeding_events ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own feeding events
CREATE POLICY "Users can view their own feeding events" ON public.feeding_events
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow admins to view all feeding events
CREATE POLICY "Admins can view all feeding events" ON public.feeding_events
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to insert their own feeding events
CREATE POLICY "Users can insert their own feeding events" ON public.feeding_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow admins to insert feeding events
CREATE POLICY "Admins can insert feeding events" ON public.feeding_events
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to update their own feeding events
CREATE POLICY "Users can update their own feeding events" ON public.feeding_events
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow admins to update all feeding events
CREATE POLICY "Admins can update all feeding events" ON public.feeding_events
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to delete their own feeding events
CREATE POLICY "Users can delete their own feeding events" ON public.feeding_events
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow admins to delete any feeding event
CREATE POLICY "Admins can delete any feeding event" ON public.feeding_events
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow admins to view all notifications
CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to update their own notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow admins to update all notifications
CREATE POLICY "Admins can update all notifications" ON public.notifications
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create policy to allow admins to delete any notification
CREATE POLICY "Admins can delete any notification" ON public.notifications
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow admins to insert notifications for any user
CREATE POLICY "Admins can insert notifications for any user" ON public.notifications
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create policy to allow users to insert notifications for themselves
CREATE POLICY "Users can insert their own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create a user profile after sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Handle potential errors during profile creation
  BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url, email, role, is_verified)
    VALUES (
      NEW.id,
      split_part(NEW.email, '@', 1),
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.email,
      CASE 
        WHEN NEW.email = 'petfeeder@redwancodes.com' THEN 'admin'
        WHEN NEW.email LIKE '%@redwancodes.com' THEN 'admin'
        WHEN NEW.email LIKE '%@admin.petfeeder.com' THEN 'admin'
        ELSE 'user' 
      END,
      CASE 
        WHEN NEW.email = 'petfeeder@redwancodes.com' THEN TRUE
        WHEN NEW.email LIKE '%@redwancodes.com' THEN TRUE
        WHEN NEW.email LIKE '%@admin.petfeeder.com' THEN TRUE
        ELSE FALSE 
      END
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create a user profile after signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create policy to allow the system to create profiles during signup
CREATE POLICY "System can create profiles during signup" ON public.profiles
  FOR INSERT WITH CHECK (TRUE);

-- Create policy to allow the system to read all profiles
CREATE POLICY "System can read all profiles" ON public.profiles
  FOR SELECT USING (TRUE);

-- Create view for upcoming feedings
CREATE VIEW public.upcoming_feedings AS
SELECT 
  s.id,
  s.user_id,
  s.device_id,
  s.pet_id,
  s.name,
  s.amount,
  s.unit,
  s.time_of_day,
  d.name as device_name,
  p.name as pet_name,
  p.photo_url as pet_photo
FROM 
  public.feeding_schedules s
  LEFT JOIN public.devices d ON s.device_id = d.id
  LEFT JOIN public.pets p ON s.pet_id = p.id
WHERE 
  s.is_active = TRUE;

-- Create indexes for better performance
-- Profiles indexes
CREATE INDEX idx_profiles_id ON public.profiles(id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Devices indexes
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_device_id ON public.devices(device_id);
CREATE INDEX idx_devices_status ON public.devices(status);

-- Pets indexes
CREATE INDEX idx_pets_user_id ON public.pets(user_id);
CREATE INDEX idx_pets_name ON public.pets(name);

-- Feeding schedules indexes
CREATE INDEX idx_feeding_schedules_user_id ON public.feeding_schedules(user_id);
CREATE INDEX idx_feeding_schedules_device_id ON public.feeding_schedules(device_id);
CREATE INDEX idx_feeding_schedules_pet_id ON public.feeding_schedules(pet_id);
CREATE INDEX idx_feeding_schedules_is_active ON public.feeding_schedules(is_active);
CREATE INDEX idx_feeding_schedules_time_of_day ON public.feeding_schedules(time_of_day);

-- Feeding events indexes
CREATE INDEX idx_feeding_events_user_id ON public.feeding_events(user_id);
CREATE INDEX idx_feeding_events_device_id ON public.feeding_events(device_id);
CREATE INDEX idx_feeding_events_pet_id ON public.feeding_events(pet_id);
CREATE INDEX idx_feeding_events_schedule_id ON public.feeding_events(schedule_id);
CREATE INDEX idx_feeding_events_fed_at ON public.feeding_events(fed_at);
CREATE INDEX idx_feeding_events_status ON public.feeding_events(status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX idx_notifications_related_id ON public.notifications(related_id);
CREATE INDEX idx_notifications_related_type ON public.notifications(related_type);