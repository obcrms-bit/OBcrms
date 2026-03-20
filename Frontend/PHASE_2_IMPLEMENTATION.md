# Phase 2: Frontend Architecture & Dashboard Implementation

## 🏗️ Production-Ready Folder Structure

```
Frontend/src/
├── components/
│   ├── Layout/
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── Navbar.jsx            # Top navigation bar
│   │   ├── DashboardLayout.jsx   # Wraps dashboard pages
│   │   └── index.js              # Barrel export
│   ├── Common/
│   │   ├── Button.jsx            # Reusable button component
│   │   ├── Card.jsx              # Reusable card component
│   │   ├── Modal.jsx             # Reusable modal
│   │   ├── Table.jsx             # Reusable table
│   │   ├── LoadingSpinner.jsx    # Loading indicator
│   │   ├── EmptyState.jsx        # Empty data state
│   │   └── index.js              # Barrel export
│   └── Dashboard/
│       ├── StatsCard.jsx         # Statistics display card
│       ├── StudentTable.jsx      # Student listing table
│       ├── StudentForm.jsx       # Add/Edit student form
│       └── index.js              # Barrel export
├── pages/
│   ├── LoginPage.jsx             # Login page
│   ├── AdminDashboard.jsx        # Admin dashboard page
│   ├── CounselorDashboard.jsx    # Counselor dashboard page
│   └── UnauthorizedPage.jsx      # 403 error page
├── context/
│   └── AuthContext.jsx           # Authentication state management
├── services/
│   ├── api.js                    # Axios configuration & interceptors
│   ├── studentService.js         # Student API calls
│   ├── authService.js            # Auth API calls
│   └── dashboardService.js       # Dashboard API calls
├── utils/
│   ├── constants.js              # App-wide constants
│   ├── formatters.js             # Date/number formatting
│   └── validators.js             # Form validation helpers
├── hooks/
│   ├── useStudents.js            # Custom hook for student operations
│   ├── usePagination.js          # Custom hook for pagination
│   └── useForm.js                # Custom hook for form management
├── styles/
│   ├── tailwind.css              # Tailwind configuration
│   └── globals.css               # Global styles
├── App.jsx                       # Main app component
├── App.css                       # App styling
├── index.js                      # React entry point
└── index.css                     # Global CSS
```

## 📦 Install Required Dependencies

Run in `Frontend/` directory:

```bash
npm install -D tailwindcss postcss autoprefixer
npm install lucide-react  # Modern icons
npm install clsx          # Utility for className management
npm install tailwind-merge  # Merge Tailwind utilities

# Initialize Tailwind (optional if not already done)
npx tailwindcss init -p
```

## 🎨 Tailwind Configuration

### File: `Frontend/tailwind.config.js`

```javascript
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4c51bf',
          900: '#2c3e50',
        },
        secondary: {
          500: '#764ba2',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### File: `Frontend/src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium;
  }

  .btn-danger {
    @apply px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors font-medium;
  }

  .card {
    @apply bg-white rounded-xl shadow-md overflow-hidden;
  }

  .input-field {
    @apply px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  }

  .label {
    @apply block text-sm font-medium text-gray-700 mb-2;
  }
}

* {
  @apply antialiased;
}
```

## 🧩 Component Building Guide

### 1. Sidebar Component

**File: `src/components/Layout/Sidebar.jsx`**

```jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Home, Users, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = user?.role === 'admin' ? [
    { icon: Home, label: 'Dashboard', href: '/admin' },
    { icon: Users, label: 'Students', href: '/admin' },
    { icon: BarChart3, label: 'Analytics', href: '#analytics' },
  ] : [
    { icon: Home, label: 'Dashboard', href: '/counselor' },
    { icon: Users, label: 'My Students', href: '/counselor' },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 text-white transform transition-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}
    >
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Education CRM</h1>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-gray-300 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="px-4 py-8 space-y-4">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
```

### 2. Navbar Component

**File: `src/components/Layout/Navbar.jsx`**

```jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Menu, User } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex items-center justify-between md:hidden">
      <button
        onClick={onMenuClick}
        className="text-gray-700 hover:text-gray-900"
      >
        <Menu size={24} />
      </button>

      <h2 className="text-lg font-semibold text-gray-800">Education CRM</h2>

      <div className="flex items-center space-x-4">
        <button className="text-gray-600 hover:text-gray-900">
          <Bell size={20} />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white">
            <User size={20} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

