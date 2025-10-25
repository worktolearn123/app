# CRM Machine Tracker

A real-time mobile application built with Expo (React Native) and TypeScript for monitoring and managing Crop Residue Management (CRM) machines. This application helps reduce stubble burning by providing operational efficiency through live tracking, analytics, and alerts.

## Features

### Interactive Map Dashboard
- Real-time location tracking of all CRM machines
- Color-coded status markers (Green: In Use, Amber: Idle, Red: Maintenance)
- CHC (Custom Hiring Center) locations displayed
- Interactive map with zoom and pan capabilities

### Machine Fleet Management
- Comprehensive list of all machines with search and filter
- Real-time status updates
- Detailed machine information panel showing:
  - Machine type, ID, and status
  - Fuel level percentage
  - Total operational hours
  - Assigned CHC center
  - Last active timestamp

### Real-Time Monitoring & Alerts
- Automatic alerts for:
  - Machines offline (Error)
  - Machines idle for more than 24 hours (Warning)
- Real-time data synchronization via Supabase subscriptions
- Clickable alerts to focus on specific machines

### Data-Driven Analytics
- Statistics dashboard showing total machines, in-use, idle, and maintenance counts
- Interactive bar charts showing utilization by machine type
- CHC Performance ranking table with utilization percentages
- Overall fleet statistics

## Tech Stack

- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **State Management**: Zustand
- **Navigation**: React Navigation (Bottom Tabs)
- **Maps**: React Native Maps
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Expo CLI
- Expo Go app (for testing on physical devices)

### Installation

1. Navigate to the project directory:
```bash
cd crm-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
npm run android  # For Android
npm run ios      # For iOS (macOS only)
npm run web      # For web browser
```

Or scan the QR code with Expo Go app on your phone.

## Database Structure

The application uses Supabase with the following tables:

### chc_centers
- Custom Hiring Centers with location data

### machines
- Complete machine information including:
  - Identification (ID, name, type)
  - Status (in_use, idle, maintenance)
  - Operational data (fuel level, total hours)
  - Location (latitude, longitude)
  - CHC assignment

### alerts
- System-generated alerts for machines
- Types: error (offline) and warning (idle too long)
- Read/unread status tracking

## Project Structure

```
crm-tracker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── StatCard.tsx
│   │   ├── MachineListItem.tsx
│   │   └── AlertItem.tsx
│   ├── screens/             # Main application screens
│   │   ├── DashboardScreen.tsx
│   │   ├── MachinesScreen.tsx
│   │   ├── AlertsScreen.tsx
│   │   └── AnalyticsScreen.tsx
│   ├── store/               # State management
│   │   └── useAppStore.ts
│   ├── services/            # External services
│   │   └── supabase.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── utils/               # Helper functions
│       └── helpers.ts
├── App.tsx                  # Main app entry point
├── app.json                # Expo configuration
└── package.json            # Dependencies

```

## Key Features Implementation

### Real-Time Updates
The app uses Supabase real-time subscriptions to automatically update machine data and alerts when changes occur in the database.

### Status Color Coding
- 🟢 Green (#10b981): Machine in use
- 🟡 Amber (#f59e0b): Machine idle
- 🔴 Red (#ef4444): Machine under maintenance

### Search & Filter
- Search machines by name or ID
- Filter by status (All, In Use, Idle, Maintenance)

### Analytics
- Visual bar charts for machine type utilization
- CHC performance metrics with utilization percentages
- Overall fleet statistics

## Environment Variables

Environment variables are configured in:
- `.env` file for local development
- `app.json` extra field for Expo configuration

Required variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Future Enhancements

- Dark/light mode toggle
- Date/time filter for activity history
- Export analytics as CSV
- Push notifications for critical alerts
- Offline mode support
- Machine maintenance scheduling
- Route optimization for service personnel
- Integration with IoT sensors for live telemetry

## License

This project is built for monitoring Crop Residue Management machinery to support agricultural sustainability initiatives.
