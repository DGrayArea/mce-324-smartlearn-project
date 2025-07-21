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
import NotFound from "./pages/NotFound";

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
              <Route path="courses" element={<div className="p-8 text-center text-muted-foreground">Courses feature coming soon...</div>} />
              <Route path="assignments" element={<div className="p-8 text-center text-muted-foreground">Assignments feature coming soon...</div>} />
              <Route path="meetings" element={<div className="p-8 text-center text-muted-foreground">Virtual Meetings feature coming soon...</div>} />
              <Route path="messages" element={<div className="p-8 text-center text-muted-foreground">Messages & Forums feature coming soon...</div>} />
              <Route path="grades" element={<div className="p-8 text-center text-muted-foreground">Grades & Results feature coming soon...</div>} />
              <Route path="content" element={<div className="p-8 text-center text-muted-foreground">Content Library feature coming soon...</div>} />
              <Route path="analytics" element={<div className="p-8 text-center text-muted-foreground">Analytics feature coming soon...</div>} />
              <Route path="users" element={<div className="p-8 text-center text-muted-foreground">User Management feature coming soon...</div>} />
              <Route path="result-approval" element={<div className="p-8 text-center text-muted-foreground">Result Approval feature coming soon...</div>} />
              <Route path="system-analytics" element={<div className="p-8 text-center text-muted-foreground">System Analytics feature coming soon...</div>} />
              <Route path="course-management" element={<div className="p-8 text-center text-muted-foreground">Course Management feature coming soon...</div>} />
              <Route path="calendar" element={<div className="p-8 text-center text-muted-foreground">Calendar feature coming soon...</div>} />
              <Route path="support" element={<div className="p-8 text-center text-muted-foreground">Help & Support feature coming soon...</div>} />
              <Route path="profile" element={<div className="p-8 text-center text-muted-foreground">Profile feature coming soon...</div>} />
              <Route path="settings" element={<div className="p-8 text-center text-muted-foreground">Settings feature coming soon...</div>} />
            </Route>

            {/* Catch-all routes */}
            <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold mb-4">Unauthorized</h1><p>You don't have permission to access this page.</p></div></div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
