# Trust Education CRM Dashboard

A modern, responsive admin dashboard for a study-abroad consultancy LMS built with Next.js 14, React 18, and Tailwind CSS.

## Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Toggle between light and dark themes
- **Collapsible Sidebar**: Navigation with icons and hover effects
- **Interactive Charts**: Chart.js integration for analytics
- **Searchable Tables**: Filter and search functionality
- **Real-time Clock**: Shows current time with timezone
- **KPI Cards**: Key performance indicators
- **Calendar View**: Month/Week/Day toggle (placeholder)
- **Modular Components**: Reusable UI components
- **Context API**: Authentication and global state management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js with react-chartjs-2
- **UI Components**: Radix UI primitives
- **State Management**: React Context API

## Project Structure

```
app/
├── dashboard/
│   └── page.jsx              # Main dashboard page
├── layout.tsx                # Root layout with AuthProvider
└── globals.css               # Global styles

components/
├── ui/                       # Reusable UI components
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   └── toast.tsx
└── Dashboard/                # Dashboard-specific components
    ├── Header.jsx
    ├── Sidebar.jsx
    ├── KPICards.jsx
    ├── FollowupTable.jsx
    ├── CalendarView.jsx
    ├── Panels.jsx
    └── Charts.jsx

context/
└── AuthContext.jsx           # Authentication context

lib/
└── utils.ts                  # Utility functions

public/
└── avatar.png                # Placeholder avatar
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   ```
   http://localhost:3000/dashboard
   ```

## Key Components

### Header
- Greeting with user name
- Real-time clock with IST timezone
- Branch selector dropdown
- User profile dropdown (Settings, Logout)
- Dark mode toggle
- KPI cards grid

### Sidebar
- Collapsible navigation
- 20+ menu items with icons
- Hover effects and mobile responsiveness

### Dashboard Sections
- **Scheduled Followup Table**: Searchable table with actions
- **Charts**: 4 Chart.js charts (Bar, Line, Doughnut)
- **Calendar View**: Placeholder with view toggles
- **Panels**: Reminders, Tasks, Birthdays, Leave, Anniversaries

## Customization

### Adding New Charts
```jsx
import { Bar } from 'react-chartjs-2'

const data = {
  labels: ['Label 1', 'Label 2'],
  datasets: [{
    data: [10, 20],
    backgroundColor: '#3B82F6'
  }]
}

<Bar data={data} />
```

### Adding New Menu Items
Update the `sidebarItems` array in `Sidebar.jsx`:

```jsx
{ name: "New Feature", icon: NewIcon }
```

### Extending Context
Add new state to `AuthContext.jsx`:

```jsx
const [newState, setNewState] = useState(initialValue)
```

## API Integration

The dashboard is designed for easy API integration:

1. Replace dummy data with API calls
2. Add loading states and error handling
3. Implement authentication flows
4. Add real-time updates with WebSockets

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing component structure
2. Use TypeScript for type safety (optional)
3. Maintain responsive design principles
4. Add proper loading states
5. Test on multiple screen sizes

## License

This project is part of the Trust Education CRM/ERP system.