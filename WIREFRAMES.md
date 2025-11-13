# A.W.A.R.E. Water Management System - Wireframes

## Overview
This document provides detailed wireframes for all pages and components in the A.W.A.R.E. system.

---

## Global Layout Components

### Header (All authenticated pages)
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] A.W.A.R.E.  Dashboard  Network  Incidents  Agents  ...  │
│                                           [Role Badge] [Sign Out] │
└─────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Logo: Droplet icon + "A.W.A.R.E." gradient text
- Navigation: Horizontal menu with icons
- User section: Role badge (Admin/Engineer/Operator) + Sign Out button

### Sidebar Navigation
```
┌──────────────────┐
│ [Dashboard Icon] │
│ [Network Icon]   │
│ [Incidents Icon] │
│ [Agents Icon]    │
│ [Energy Icon]    │
│ [Admin Icon]     │ (Admin only)
│ [Team Icon]      │
└──────────────────┘
```

---

## Page Wireframes

### 1. Landing Page (`/`)

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo] A.W.A.R.E.                          [Sign In Button]   │
└────────────────────────────────────────────────────────────────┘

         [Badge: CMPE-272: Enterprise Software Platforms]

                    Agent for Water
             Autonomy, Resilience & Efficiency

         A proactive, self-healing AI agent for municipal
         water utilities that couples a digital twin with
         multi-agent decision systems...

              [Open Dashboard]  [Meet the Team]


┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  [Bot Icon]     │  │  [Zap Icon]     │  │  [Down Icon]    │
│                 │  │                 │  │                 │
│ Proactive Leak  │  │ Energy          │  │ Reduce Non-     │
│ Detection       │  │ Optimization    │  │ Revenue Water   │
│                 │  │                 │  │                 │
│ AI agents       │  │ Dynamic pump    │  │ Comprehensive   │
│ monitor...      │  │ scheduling...   │  │ monitoring...   │
└─────────────────┘  └─────────────────┘  └─────────────────┘


              Ready to Transform Water Management?

                Experience the future of intelligent
                      water utility operations

                      [Get Started Button]


────────────────────────────────────────────────────────────────
© 2025 Team A.W.A.R.E. - San José State University
Raymond Li • Sophia Atendido • Jack Liang • Dhruv Verma
```

---

### 2. Authentication Page (`/auth`)

```
┌────────────────────────────────────────────────────────────────┐
│                         [Logo] A.W.A.R.E.                       │
│                                                                  │
│                      Sign In to Dashboard                       │
│                                                                  │
│              ┌────────────────────────────┐                    │
│              │  Email                      │                    │
│              │  [email input field]       │                    │
│              │                             │                    │
│              │  Password                   │                    │
│              │  [password input field]    │                    │
│              │                             │                    │
│              │  [Sign In Button]          │                    │
│              └────────────────────────────┘                    │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

### 3. Dashboard Page (`/dashboard`)

```
┌────────────────────────────────────────────────────────────────┐
│  Header with Navigation                                         │
└────────────────────────────────────────────────────────────────┘

Dashboard                              [System Online Badge]
SJSU-West District Overview

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ [Water Icon] │ │ [Alert Icon] │ │ [Zap Icon]   │ │ [Up Icon]    │
│ Non-Revenue  │ │ Active       │ │ Energy Cost  │ │ Network      │
│ Water        │ │ Incidents    │ │ Today        │ │ Uptime       │
│              │ │              │ │              │ │              │
│   12.4%      │ │      3       │ │    $287      │ │   99.7%      │
│ -2.1% last   │ │ Requires     │ │ 18% savings  │ │ Last 30 days │
│ month        │ │ attention    │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────┐  ┌─────────────────────────────┐
│ Demand Forecast             │  │ Recent Events               │
│                             │  │                             │
│ [Line Chart]                │  │ ┌─────────────────────────┐ │
│ 24-hour water demand        │  │ │ Leak detected at P-5    │ │
│ prediction showing          │  │ │ [Critical Badge]        │ │
│ consumption patterns        │  │ │ 10:32 AM                │ │
│ throughout the day          │  │ └─────────────────────────┘ │
│                             │  │                             │
│                             │  │ ┌─────────────────────────┐ │
│                             │  │ │ Pump optimization       │ │
│                             │  │ │ [Info Badge]            │ │
│                             │  │ │ 9:15 AM                 │ │
│                             │  │ └─────────────────────────┘ │
└─────────────────────────────┘  └─────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ AI Agents Status                                              │
│ Multi-agent decision system overview                          │
│                                                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ [Bot Icon]   │ │ [Bot Icon]   │ │ [Bot Icon]   │          │
│ │ Leak Agent   │ │ Energy Agent │ │ Demand Agent │          │
│ │ [Enabled]    │ │ [Enabled]    │ │ [Enabled]    │          │
│ │              │ │              │ │              │          │
│ │ Last: Leak   │ │ Last: Pump   │ │ Last: Demand │          │
│ │ detected...  │ │ scheduled... │ │ predicted... │          │
│ │              │ │              │ │              │          │
│ │ Confidence:  │ │ Confidence:  │ │ Confidence:  │          │
│ │ ████████ 85% │ │ ████████ 92% │ │ ████████ 88% │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
└───────────────────────────────────────────────────────────────┘
```

