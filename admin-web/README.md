# Admin Web Dashboard

Student Redressal System - Web-based Admin Dashboard

## Features

This web dashboard provides the same functionality as the mobile app admin panel:

- **Dashboard**: View KPIs, complaint breakdown, recent complaints, messages, and performance insights
- **All Complaints**: Browse, filter, search, and assign complaints to staff
- **Manage Students**: View all students, search, and toggle account status
- **Manage Staff**: View all staff members and toggle account status
- **Announcements**: Create, edit, delete, and manage announcements
- **Reports**: View analytics, charts, and statistics
- **Settings**: Manage notification preferences and account settings
- **Profile**: Update profile information and upload profile photo

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
cd admin-web
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Production Build

```bash
npm run build
```

The built files will be in the `dist/` folder. Deploy this folder to any static hosting service (Vercel, Netlify, GitHub Pages, etc.).

## Login

Use the same admin credentials as the mobile app. The web dashboard connects to the same Supabase backend.

## Project Structure

```
admin-web/
├── src/
│   ├── pages/
│   │   ├── Login.tsx          # Login page
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── ManageStudents.tsx # Student management
│   │   ├── ManageStaff.tsx    # Staff management
│   │   ├── AllComplaints.tsx  # Complaints management
│   │   ├── Announcements.tsx  # Announcements management
│   │   ├── Reports.tsx        # Reports & analytics
│   │   ├── Settings.tsx       # Settings page
│   │   ├── Profile.tsx        # Profile page
│   │   └── *.css              # Styles for each page
│   ├── context/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── services/
│   │   └── supabase.ts        # Supabase client
│   ├── App.tsx                # Main app component
│   ├── App.css                # Global styles
│   └── main.tsx               # Entry point
├── public/
│   └── favi.png               # Favicon
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Technologies

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Supabase** - Backend as a Service
- **CSS3** - Styling

## Configuration

The Supabase configuration is in `src/services/supabase.ts`. It uses the same credentials as the mobile app.

## License

Private - Student Redressal System
