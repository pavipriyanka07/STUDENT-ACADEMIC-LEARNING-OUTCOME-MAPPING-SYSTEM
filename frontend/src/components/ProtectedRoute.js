import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token) return <Navigate to="/login" replace />;
  if (roles && roles.length && !roles.includes(role)) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
