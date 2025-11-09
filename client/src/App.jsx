import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Overview from './pages/Overview';
import Trends from './pages/Trends';
import Contributors from './pages/Contributors';
import Activity from './pages/Activity';
import Comparison from './pages/Comparison';
import BeforeAfter from './pages/BeforeAfter';
import ContentAnalysis from './pages/ContentAnalysis';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="trends" element={<Trends />} />
            <Route path="contributors" element={<Contributors />} />
            <Route path="activity" element={<Activity />} />
            <Route path="comparison" element={<Comparison />} />
            <Route path="before-after" element={<BeforeAfter />} />
            <Route path="content-analysis" element={<ContentAnalysis />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
