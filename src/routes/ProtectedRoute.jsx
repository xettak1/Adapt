import { Navigate, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { ROLES } from '../constants';

const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const fallback = user.role === ROLES.INSTRUCTOR ? '/instructor/dashboard' : '/student/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
