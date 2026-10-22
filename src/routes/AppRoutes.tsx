import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthenticatedLayout from "../layouts/AuthenticatedLayout";
import PageTransition from "../components/PageTransition";

import { useAuth } from "../context/AuthContext";

import Home from "../pages/Home";
import Features from "../pages/Features";
import HowItWorks from "../pages/HowItWorks";
import Download from "../pages/Download";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";

import Threats from "../pages/Threats";
import Departments from "../pages/Departments";
import Employees from "../pages/Employees";
import Devices from "../pages/Devices";
import Settings from "../pages/Settings";

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, loginAsDemoAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void loginAsDemoAdmin();
    }
  }, [isLoading, isAuthenticated, loginAsDemoAdmin]);

  if (isLoading || !isAuthenticated) {
    return (
      <section className="auth-loading-page">
        <div className="auth-loading-content">
          <span className="organization-placeholder-label">
            CyberGuard Enterprise
          </span>

          <h1>Entering Admin Dashboard</h1>

          <p>
            Initializing secure administrator session...
          </p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}

function NotFound() {
  return (
    <section className="not-found-page">
      <span className="organization-placeholder-label">
        CyberGuard
      </span>

      <h1>404 — Page Not Found</h1>

      <p>The requested page does not exist.</p>
    </section>
  );
}

function AnimatedPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ================================
          Public Routes
          ================================ */}

      <Route
        path="/"
        element={
          <PublicLayout>
            <AnimatedPage>
              <Home />
            </AnimatedPage>
          </PublicLayout>
        }
      />

      <Route
        path="/features"
        element={
          <PublicLayout>
            <AnimatedPage>
              <Features />
            </AnimatedPage>
          </PublicLayout>
        }
      />

      <Route
        path="/how-it-works"
        element={
          <PublicLayout>
            <AnimatedPage>
              <HowItWorks />
            </AnimatedPage>
          </PublicLayout>
        }
      />

      <Route
        path="/download"
        element={
          <PublicLayout>
            <AnimatedPage>
              <Download />
            </AnimatedPage>
          </PublicLayout>
        }
      />

      <Route
        path="/login"
        element={
          <PublicLayout>
            <AnimatedPage>
              <Login />
            </AnimatedPage>
          </PublicLayout>
        }
      />

      <Route
        path="/register"
        element={
          <PublicLayout>
            <AnimatedPage>
              <Register />
            </AnimatedPage>
          </PublicLayout>
        }
      />

      {/* ================================
          Protected Organization Routes
          ================================ */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AnimatedPage>
                <Dashboard />
              </AnimatedPage>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/threats"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AnimatedPage>
                <Threats />
              </AnimatedPage>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AnimatedPage>
                <Departments />
              </AnimatedPage>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AnimatedPage>
                <Employees />
              </AnimatedPage>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AnimatedPage>
                <Devices />
              </AnimatedPage>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AnimatedPage>
                <Settings />
              </AnimatedPage>
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* ================================
          404
          ================================ */}

      <Route
        path="*"
        element={
          <PublicLayout>
            <AnimatedPage>
              <NotFound />
            </AnimatedPage>
          </PublicLayout>
        }
      />
    </Routes>
  );
}
