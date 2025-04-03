# Automatic Pet Feeder Web Application

A comprehensive web application for managing automatic pet feeders, allowing pet owners to schedule feedings, track pet health, and monitor feeding history.

## Features

- **User Authentication**: Secure login with email/password and Google Sign-in options
- **Dashboard**: Overview of device status, upcoming schedules, and feeding history
- **Device Management**: Add, configure, and monitor connected feeding devices
- **Pet Profiles**: Create and manage pet profiles with health tracking
- **Feeding Schedules**: Set up automated feeding schedules and manual feeding options
- **Analytics**: Visualize feeding patterns over time
- **Admin Panel**: User management and system configuration for administrators

## Technologies Used

- **Frontend**: HTML, CSS, and vanilla JavaScript
- **Backend**: Supabase for authentication, database, and real-time API
- **Data Visualization**: Chart.js for analytics
- **Responsive Design**: Mobile-first approach that works on all devices

## Getting Started

### Prerequisites

- A Supabase account and project
- Node.js and npm installed (for development dependencies)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/automatic-pet-feeder.git
   cd automatic-pet-feeder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Supabase:
   - Create a new Supabase project
   - Update the Supabase URL and anon key in `public/scripts/supabase.js`
   - Set up the database tables as described in the Database Schema section

4. Start the development server:
   ```
   npm start
   ```

## Database Schema

### Users
The application uses Supabase Authentication for user management, with additional profile data stored in the `profiles` table.

### Profiles
```
profiles
- id (UUID, references auth.users.id)
- username (text, unique)
- display_name (text)
- avatar_url (text)
- role (text, 'user' or 'admin')
- created_at (timestamp)
- updated_at (timestamp)
```

### Devices
```
devices
- id (UUID)
- user_id (UUID, references profiles.id)
- name (text)
- location (text)
- firmware_version (text)
- is_connected (boolean)
- is_active (boolean)
- wifi_signal (integer)
- battery_level (integer)
- food_level (integer)
- last_active (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

### Pets
```
pets
- id (UUID)
- user_id (UUID, references profiles.id)
- name (text)
- type (text)
- breed (text)
- age (numeric)
- weight (numeric)
- daily_intake (numeric)
- image_url (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### Feeding Schedules
```
feeding_schedules
- id (UUID)
- user_id (UUID, references profiles.id)
- device_id (UUID, references devices.id)
- pet_id (UUID, references pets.id)
- name (text)
- scheduled_time (timestamp)
- days_of_week (text[])
- portion_size (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### Feeding History
```
feeding_history
- id (UUID)
- user_id (UUID, references profiles.id)
- device_id (UUID, references devices.id)
- pet_id (UUID, references pets.id)
- portion_size (text)
- feeding_time (timestamp)
- feeding_type (text) - 'scheduled' or 'manual'
- status (text) - 'success' or 'failed'
- error_message (text)
- created_at (timestamp)
```

## Directory Structure

```
/
├── public/                  # Public files
│   ├── assets/              # Static assets
│   │   ├── icons/           # SVG icons
│   │   └── images/          # Images
│   ├── pages/               # HTML pages
│   ├── scripts/             # JavaScript files
│   └── styles/              # CSS files
├── src/                     # Source files
│   ├── components/          # Reusable components
│   └── supabase/            # Supabase configuration
├── package.json             # Project metadata
└── README.md                # Project documentation
```

## Deployment

This application can be deployed to any static web hosting service, such as:

- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons provided by [icons.pqoqubbw.dev](https://icons.pqoqubbw.dev)
- Pet illustrations by various artists 