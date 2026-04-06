import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CoursesPage from './pages/CoursesPage';
import SubjectsPage from './pages/SubjectsPage';
import OutcomesPage from './pages/OutcomesPage';
import MappingPage from './pages/MappingPage';
import MarksPage from './pages/MarksPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  useLocation();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  return (
    <div className="app-shell">
      {isLoggedIn && <Navbar />}
      <main className="container">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute roles={['Admin']}><CoursesPage /></ProtectedRoute>} />
          <Route path="/subjects" element={<ProtectedRoute roles={['Admin', 'Faculty']}><SubjectsPage /></ProtectedRoute>} />
          <Route path="/outcomes" element={<ProtectedRoute roles={['Admin', 'Faculty']}><OutcomesPage /></ProtectedRoute>} />
          <Route path="/mappings" element={<ProtectedRoute roles={['Admin', 'Faculty']}><MappingPage /></ProtectedRoute>} />
          <Route path="/marks" element={<ProtectedRoute roles={['Admin', 'Faculty']}><MarksPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['Admin', 'Faculty']}><ReportsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isLoggedIn ? '/' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
