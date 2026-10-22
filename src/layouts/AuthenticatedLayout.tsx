import { useState, useRef, useEffect, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import CyberGuardLogo from "../components/CyberGuardLogo";
import {
  IconHome,
  IconLaptop,
  IconLayers,
  IconLogOut,
  IconSettings,
  IconShield,
  IconUsers,
} from "../components/Icons";
import { useAuth } from "../context/AuthContext";

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Sidebar hover & pin states following the Home side task bar
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Profile Dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close sidebar and profile dropdown on route change
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsSidebarHovered(false);
    setIsProfileOpen(false);
  }

  // Handle click outside profile dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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

  const orgName = "CyberGuard Enterprise";
  const userDisplayName = user?.full_name?.trim() || "Security Administrator";
  const userEmail = user?.email?.trim() || "admin.lead@cyberguard.internal";

  return (
    <div className="authenticated-layout">
      {/* 1. FLOATING LOGO ISLAND (TOP LEFT - NEVER DISAPPEARS, HOVER/CLICK OPENS SIDE TASK BAR) */}
      <div
        className="floating-island floating-island-logo admin-floating-logo interactive-component"
        onMouseEnter={handleLogoMouseEnter}
        onMouseLeave={handleLogoMouseLeave}
        onClick={handleLogoClick}
        title="CyberGuard Admin · Click or hover to open navigation sidebar"
      >
        <CyberGuardLogo to="/dashboard" className="island-logo-link" />
      </div>

      {/* 2. FLOATING RIGHT CONTROLS: THEME TOGGLE & ORGANIZATION ACCOUNT PROFILE DROPDOWN */}
      <div className="floating-right-islands-group admin-floating-controls">
        {/* Mode Symbol Island */}
        <div
          className="floating-island floating-island-theme interactive-component"
          title="Toggle theme (Light / Dark)"
        >
          <ThemeToggle />
        </div>

        {/* Organization Account with Profile Dropdown Menu */}
        <div
          className="floating-island floating-island-auth admin-org-account-island"
          ref={profileDropdownRef}
        >
          <button
            type="button"
            className="admin-account-trigger-btn"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            aria-expanded={isProfileOpen}
            aria-haspopup="true"
            title="Organization Account &amp; Profile"
          >
            <span className="org-avatar-badge" aria-hidden="true">
              CG
            </span>
            <div className="org-account-label-group">
              <span className="org-account-title">{orgName}</span>
              <span className="org-account-role">Admin</span>
            </div>
            <span
              className={`org-chevron-icon ${isProfileOpen ? "open" : ""}`}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileOpen && (
            <div
              className="admin-profile-dropdown-menu"
              role="menu"
              aria-label="Organization Account Menu"
            >
              <div className="dropdown-account-header">
                <div className="dropdown-avatar-box">CG</div>
                <div className="dropdown-user-details">
                  <strong className="dropdown-org-name">{orgName}</strong>
                  <span className="dropdown-admin-name">{userDisplayName}</span>
                  <small className="dropdown-admin-email">{userEmail}</small>
                </div>
              </div>

              <div className="dropdown-status-strip">
                <span className="dropdown-status-dot" />
                <span className="dropdown-status-text">
                  Cluster #01 · Zero-Trust Active
                </span>
              </div>

              <div className="dropdown-divider" />

              <div className="dropdown-nav-group">
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `dropdown-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <IconHome size={15} className="dropdown-nav-icon" />
                  <span>Executive Overview</span>
                </NavLink>

                <NavLink
                  to="/threats"
                  className={({ isActive }) =>
                    `dropdown-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <IconShield size={15} className="dropdown-nav-icon" />
                  <span>Threat Center</span>
                </NavLink>

                <NavLink
                  to="/departments"
                  className={({ isActive }) =>
                    `dropdown-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <IconLayers size={15} className="dropdown-nav-icon" />
                  <span>Departments Audit</span>
                </NavLink>

                <NavLink
                  to="/employees"
                  className={({ isActive }) =>
                    `dropdown-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <IconUsers size={15} className="dropdown-nav-icon" />
                  <span>Employees &amp; Warnings</span>
                </NavLink>

                <NavLink
                  to="/devices"
                  className={({ isActive }) =>
                    `dropdown-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <IconLaptop size={15} className="dropdown-nav-icon" />
                  <span>Devices &amp; Logins</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `dropdown-nav-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                >
                  <IconSettings size={15} className="dropdown-nav-icon" />
                  <span>Settings &amp; Security</span>
                </NavLink>
              </div>

              <div className="dropdown-divider" />

              <div className="dropdown-footer-actions">
                <button
                  type="button"
                  className="dropdown-signout-btn"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  role="menuitem"
                >
                  <IconLogOut size={15} className="dropdown-nav-icon" />
                  <span>Sign Out of Organization</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SLIDE-OUT VERTICAL SIDE TASK BAR (MATCHES HOME SIDEBAR) */}
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
        aria-label="Admin vertical sidebar"
      >
        <div className="main-vertical-sidebar-header">
          <div className="sidebar-logo-container" onClick={handleLogoClick}>
            <CyberGuardLogo to="/dashboard" showName={true} className="sidebar-brand-logo" />
          </div>

          <div className="sidebar-header-right">
            <button
              type="button"
              className={`sidebar-pin-toggle ${isSidebarPinned ? "is-pinned" : ""}`}
              onClick={() => setIsSidebarPinned((p) => !p)}
              title={isSidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isSidebarPinned ? "Pinned" : "Pin"}
            </button>

            <button
              type="button"
              className="sidebar-dismiss-button"
              onClick={closeSidebar}
              title="Close sidebar"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="main-vertical-sidebar-content">
          <div className="sidebar-section-label">SECURITY CONSOLE</div>
          <nav className="main-vertical-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <span className="nav-bullet" />
              <span>Overview</span>
            </NavLink>
            <NavLink
              to="/threats"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <span className="nav-bullet" />
              <span>Threat Center</span>
            </NavLink>
          </nav>

          <div className="sidebar-section-label">ORGANIZATION DEFENSE</div>
          <nav className="main-vertical-nav">
            <NavLink
              to="/departments"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <span className="nav-bullet" />
              <span>Departments</span>
            </NavLink>
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <span className="nav-bullet" />
              <span>Employees &amp; Warnings</span>
            </NavLink>
            <NavLink
              to="/devices"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <span className="nav-bullet" />
              <span>Devices &amp; Logins</span>
            </NavLink>
          </nav>

          <div className="sidebar-section-label">ADMINISTRATION</div>
          <nav className="main-vertical-nav">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <span className="nav-bullet" />
              <span>Settings</span>
            </NavLink>
            <NavLink
              to="/"
              className="main-vertical-nav-link"
              onClick={closeSidebar}
            >
              <span className="nav-bullet" style={{ background: "var(--cg-green)" }} />
              <span>Public Site</span>
            </NavLink>
          </nav>

          <div className="main-vertical-portal-links">
            <div className="sidebar-portal-card">
              <div className="portal-card-top">
                <span className="portal-badge highlight-blue">ENTERPRISE</span>
              </div>
              <strong>{orgName}</strong>
              <p>Active zero-trust endpoint and workforce compliance monitoring.</p>
            </div>
          </div>

          <div className="sidebar-footer-note">
            <span className="sidebar-status-dot-green" />
            <span>Encrypted Session · TLS 1.3</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="authenticated-content">
        <main className="authenticated-main">{children}</main>
      </div>
    </div>
  );
}
