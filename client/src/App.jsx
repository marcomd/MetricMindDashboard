import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Trends from './pages/Trends';
import Contributors from './pages/Contributors';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="trends" element={<Trends />} />
          <Route path="contributors" element={<Contributors />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
