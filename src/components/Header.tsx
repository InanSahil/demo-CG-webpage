import { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import CyberGuardLogo from "./CyberGuardLogo";
import ThemeToggle from "./ThemeToggle";
import { IconPin } from "./Icons";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Home", path: "/" },
  { label: "Features", path: "/features" },
  { label: "How It Works", path: "/how-it-works" },
  { label: "Download", path: "/download" },
];

export default function Header() {
  const { isAuthenticated, logout, loginAsDemoAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar hover & pin states
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Center navigation auto-hide state (disappears after delay, pops back on top hover)
  const [isNavVisible, setIsNavVisible] = useState(true);
  const hideNavTimerRef = useRef<number | null>(null);

  // Clear hide timer & keep nav open
  const keepNavOpen = useCallback(() => {
    setIsNavVisible(true);
    if (hideNavTimerRef.current) {
      window.clearTimeout(hideNavTimerRef.current);
      hideNavTimerRef.current = null;
    }
  }, []);

  // Show nav and start auto-hide countdown
  const startAutoHideTimer = useCallback(() => {
    setIsNavVisible(true);
    if (hideNavTimerRef.current) {
      window.clearTimeout(hideNavTimerRef.current);
    }
    // Auto-hide navigation after 3.5 seconds of inactivity
    hideNavTimerRef.current = window.setTimeout(() => {
      setIsNavVisible(false);
      hideNavTimerRef.current = null;
    }, 3500);
  }, []);

  // Show navigation initially and on route transitions, then auto-hide after 3.5s
  useEffect(() => {
    hideNavTimerRef.current = window.setTimeout(() => {
      setIsNavVisible(false);
      hideNavTimerRef.current = null;
    }, 3500);

    return () => {
      if (hideNavTimerRef.current) {
        window.clearTimeout(hideNavTimerRef.current);
        hideNavTimerRef.current = null;
      }
    };
  }, [location.pathname]);

  // Window-level mouse listener: cursor near top reveals center navigation
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 75) {
        keepNavOpen();
      } else {
        if (!hideNavTimerRef.current) {
          hideNavTimerRef.current = window.setTimeout(() => {
            setIsNavVisible(false);
            hideNavTimerRef.current = null;
          }, 3500);
        }
      }
    };

    window.addEventListener("mousemove", handleWindowMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
    };
  }, [keepNavOpen]);

  // Adjust state on location change without triggering cascading render effect
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsSidebarHovered(false);
  }

  const isSidebarVisible = isSidebarHovered || isSidebarPinned;

  const handleLogoMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  const handleLogoMouseLeave = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarHovered(false);
    }, 280);
  };

  const handleSidebarMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  const handleSidebarMouseLeave = () => {
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarHovered(false);
    }, 280);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsSidebarPinned((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarPinned(false);
    setIsSidebarHovered(false);
  };

  const handleDirectAdminAccess = async (e: React.MouseEvent) => {
    e.preventDefault();
    closeSidebar();
    if (!isAuthenticated) {
      await loginAsDemoAdmin();
    }
    navigate("/dashboard");
  };

  return (
    <>
      {/* Floating Taskbar Islands Layout */}
      <header
        className={`floating-islands-header ${
          isSidebarVisible ? "floating-header-hidden" : ""
        }`}
      >
        {/* ISLAND 1: THE LOGO (NEVER DISAPPEARS, NO MENU TEXT) */}
        <div
          className="floating-island floating-island-logo"
          onMouseEnter={handleLogoMouseEnter}
          onMouseLeave={handleLogoMouseLeave}
          title="CyberGuard · Click or hover to open sidebar"
        >
          <CyberGuardLogo
            to="/"
            className="island-logo-link"
            onClick={handleLogoClick}
          />
        </div>

        {/* ISLAND 2: NAVIGATION LINKS (AUTO-HIDES AFTER DELAY, POPS ON TOP HOVER) */}
        <div
          className={`floating-island floating-island-nav ${
            isNavVisible ? "nav-island-visible" : "nav-island-hidden"
          }`}
          onMouseEnter={keepNavOpen}
          onMouseLeave={startAutoHideTimer}
          aria-label="Main Navigation"
        >
          <nav className="taskbar-nav-links">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `island-nav-link ${isActive ? "active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ISLANDS 3 & 4: RIGHT CONTROLS (MODE SYMBOL & LOGIN-SIGNUP - NEVER DISAPPEAR) */}
        <div className="floating-right-islands-group">
          {/* ISLAND 3: THE MODE SYMBOL (ICON ONLY, NEVER DISAPPEARS) */}
          <div
            className="floating-island floating-island-theme"
            title="Toggle theme (Light / Dark)"
          >
            <ThemeToggle />
          </div>

          {/* ISLAND 4: LOGIN - SIGNUP & ADMIN ACCESS (NEVER DISAPPEARS) */}
          <div className="floating-island floating-island-auth">
            {!isAuthenticated ? (
              <div className="island-auth-buttons">
                <button
                  type="button"
                  className="island-admin-pill-link"
                  onClick={handleDirectAdminAccess}
                  title="Direct Access to Admin Dashboard"
                >
                  <span className="admin-pulse-dot" />
                  <span>Admin</span>
                </button>

                <NavLink to="/login" className="island-login-btn">
                  Login
                </NavLink>

                <NavLink to="/register" className="island-register-btn">
                  Sign Up
                </NavLink>
              </div>
            ) : (
              <div className="island-auth-buttons">
                <NavLink to="/dashboard" className="island-dashboard-btn">
                  Dashboard
                </NavLink>

                <button
                  type="button"
                  className="island-signout-btn"
                  onClick={() => logout()}
                  title="Sign Out"
                >
                  ↪
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out Vertical Navigation Sidebar (Shown on logo hover, pinned on click) */}
      <div
        className={`main-vertical-sidebar-overlay ${
          isSidebarVisible ? "active" : ""
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        className={`main-vertical-sidebar ${
          isSidebarVisible ? "visible" : ""
        } ${isSidebarPinned ? "pinned" : ""}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        aria-label="Main vertical sidebar"
      >
        <div className="main-vertical-sidebar-header">
          <div className="sidebar-logo-container" onClick={handleLogoClick}>
            <CyberGuardLogo to="/" showName={true} className="sidebar-brand-logo" />
          </div>

          <div className="sidebar-header-right">
            <button
              type="button"
              className={`sidebar-pin-toggle ${isSidebarPinned ? "is-pinned" : ""}`}
              onClick={() => setIsSidebarPinned((p) => !p)}
              title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isSidebarPinned ? (
                <>
                  <IconPin size={12} className="icon-mr" /> Pinned
                </>
              ) : (
                "Click to Pin"
              )}
            </button>

            <button
              type="button"
              className="sidebar-dismiss-button"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>

        <div className="main-vertical-sidebar-content">
          <div className="sidebar-section-label">NAVIGATION</div>
          <nav className="main-vertical-nav">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `main-vertical-nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-bullet" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-section-label">ORGANIZATION PORTAL</div>
          <div className="main-vertical-portal-links">
            <button
              type="button"
              onClick={handleDirectAdminAccess}
              className="sidebar-portal-card"
              style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
            >
              <div className="portal-card-top">
                <span className="portal-badge highlight-blue">ENTERPRISE</span>
                <span className="portal-arrow">→</span>
              </div>
              <strong>Admin Command Center</strong>
              <p>Security analysis, department graphs, device monitoring</p>
            </button>

            <div className="sidebar-auth-row">
              <NavLink
                to="/login"
                onClick={closeSidebar}
                className="button button-secondary sidebar-auth-btn"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                onClick={closeSidebar}
                className="button button-primary sidebar-auth-btn"
              >
                Register
              </NavLink>
            </div>
          </div>

          <div className="sidebar-footer-note">
            <span className="sidebar-status-dot-green" />
            <span>CyberGuard Shield Online · v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
}