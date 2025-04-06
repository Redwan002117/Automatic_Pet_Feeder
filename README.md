# Automatic Pet Feeder 🐱🐶

A modern, iOS-inspired web application to control and monitor automatic pet feeders. This application allows pet owners to set feeding schedules, monitor food levels, and ensure their pets are fed on time, even when they're away.

## Features

- 🔄 **Automated Feeding Schedules**: Set up recurring feeding times for your pets
- 📱 **Remote Control**: Dispense food remotely via web or mobile interface
- 📊 **Feeding Analytics**: Track feeding patterns and consumption over time
- 🔔 **Smart Notifications**: Get alerts for low food levels, successful feedings, or issues
- 👥 **Multi-User Access**: Share control with family members or pet sitters
- 📷 **Live Camera Feed**: Watch your pet enjoy their meal in real-time
- 🏠 **Multi-Device Support**: Manage multiple feeders from a single interface
- 🔒 **Secure Authentication**: Protect your pet's feeding schedule with secure login

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript with iOS-inspired UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Real-time Updates**: Supabase Realtime
- **Storage**: Supabase Storage for pet and user images

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account (for database and authentication)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/automatic-pet-feeder.git
   cd automatic-pet-feeder
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Initialize the database
   ```
   npm run db:init
   ```

5. Start the development server
   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

### Database Setup

1. Create a new project in Supabase
2. Run the SQL script from `supabase-schema.sql` in the SQL Editor
3. Update your `.env` file with the Supabase URL and anon key

## Project Structure

```
automatic-pet-feeder/
├── public/                    # Static files
│   ├── assets/                # Images, icons, etc.
│   ├── scripts/               # JavaScript files
│   ├── styles/                # CSS files
│   └── index.html             # Main HTML file
├── server.js                  # Express server
├── supabase-schema.sql        # Database schema
├── package.json               # Project dependencies
└── README.md                  # This file
```

## Implementation Details

### Authentication Flow

The application uses Supabase Auth for secure user authentication:

1. Users can sign up with email/password or social providers
2. Verification emails are sent for new accounts
3. Password reset functionality for forgotten passwords
4. Session management with secure JWT tokens

### Device Communication

The application communicates with pet feeder devices via:

1. WebSockets for real-time control and status updates
2. REST API for configuration and scheduling
3. MQTT protocol for IoT device integration

### iOS-Inspired UI

The user interface follows iOS design principles:

1. Clean, minimal design with plenty of white space
2. Card-based UI components with subtle shadows
3. Smooth animations and transitions
4. Familiar navigation patterns

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Apple's iOS design system for UI inspiration
- The Node.js and Express communities
- Supabase team for the amazing backend-as-a-service
- All pet lovers who provided feedback during development