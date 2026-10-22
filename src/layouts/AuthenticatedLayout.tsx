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

  // Refs for tracking click/tap outside the sidebar drawer and logo button
  const sidebarRef = useRef<HTMLElement | null>(null);
  const logoButtonRef = useRef<HTMLDivElement | null>(null);

  // Profile Dropdown state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close sidebar and profile dropdown on route change
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsSidebarPinned(false);
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
        setIsSidebarPinned(false);
        setIsSidebarHovered(false);
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

  const isMobileOrTablet = () => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 1024;
  };

  // Lock background scrolling on mobile & tablet when the sidebar drawer is open
  useEffect(() => {
    if (isSidebarVisible && typeof window !== "undefined" && window.innerWidth <= 1024) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isSidebarVisible]);

  const closeSidebar = () => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarPinned(false);
    setIsSidebarHovered(false);
  };

  const handleLogoClick = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    // Tapping logo toggles permanent open state; on mobile it stays permanent unless tapped outside
    setIsSidebarPinned((prev) => !prev);
    setIsSidebarHovered(false);
  };

  // Click / tap outside the sidebar to dismiss permanently (on both mobile and desktop)
  useEffect(() => {
    if (!isSidebarVisible) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      // If tapped inside the sidebar drawer, keep it open
      if (sidebarRef.current && sidebarRef.current.contains(target)) {
        return;
      }
      // If tapped on the logo toggle button, let handleLogoClick toggle it
      if (logoButtonRef.current && logoButtonRef.current.contains(target)) {
        return;
      }
      // Tapped outside the sidebar! Dismiss permanently.
      closeSidebar();
    };

    // Small delay ensures opening tap event does not immediately close the drawer
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick, { passive: true });
    }, 60);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isSidebarVisible]);

  const handleLogoMouseEnter = () => {
    if (isMobileOrTablet()) return; // Never use hover on touch/mobile/tablet
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  const handleLogoMouseLeave = () => {
    if (isMobileOrTablet()) return; // Never use hover on touch/mobile/tablet
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarHovered(false);
    }, 280);
  };

  const handleSidebarMouseEnter = () => {
    if (isMobileOrTablet()) return;
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  const handleSidebarMouseLeave = () => {
    if (isMobileOrTablet()) return;
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsSidebarHovered(false);
    }, 280);
  };

  const orgName = "CyberGuard Enterprise";
  const userDisplayName = user?.full_name?.trim() || "Security Administrator";
  const userEmail = user?.email?.trim() || "admin.lead@cyberguard.internal";

  return (
    <div className="authenticated-layout">
      {/* 1. FLOATING LOGO ISLAND (TOP LEFT - NEVER DISAPPEARS, HOVER/CLICK OPENS SIDE TASK BAR) */}
      <div
        className={`floating-island floating-island-logo admin-floating-logo interactive-component ${
          isSidebarVisible ? "sidebar-is-open" : ""
        }`}
        ref={logoButtonRef}
        onMouseEnter={handleLogoMouseEnter}
        onMouseLeave={handleLogoMouseLeave}
        onClick={handleLogoClick}
        role="button"
        tabIndex={0}
        aria-label={isSidebarVisible ? "Close navigation menu" : "Open navigation menu"}
        title="CyberGuard Admin · Click or hover to open navigation sidebar"
      >
        <CyberGuardLogo
          to="/dashboard"
          className="island-logo-link"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogoClick(e);
          }}
        />
        <span className="admin-menu-toggle-icon" aria-hidden="true">
          {isSidebarVisible ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </span>
        <span className="admin-menu-toggle-label">Menu</span>
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
        onTouchStart={closeSidebar}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={`main-vertical-sidebar ${
          isSidebarVisible ? "visible" : ""
        } ${isSidebarPinned ? "pinned" : ""}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        aria-label="Admin vertical sidebar"
      >
        <div className="main-vertical-sidebar-header">
          <div
            className="sidebar-logo-container"
            onClick={() => {
              closeSidebar();
              navigate("/dashboard");
            }}
          >
            <CyberGuardLogo
              to="/dashboard"
              showName={true}
              className="sidebar-brand-logo"
              onClick={(e) => {
                e.preventDefault();
                closeSidebar();
                navigate("/dashboard");
              }}
            />
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
              <IconHome size={17} className="sidebar-nav-icon" />
              <span>Executive Overview</span>
              <span className="nav-bullet" />
            </NavLink>
            <NavLink
              to="/threats"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <IconShield size={17} className="sidebar-nav-icon" />
              <span>Threat Center</span>
              <span className="nav-bullet" />
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
              <IconLayers size={17} className="sidebar-nav-icon" />
              <span>Departments</span>
              <span className="nav-bullet" />
            </NavLink>
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <IconUsers size={17} className="sidebar-nav-icon" />
              <span>Employees &amp; Warnings</span>
              <span className="nav-bullet" />
            </NavLink>
            <NavLink
              to="/devices"
              className={({ isActive }) =>
                `main-vertical-nav-link ${isActive ? "active" : ""}`
              }
              onClick={closeSidebar}
            >
              <IconLaptop size={17} className="sidebar-nav-icon" />
              <span>Devices &amp; Logins</span>
              <span className="nav-bullet" />
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
              <IconSettings size={17} className="sidebar-nav-icon" />
              <span>Settings</span>
              <span className="nav-bullet" />
            </NavLink>
            <NavLink
              to="/"
              className="main-vertical-nav-link"
              onClick={closeSidebar}
            >
              <IconShield size={17} className="sidebar-nav-icon" style={{ color: "var(--cg-green)" }} />
              <span>Public Site</span>
              <span className="nav-bullet" style={{ background: "var(--cg-green)" }} />
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
