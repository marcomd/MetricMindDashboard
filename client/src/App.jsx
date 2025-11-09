import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Trends from './pages/Trends';
import Contributors from './pages/Contributors';
import Activity from './pages/Activity';
import Comparison from './pages/Comparison';
import BeforeAfter from './pages/BeforeAfter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="trends" element={<Trends />} />
          <Route path="contributors" element={<Contributors />} />
          <Route path="activity" element={<Activity />} />
          <Route path="comparison" element={<Comparison />} />
          <Route path="before-after" element={<BeforeAfter />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
