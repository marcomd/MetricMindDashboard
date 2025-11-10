import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Avatar from './Avatar';
import {
  LayoutDashboard,
  TrendingUp,
  GitCompare,
  Users,
  Calendar,
  FileText,
  GitCompareArrows,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart3
} from 'lucide-react';

function Layout() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile overlay
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // For desktop collapse
  const location = useLocation();
  const { user, logout } = useAuth();

  // Initialize dark mode from localStorage
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Initialize sidebar collapsed state from localStorage
  useEffect(() => {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    setSidebarCollapsed(isCollapsed);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleSidebarCollapse = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem('sidebarCollapsed', newCollapsed);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation items with icons
  const navItems = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/trends', label: 'Trends', icon: TrendingUp },
    { path: '/before-after', label: 'Before/After', icon: GitCompare },
    { path: '/contributors', label: 'Contributors', icon: Users },
    { path: '/activity', label: 'Activity', icon: Calendar },
    { path: '/content-analysis', label: 'Content', icon: FileText },
    { path: '/comparison', label: 'Comparison', icon: GitCompareArrows },
  ];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Mobile header */}
        <header className="md:hidden bg-white dark:bg-gray-800 shadow-soft sticky top-0 z-50 transition-colors duration-300">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Metric Mind
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Git Analytics Dashboard
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-900 dark:text-white" />
              ) : (
                <Menu className="w-6 h-6 text-gray-900 dark:text-white" />
              )}
            </button>
          </div>
        </header>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            transition-all duration-300 z-50 flex flex-col
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            ${sidebarCollapsed ? 'md:w-[60px]' : 'md:w-[280px]'}
            w-[280px]
          `}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    Metric Mind
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Analytics
                  </p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg mx-auto">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            )}
            {/* Desktop collapse toggle */}
            <button
              onClick={toggleSidebarCollapse}
              className="hidden md:block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300
                    ${isActive(path)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600 dark:border-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 border-transparent'
                    }
                    ${sidebarCollapsed ? 'justify-center' : ''}
                  `}
                  title={sidebarCollapsed ? label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{label}</span>
                  )}
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom Section: Dark Mode + User Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`
                flex items-center gap-3 w-full px-3 py-2.5 rounded-lg
                bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                transition-all duration-300
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
              aria-label="Toggle dark mode"
              title={sidebarCollapsed ? (darkMode ? 'Dark Mode' : 'Light Mode') : ''}
            >
              {darkMode ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
              {!sidebarCollapsed && (
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              )}
            </button>

            {/* User Info */}
            {!sidebarCollapsed && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar
                    src={user?.avatar_url}
                    name={user?.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}

            {/* Collapsed state: Icon-only user section */}
            {sidebarCollapsed && (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <Avatar
                    src={user?.avatar_url}
                    name={user?.name}
                    size="sm"
                  />
                </div>
                <button
                  onClick={logout}
                  className="flex justify-center w-full p-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`
            transition-all duration-300 min-h-screen
            ${sidebarCollapsed ? 'md:ml-[60px]' : 'md:ml-[280px]'}
            pt-0 md:pt-0
          `}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Git Productivity Analytics Dashboard · Powered by Metric Mind
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default Layout;
