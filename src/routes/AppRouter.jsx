import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import ProtectedRoute from './ProtectedRoute';
import StudentLayout from '../layouts/StudentLayout';
import InstructorLayout from '../layouts/InstructorLayout';

import LoginPage from '../pages/auth/LoginPage';
import OnboardingPage from '../pages/auth/OnboardingPage';
import LearnSession from '../pages/student/LearnSession';
import LessonPage from '../pages/student/LessonPage';
import StudentDashboard from '../pages/student/StudentDashboard';
import ChallengePage from '../pages/student/ChallengePage';
import ModuleProgressPage from '../pages/student/ModuleProgressPage';
import WorkbenchPage from '../pages/student/WorkbenchPage';
import InstructorDashboard from '../pages/instructor/InstructorDashboard';
import HeatmapPage from '../pages/instructor/HeatmapPage';
import StudentDetailPage from '../pages/instructor/StudentDetailPage';

const ROLES = { STUDENT: 'student', INSTRUCTOR: 'instructor' };

/* Gate: students must onboard before entering the app */
const OnboardingGate = ({ children }) => {
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  return children;
};

const AppRouter = () => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);

  const homeFor = (u) => (u?.role === 'instructor' ? '/instructor/dashboard' : '/student/learn');

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Login */}
        <Route
          path="/login"
          element={
            isAuthenticated && user
              ? <Navigate to={homeFor(user)} replace />
              : <LoginPage />
          }
        />

        {/* Onboarding (students, post-login, pre-app) */}
        <Route
          path="/onboarding"
          element={
            !isAuthenticated || !user
              ? <Navigate to="/login" replace />
              : user.role === 'instructor'
                ? <Navigate to="/instructor/dashboard" replace />
                : hasOnboarded
                  ? <Navigate to="/student/learn" replace />
                  : <OnboardingPage />
          }
        />

        {/* Full-screen lesson player (no layout chrome) */}
        <Route path="/student/lesson" element={
          <ProtectedRoute requiredRole={ROLES.STUDENT}>
            <OnboardingGate><LessonPage /></OnboardingGate>
          </ProtectedRoute>
        } />

        {/* Student app */}
        <Route path="/student/*" element={
          <ProtectedRoute requiredRole={ROLES.STUDENT}>
            <OnboardingGate>
              <StudentLayout>
                <Routes>
                  <Route path="learn" element={<LearnSession />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="challenge" element={<ChallengePage />} />
                  <Route path="progress" element={<ModuleProgressPage />} />
                  <Route path="workbench" element={<WorkbenchPage />} />
                  {/* Legacy Virtual Lab routes now redirect to the unified Workbench */}
                  <Route path="lab" element={<Navigate to="/student/workbench" replace />} />
                  <Route path="lab/:instrumentId" element={<Navigate to="/student/workbench" replace />} />
                  <Route path="*" element={<Navigate to="learn" replace />} />
                </Routes>
              </StudentLayout>
            </OnboardingGate>
          </ProtectedRoute>
        } />

        {/* Instructor app */}
        <Route path="/instructor/*" element={
          <ProtectedRoute requiredRole={ROLES.INSTRUCTOR}>
            <InstructorLayout>
              <Routes>
                <Route path="dashboard" element={<InstructorDashboard />} />
                <Route path="heatmap" element={<HeatmapPage />} />
                <Route path="student/:id" element={<StudentDetailPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </InstructorLayout>
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRouter;
