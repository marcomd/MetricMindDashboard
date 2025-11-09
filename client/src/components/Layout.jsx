import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Check if user has a preference stored
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-soft sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo and Title */}
              <div className="flex items-center space-x-3">
                <div className="text-3xl">📊</div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Metric Mind
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Git Analytics Dashboard
                  </p>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-8">
                <Link
                  to="/"
                  className={`nav-link ${isActive('/') ? 'text-primary-600 dark:text-primary-400' : ''}`}
                >
                  Overview
                </Link>
                <Link
                  to="/trends"
                  className={`nav-link ${isActive('/trends') ? 'text-primary-600 dark:text-primary-400' : ''}`}
                >
                  Trends
                </Link>
                <Link
                  to="/before-after"
                  className={`nav-link ${isActive('/before-after') ? 'text-primary-600 dark:text-primary-400' : ''}`}
                >
                  Before/After
                </Link>
                <Link
                  to="/contributors"
                  className={`nav-link ${isActive('/contributors') ? 'text-primary-600 dark:text-primary-400' : ''}`}
                >
                  Contributors
                </Link>
                <Link
                  to="/activity"
                  className={`nav-link ${isActive('/activity') ? 'text-primary-600 dark:text-primary-400' : ''}`}
                >
                  Activity
                </Link>
                <Link
                  to="/comparison"
                  className={`nav-link ${isActive('/comparison') ? 'text-primary-600 dark:text-primary-400' : ''}`}
                >
                  Comparison
                </Link>
              </nav>

              {/* Right side controls */}
              <div className="flex items-center space-x-2">
                {/* User Info & Logout (Desktop) */}
                <div className="hidden md:flex items-center space-x-2">
                  <div className="text-right mr-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all duration-300"
                    aria-label="Logout"
                    title="Logout"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>

                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 text-2xl"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? '🌙' : '☀️'}
                </button>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                  aria-label="Toggle menu"
                >
                  <svg
                    className="w-6 h-6 text-gray-900 dark:text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {mobileMenuOpen ? (
                      <path d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <nav className="md:hidden pb-4 space-y-2 fade-in">
                <Link
                  to="/"
                  className={`block py-2 px-4 rounded-lg ${isActive('/') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Overview
                </Link>
                <Link
                  to="/trends"
                  className={`block py-2 px-4 rounded-lg ${isActive('/trends') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Trends
                </Link>
                <Link
                  to="/contributors"
                  className={`block py-2 px-4 rounded-lg ${isActive('/contributors') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contributors
                </Link>
                <Link
                  to="/activity"
                  className={`block py-2 px-4 rounded-lg ${isActive('/activity') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Activity
                </Link>
                <Link
                  to="/comparison"
                  className={`block py-2 px-4 rounded-lg ${isActive('/comparison') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Comparison
                </Link>
                <Link
                  to="/before-after"
                  className={`block py-2 px-4 rounded-lg ${isActive('/before-after') ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Before/After
                </Link>

                {/* User info and logout for mobile */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-4 pb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left py-2 px-4 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </nav>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Git Productivity Analytics Dashboard · Powered by Metric Mind
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Layout;
