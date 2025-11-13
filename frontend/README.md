# AWARE Water Management System - Frontend

React + TypeScript + Vite frontend for the AWARE Water Management System.

## Features

- **Modern Stack**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: Zustand + TanStack Query
- **Routing**: React Router v6
- **Backend Integration**: Supabase + FastAPI

## Pages

- **Landing** (`/`) - Welcome page
- **Auth** (`/auth`) - Authentication
- **Dashboard** (`/dashboard`) - Main overview with metrics and charts
- **Network** (`/network`) - Water network visualization
- **Incidents** (`/incidents`) - Incident management
- **Agents** (`/agents`) - AI agent management
- **Energy** (`/energy`) - Energy optimization
- **Admin** (`/admin`) - Administration panel
- **Team** (`/team`) - Team management

## Prerequisites

- Node.js 18 or higher
- npm or bun

## Installation

1. Install dependencies:
```bash
npm install
# or
bun install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials

## Running the Frontend

Start the development server:
```bash
npm run dev
# or
bun dev
```

The app will be available at http://localhost:5173

## Building for Production

```bash
npm run build
# or
bun run build
```

Preview the production build:
```bash
npm run preview
# or
bun preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── Layout.tsx    # Main layout wrapper
│   │   └── NavLink.tsx   # Navigation link component
│   ├── pages/            # Route pages
│   ├── lib/              # Utilities and stores
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External integrations (Supabase)
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
└── index.html           # HTML template
```

## Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

## Backend API Integration

The frontend expects the backend API to be running at `http://localhost:8000`. Make sure the backend is running before using features that depend on it.

## Development

- Lint code: `npm run lint`
- Build for development: `npm run build:dev`