---

### 4. Network Twin Page (`/network`)

```
┌────────────────────────────────────────────────────────────────┐
│  Header with Navigation                                         │
└────────────────────────────────────────────────────────────────┘

Network Twin
SJSU-West District - Digital Twin Visualization

┌───────────────────────────────────────────────────────────────┐
│ Live Network Map                                              │
│ Real-time visualization with autonomous isolation monitoring  │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │                                                          │  │
│ │                    [Interactive Map]                    │  │
│ │                                                          │  │
│ │  ●─────●─────●    • = Junction (orange)               │  │
│ │  │     │     │    ▲ = Tank (green)                    │  │
│ │  ●─────▲─────●    ■ = Reservoir (blue)                │  │
│ │  │           │    ─ = Open Pipe (blue)                │  │
│ │  ●───────────●    ─ = Isolated Pipe (red, dashed)     │  │
│ │                                                          │  │
│ │  Pipes change color in real-time when isolated         │  │
│ │  Click nodes/pipes for detailed information            │  │
│ │                                                          │  │
│ └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Legend       │ │ Network Stats│ │ Monitoring   │
│              │ │              │ │              │
│ ○ Open Pipe  │ │ Total Nodes: │ │ [Badge]      │
│ ○ Isolated   │ │     24       │ │ Real-time    │
│ ○ Junction   │ │              │ │ Updates      │
│ ○ Tank       │ │ Total Pipes: │ │ Active       │
│              │ │     36       │ │              │
│              │ │              │ │ Autonomous   │
│              │ │ Isolated: 2  │ │ isolation    │
│              │ │              │ │ enabled      │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

### 5. Incidents Page (`/incidents`)

```
┌────────────────────────────────────────────────────────────────┐
│  Header with Navigation                                         │
└────────────────────────────────────────────────────────────────┘

Incidents
System events and alerts management

┌───────────────────────────────────────────────────────────────┐
│ Leak Detected at Pipe P-5         [Critical] [Open]          │
│ Autonomous isolation action triggered                         │
│                                                                │
│ Timeline:                                                      │
│ │ AI Agent detected anomaly                                   │
│ │ Leak Detection Agent • 10:32 AM                            │
│ │                                                              │
│ │ Pipe isolated automatically                                 │
│ │ System • 10:32 AM                                          │
│ │                                                              │
│ │ Event created                                               │
│ │ System • 10:32 AM                                          │
│                                                                │
│ [✓ Acknowledge] [✗ Mark as Resolved]                         │
│                                                                │
│ Created: November 12, 2025, 10:32 AM                          │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Pump Schedule Updated             [Info] [Acknowledged]       │
│ Energy optimization schedule applied                          │
│                                                                │
│ Timeline:                                                      │
│ │ Schedule optimized for off-peak hours                       │
│ │ Energy Agent • 9:15 AM                                     │
│ │                                                              │
│ │ Acknowledged by operator                                    │
│ │ john.doe@sjsu.edu • 9:20 AM                                │
│                                                                │
│ [✗ Mark as Resolved]                                          │
│                                                                │
│ Created: November 12, 2025, 9:15 AM                           │
└───────────────────────────────────────────────────────────────┘
```

---

### 6. AI Agents Page (`/agents`)

```
┌────────────────────────────────────────────────────────────────┐
│  Header with Navigation                                         │
└────────────────────────────────────────────────────────────────┘

