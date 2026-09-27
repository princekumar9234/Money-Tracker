import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { RedirectIfAuthenticated } from './features/auth/components/RedirectIfAuthenticated';

// Auth Pages
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage';

// Dashboard Pages
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { UploadStatementPage } from './features/transactions/pages/UploadStatementPage';
import { TransactionsPage } from './features/transactions/pages/TransactionsPage';
import { TransactionDetailPage } from './features/transactions/pages/TransactionDetailPage';
import { UnusualTransactionsPage } from './features/transactions/pages/UnusualTransactionsPage';
import { MoneyFlowTracePage } from './features/trace/pages/MoneyFlowTracePage';
import { AiChatPage } from './features/ai/pages/AiChatPage';
import { KnowledgeBasePage } from './features/ai/pages/KnowledgeBasePage';
import { ReportsPage } from './features/reports/pages/ReportsPage';
import { ProfilePage } from './features/profile/pages/ProfilePage';
import { SettingsPage } from './features/profile/pages/SettingsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth Routes */}
      <Route element={<RedirectIfAuthenticated><AuthLayout /></RedirectIfAuthenticated>}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/verify-email" element={<VerifyEmailPage />} />

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/upload" element={<UploadStatementPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transactions/:id" element={<TransactionDetailPage />} />
        <Route path="/unusual" element={<UnusualTransactionsPage />} />
        <Route path="/trace" element={<MoneyFlowTracePage />} />
        <Route path="/ai-agent" element={<AiChatPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
