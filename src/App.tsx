import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

// Pages
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import Courses from "./pages/dashboard/Courses";
import Assignments from "./pages/dashboard/Assignments";
import Meetings from "./pages/dashboard/Meetings";
import Messages from "./pages/dashboard/Messages";
import Grades from "./pages/dashboard/Grades";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/dashboard/Notifications";
import Support from "./pages/dashboard/Support";
import Calendar from "./pages/dashboard/Calendar";
import Chatrooms from "./pages/dashboard/Chatrooms";
import ContentLibrary from "./pages/dashboard/ContentLibrary";
import Analytics from "./pages/dashboard/Analytics";
import UserManagement from "./pages/dashboard/UserManagement";
import ResultApproval from "./pages/dashboard/ResultApproval";
import SystemAnalytics from "./pages/dashboard/SystemAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="messages" element={<Messages />} />
              <Route path="grades" element={<Grades />} />
              <Route path="content" element={<ContentLibrary />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="result-approval" element={<ResultApproval />} />
              <Route path="system-analytics" element={<SystemAnalytics />} />
              <Route path="course-management" element={<Courses />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="support" element={<Support />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="chatrooms" element={<Chatrooms />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Catch-all routes */}
            <Route
              path="/unauthorized"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
                    <p>You don't have permission to access this page.</p>
                  </div>
                </div>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