AI Agents
Multi-agent decision system management

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  [Bot Icon]  │ │  [Bot Icon]  │ │  [Bot Icon]  │
│              │ │              │ │              │
│ [Enabled]    │ │ [Enabled]    │ │ [Enabled]    │
│              │ │              │ │              │
│ Leak         │ │ Energy       │ │ Demand       │
│ Detection    │ │ Optimizer    │ │ Forecasting  │
│              │ │              │ │              │
│ leak-detect  │ │ energy-opt   │ │ demand-pred  │
│              │ │              │ │              │
│ Confidence:  │ │ Confidence:  │ │ Confidence:  │
│    85%       │ │    92%       │ │    88%       │
│ ████████░░   │ │ █████████░   │ │ ████████░░   │
│              │ │              │ │              │
│ Last         │ │ Last         │ │ Last         │
│ Decision:    │ │ Decision:    │ │ Decision:    │
│ Detected     │ │ Scheduled    │ │ Predicted    │
│ leak at P-5  │ │ off-peak     │ │ peak demand  │
│              │ │ pumping      │ │ at 6 PM      │
│              │ │              │ │              │
│ Metrics:     │ │ Metrics:     │ │ Metrics:     │
│ Leaks: 2     │ │ Savings:     │ │ Accuracy:    │
│ Accuracy:    │ │ $142.50      │ │ 94%          │
│ 94%          │ │              │ │              │
│              │ │              │ │              │
│ [▶ Run       │ │ [▶ Run       │ │ [▶ Run       │
│  Simulation] │ │  Simulation] │ │  Simulation] │
└──────────────┘ └──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  [Bot Icon]  │ │  [Bot Icon]  │ │  [Bot Icon]  │
│              │ │              │ │              │
│ Pressure     │ │ Quality      │ │ Maintenance  │
│ Control      │ │ Monitoring   │ │ Scheduler    │
│ ...          │ │ ...          │ │ ...          │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

### 7. Energy Management Page (`/energy`)

```
┌────────────────────────────────────────────────────────────────┐
│  Header with Navigation                                         │
└────────────────────────────────────────────────────────────────┘

Energy Management
Dynamic pump scheduling and cost optimization

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ [Down Icon]  │ │ [Zap Icon]   │ │ [Zap Icon]   │
│ Today's      │ │ Efficiency   │ │ Current Rate │
│ Savings      │ │ Gain         │ │              │
│              │ │              │ │              │
│   $142.50    │ │    18.5%     │ │ $0.085/kWh   │
│ From         │ │ vs. baseline │ │ [Off-Peak]   │
│ optimization │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Hourly Energy Prices                                          │
│ Real-time electricity pricing for pump optimization          │
│                                                                │
│ [Area Chart]                                                  │
│ Price ($/kWh)                                                 │
│ │                                                             │
│ │      ╱─╲                                                   │
│ │     ╱   ╲          ╱─────╲                                │
│ │────╱     ╲────────╱       ╲──────                         │
│ │                                                             │
│ └─────────────────────────────────────────────── Time (hrs)  │
│   0  4  8  12  16  20  24                                    │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ Optimized Pump Schedule                                       │
│ AI-generated schedule for maximum cost savings                │
│                                                                │
│ ┌───────────────────────────────────────────┐                │
│ │ Off-Peak Filling (00:00 - 06:00)  [Active]                │
│ │ Tank T1 to 90% capacity                                    │
│ └───────────────────────────────────────────┘                │
│                                                                │
│ ┌───────────────────────────────────────────┐                │
│ │ Maintenance Window (06:00-07:00) [Scheduled]              │
│ │ Minimal pumping                                            │
│ └───────────────────────────────────────────┘                │
│                                                                │
│ ┌───────────────────────────────────────────┐                │
│ │ Peak Demand (17:00 - 21:00)      [Scheduled]              │
│ │ Tank discharge mode                                        │
│ └───────────────────────────────────────────┘                │
│                                                                │
│ ┌───────────────────────────────────────────┐                │
│ │ Night Cycle (22:00 - 24:00)      [Scheduled]              │
│ │ Top-up refill                                              │
│ └───────────────────────────────────────────┘                │
│                                                                │
│          [⚡ Apply Optimized Schedule]                        │
└───────────────────────────────────────────────────────────────┘
```

---

### 8. Admin Page (`/admin`)

