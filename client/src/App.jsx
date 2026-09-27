import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import SubmitReviewPage from "./pages/SubmitReviewPage";
import ReviewsPage from "./pages/ReviewsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import PublicReviewsPage from "./pages/PublicReviewsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/submit"
        element={
          <ProtectedRoute>
            <SubmitReviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="/public-reviews" element={<PublicReviewsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute adminOnly>
            <ReviewsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

export default App;