### 3. DashboardLayout Component

**File: `src/components/Layout/DashboardLayout.jsx`**

```jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Top Navigation for Desktop */}
        <div className="hidden md:flex items-center justify-between bg-white shadow-sm px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <div className="text-sm text-gray-600">
            Welcome back, <span className="font-semibold">User</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
```

### 4. StatsCard Component

**File: `src/components/Dashboard/StatsCard.jsx`**

```jsx
import React from 'react';

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = 'primary',
  trend,
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
          <Icon size={32} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
```

## 📱 Admin Dashboard Page

**File: `src/pages/AdminDashboard.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CheckCircle, Clock } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';
import { dashboardAPI } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back to Education CRM</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon={Users}
            color="primary"
            trend={12}
          />
          <StatsCard
            title="Applications"
            value={stats?.totalApplications || 0}
            icon={BookOpen}
            color="warning"
            trend={8}
          />
          <StatsCard
            title="Visa Approved"
            value={stats?.visaApprovedCount || 0}
            icon={CheckCircle}
            color="success"
            trend={15}
          />
          <StatsCard
            title="Pending"
            value={stats?.pendingCount || 0}
            icon={Clock}
            color="danger"
            trend={-5}
          />
        </div>

        {/* Recent Students Section */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Students</h2>
          <p className="text-gray-600">Student list will be implemented here</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
```

## 👨‍💼 Counselor Dashboard Page

**File: `src/pages/CounselorDashboard.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import StatsCard from '../components/Dashboard/StatsCard';

const CounselorDashboard = () => {
  const [stats, setStats] = useState({
    assignedStudents: 12,
    processing: 5,
    approved: 4,
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your assigned students</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Assigned Students"
            value={stats.assignedStudents}
            icon={Users}
            color="primary"
          />
          <StatsCard
            title="In Processing"
            value={stats.processing}
            icon={TrendingUp}
            color="warning"
          />
          <StatsCard
            title="Approved"
            value={stats.approved}
            icon={Users}
            color="success"
          />
        </div>

        {/* Assigned Students List */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Students</h2>
          <p className="text-gray-600">Student management interface coming soon</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CounselorDashboard;
```

## 🔄 Update App.jsx for New Structure

**File: `src/App.jsx`**

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CounselorDashboard from './pages/CounselorDashboard';
import './App.css';
import './styles/globals.css';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role?.toLowerCase() !== requiredRole.toLowerCase()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/counselor"
          element={
            <ProtectedRoute requiredRole="counselor">
              <CounselorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to={user.role?.toLowerCase() === 'admin' ? '/admin' : '/counselor'}
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

## ✅ Implementation Checklist

- [ ] Install Tailwind and dependencies
- [ ] Update `tailwind.config.js`
- [ ] Create `styles/globals.css`
- [ ] Create `components/Layout/` folder with Sidebar, Navbar, DashboardLayout
- [ ] Create `components/Dashboard/` folder with StatsCard
- [ ] Update `AdminDashboard.jsx` with new layout
- [ ] Update `CounselorDashboard.jsx` with new layout
- [ ] Update `App.jsx` with new structure
- [ ] Test login flow
- [ ] Verify dashboard renders correctly
- [ ] Test responsiveness on mobile

## 🚀 Next Steps

1. Test login with the credentials provisioned for your environment
2. Verify admin dashboard loads with stats
3. Test counselor dashboard
4. Add Student CRUD operations
5. Implement student table with pagination
6. Add student assignment functionality