```
┌────────────────────────────────────────────────────────────────┐
│  Header with Navigation                                         │
└────────────────────────────────────────────────────────────────┘

Admin
System configuration and user management

┌───────────────────────────────────────────────────────────────┐
│ User Management                                               │
│                                                                │
│ ┌──────────┬──────────────────────┬─────────┬──────────┐    │
│ │ Name     │ Email                │ Role    │ Actions   │    │
│ ├──────────┼──────────────────────┼─────────┼──────────┤    │
│ │ John Doe │ john.doe@sjsu.edu   │ Admin   │ [Edit]   │    │
│ │ Jane S.  │ jane.smith@sjsu.edu │ Engineer│ [Edit]   │    │
│ │ Bob J.   │ bob.jones@sjsu.edu  │ Operator│ [Edit]   │    │
│ └──────────┴──────────────────────┴─────────┴──────────┘    │
│                                                                │
│ [+ Add New User]                                              │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│ System Configuration                                          │
│                                                                │
│ Alert Thresholds                                              │
│ ├─ Pressure Low:  [50] psi                                   │
│ ├─ Pressure High: [100] psi                                  │
│ ├─ Acoustic Leak:  [0.7]                                     │
│                                                                │
│ Agent Settings                                                │
│ ├─ Autonomous Mode: [✓ Enabled]                              │
│ ├─ Approval Required: [  ] Manual approval for actions       │
│                                                                │
│ [Save Configuration]                                          │
└───────────────────────────────────────────────────────────────┘
```

---

### 9. Team Page (`/team`)

```
┌────────────────────────────────────────────────────────────────┐
│  Header with Navigation (or Landing Header if not logged in)   │
└────────────────────────────────────────────────────────────────┘

Team A.W.A.R.E.
CMPE-272: Enterprise Software Platforms | SJSU Fall 2025

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   [Photo]    │ │   [Photo]    │ │   [Photo]    │ │   [Photo]    │
│              │ │              │ │              │ │              │
│  Raymond Li  │ │ Sophia       │ │ Jack Liang   │ │ Dhruv Verma  │
│              │ │ Atendido     │ │              │ │              │
│ [LinkedIn]   │ │ [LinkedIn]   │ │ [LinkedIn]   │ │ [LinkedIn]   │
│ [GitHub]     │ │ [GitHub]     │ │ [GitHub]     │ │ [GitHub]     │
│ [Email]      │ │ [Email]      │ │ [Email]      │ │ [Email]      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌───────────────────────────────────────────────────────────────┐
│ About the Project                                             │
│                                                                │
│ A.W.A.R.E. (Agent for Water Autonomy, Resilience &           │
│ Efficiency) is a proactive, self-healing AI agent for        │
│ municipal water utilities that couples a digital twin with    │
│ multi-agent decision systems...                               │
│                                                                │
│ Technologies Used:                                            │
│ • Frontend: React, TypeScript, Vite, Tailwind CSS           │
│ • Backend: FastAPI, Python, Supabase                         │
│ • AI: Multi-agent decision systems                           │
│ • Visualization: Recharts, Leaflet                           │
└───────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Cards
All cards follow this pattern:
```
┌────────────────────────────────┐
│ [Icon] Title           [Badge] │
│ Description                     │
│ ─────────────────────────────── │
│                                 │
│ Content area                    │
│                                 │
│ [Action Button]                 │
└────────────────────────────────┘
```

### Badges
- **System Status**: Green = Online, Red = Offline, Yellow = Warning
- **Severity**: Red = Critical/High, Default = Medium, Gray = Low
- **Event State**: Green = Resolved, Yellow = Acknowledged, Gray = Open
- **Agent Status**: Blue = Enabled, Gray = Disabled

### Interactive Elements
- **Buttons**: Primary (filled), Secondary (outline), Ghost (transparent)
- **Charts**: Interactive tooltips on hover
- **Map**: Click nodes/edges for popups with details
- **Real-time Updates**: Toast notifications for system events

### Color Scheme
- **Primary**: Blue (water theme)
- **Secondary**: Purple
- **Accent**: Orange
- **Success**: Green
- **Warning**: Yellow
- **Destructive**: Red
- **Muted**: Gray

---

## Data Flow

### Backend → Frontend
1. **FastAPI Backend** (`http://localhost:8000`)
   - `/` - Health check
   - `/sensors` - Sensor data
   - `/leaks` - Leak detection results

2. **Supabase Backend** (Real-time database)
   - `events` table - System incidents
   - `agents` table - AI agent status
   - `nodes` table - Network nodes
   - `edges` table - Network pipes
   - `sensors` table - Sensor readings
   - `energy_prices` table - Electricity pricing

### Real-time Features
- Network map updates when pipes are isolated
- Dashboard shows live event feed
- Toast notifications for critical events
- Auto-refresh of sensor data

---

## Responsive Design

### Desktop (≥1024px)
- Full sidebar navigation
- Multi-column layouts
- Expanded charts and maps

### Tablet (768px - 1023px)
- Collapsed navigation with icons
- 2-column grid layouts
- Responsive charts

### Mobile (<768px)
- Hamburger menu
- Single column layouts
- Simplified charts
- Touch-friendly buttons

---

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast color ratios
- Screen reader friendly
- Focus indicators on all interactive elements
