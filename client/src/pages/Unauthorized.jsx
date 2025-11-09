import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="card max-w-md w-full mx-4 p-8 text-center">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, you don't have permission to view this data.
        </p>

        {/* Info Box */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-800 dark:text-red-300 mb-2">
            Only users with authorized email domains can access this dashboard.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-red-600 dark:text-red-400">
            <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">@iubenda.com</span>
            <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded">@team.blue</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            to="/login"
            className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Try Different Account
          </Link>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
