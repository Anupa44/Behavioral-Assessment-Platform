import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Maker pages
import DashboardPage from "./pages/maker/DashboardPage";
import AssessmentEditorPage from "./pages/maker/AssessmentEditorPage";
import QuestionsPage from "./pages/maker/QuestionsPage";
import InvitationsPage from "./pages/maker/InvitationsPage";
import AnalyticsPage from "./pages/maker/AnalyticsPage";
import ParticipantResultPage from "./pages/maker/ParticipantResultPage";

// Participant pages
import ParticipantAssessmentPage from "./pages/participant/ParticipantAssessmentPage";
import ParticipantCompletePage from "./pages/participant/ParticipantCompletePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Participant routes (no auth required) */}
        <Route path="/a/:token" element={<ParticipantAssessmentPage />} />
        <Route path="/a/:token/complete" element={<ParticipantCompletePage />} />

        {/* Maker protected routes */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/assessments/new" element={<ProtectedRoute><AssessmentEditorPage /></ProtectedRoute>} />
        <Route path="/assessments/:id" element={<ProtectedRoute><AssessmentEditorPage /></ProtectedRoute>} />
        <Route path="/assessments/:id/questions" element={<ProtectedRoute><QuestionsPage /></ProtectedRoute>} />
        <Route path="/assessments/:id/invitations" element={<ProtectedRoute><InvitationsPage /></ProtectedRoute>} />
        <Route path="/assessments/:id/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/assessments/:id/participants/:invitationId" element={<ProtectedRoute><ParticipantResultPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
