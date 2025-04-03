-- Supabase SQL Schema for Automatic Pet Feeder Application

-- Enable PostgreSQL extensions
create extension if not exists "uuid-ossp";

-- Create profiles table for user data
create table public.profiles (
    id uuid references auth.users not null primary key,
    username text unique,
    display_name text,
    avatar_url text,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create devices table
create table public.devices (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles not null,
    name text not null,
    location text,
    firmware_version text,
    is_connected boolean default false,
    is_active boolean default false,
    wifi_signal integer default 0 check (wifi_signal >= 0 and wifi_signal <= 100),
    battery_level integer default 0 check (battery_level >= 0 and battery_level <= 100),
    food_level integer default 0 check (food_level >= 0 and food_level <= 100),
    last_active timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create pets table
create table public.pets (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles not null,
    name text not null,
    type text not null,
    breed text,
    age numeric,
    weight numeric,
    daily_intake numeric,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create feeding schedules table
create table public.feeding_schedules (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles not null,
    device_id uuid references public.devices not null,
    pet_id uuid references public.pets not null,
    name text not null,
    scheduled_time time not null,
    days_of_week text[] not null,
    portion_size text not null,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create feeding history table
create table public.feeding_history (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles not null,
    device_id uuid references public.devices not null,
    pet_id uuid references public.pets not null,
    portion_size text not null,
    feeding_time timestamp with time zone default timezone('utc'::text, now()) not null,
    feeding_type text not null check (feeding_type in ('scheduled', 'manual')),
    status text not null check (status in ('success', 'failed')),
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notifications table
create table public.notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles not null,
    title text not null,
    message text not null,
    type text not null check (type in ('info', 'success', 'warning', 'error')),
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) policies

-- Profiles policies
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
on public.profiles for select using (true);

create policy "Users can insert their own profile"
on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update using (auth.uid() = id);

-- Devices policies
alter table public.devices enable row level security;

create policy "Users can view their own devices"
on public.devices for select using (auth.uid() = user_id);

create policy "Users can insert their own devices"
on public.devices for insert with check (auth.uid() = user_id);

create policy "Users can update their own devices"
on public.devices for update using (auth.uid() = user_id);

create policy "Users can delete their own devices"
on public.devices for delete using (auth.uid() = user_id);

create policy "Admin can view all devices"
on public.devices for select using (
    exists(
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

-- Pets policies
alter table public.pets enable row level security;

create policy "Users can view their own pets"
on public.pets for select using (auth.uid() = user_id);

create policy "Users can insert their own pets"
on public.pets for insert with check (auth.uid() = user_id);

create policy "Users can update their own pets"
on public.pets for update using (auth.uid() = user_id);

create policy "Users can delete their own pets"
on public.pets for delete using (auth.uid() = user_id);

create policy "Admin can view all pets"
on public.pets for select using (
    exists(
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

-- Feeding schedules policies
alter table public.feeding_schedules enable row level security;

create policy "Users can view their own feeding schedules"
on public.feeding_schedules for select using (auth.uid() = user_id);

create policy "Users can insert their own feeding schedules"
on public.feeding_schedules for insert with check (auth.uid() = user_id);

create policy "Users can update their own feeding schedules"
on public.feeding_schedules for update using (auth.uid() = user_id);

create policy "Users can delete their own feeding schedules"
on public.feeding_schedules for delete using (auth.uid() = user_id);

create policy "Admin can view all feeding schedules"
on public.feeding_schedules for select using (
    exists(
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

-- Feeding history policies
alter table public.feeding_history enable row level security;

create policy "Users can view their own feeding history"
on public.feeding_history for select using (auth.uid() = user_id);

create policy "Users can insert their own feeding history"
on public.feeding_history for insert with check (auth.uid() = user_id);

create policy "Admin can view all feeding history"
on public.feeding_history for select using (
    exists(
        select 1 from public.profiles
        where profiles.id = auth.uid() and profiles.role = 'admin'
    )
);

-- Notifications policies
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update their own notifications"
on public.notifications for update using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
on public.notifications for delete using (auth.uid() = user_id);

-- Create functions and triggers

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, username, display_name, avatar_url, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url',
        case
            when new.email = 'petfeeder@redwancodes.com' then 'admin'
            else 'user'
        end
    );
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile entry when a new user signs up
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Function to update timestamps
create or replace function public.update_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- Trigger to update timestamps on all relevant tables
create trigger update_profiles_timestamp
    before update on public.profiles
    for each row execute procedure public.update_timestamp();

create trigger update_devices_timestamp
    before update on public.devices
    for each row execute procedure public.update_timestamp();

create trigger update_pets_timestamp
    before update on public.pets
    for each row execute procedure public.update_timestamp();

create trigger update_feeding_schedules_timestamp
    before update on public.feeding_schedules
    for each row execute procedure public.update_timestamp();

-- Insert default admin user
insert into public.profiles (id, username, display_name, role, created_at, updated_at)
values (
    '00000000-0000-0000-0000-000000000000',
    'GamerNo002117',
    'PetFeeder Admin',
    'admin',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
)
on conflict (id) do nothing; 