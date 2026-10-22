import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

import CyberGuardLogo from "./CyberGuardLogo";
import {
  IconHome,
  IconLaptop,
  IconLayers,
  IconLogOut,
  IconSettings,
  IconShield,
  IconUsers,
} from "./Icons";

interface NavigationItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const securityNavigation: NavigationItem[] = [
  { label: "Overview", path: "/dashboard", icon: <IconHome size={17} /> },
  { label: "Threat Center", path: "/threats", icon: <IconShield size={17} /> },
];

const organizationNavigation: NavigationItem[] = [
  { label: "Departments", path: "/departments", icon: <IconLayers size={17} /> },
  { label: "Employees", path: "/employees", icon: <IconUsers size={17} /> },
  { label: "Devices", path: "/devices", icon: <IconLaptop size={17} /> },
];

const administrationNavigation: NavigationItem[] = [
  { label: "Settings", path: "/settings", icon: <IconSettings size={17} /> },
];

interface SidebarProps {
  onSignOut?: () => void;
}

export default function Sidebar({ onSignOut }: SidebarProps) {
  const renderNavigation = (items: NavigationItem[]) => (
    <ul className="sidebar-navigation-list">
      {items.map((item) => (
        <li key={item.path}>
          <NavLink
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-link-icon" aria-hidden="true">
              {item.icon}
            </span>

            <span className="sidebar-link-label">{item.label}</span>

            <span className="sidebar-link-indicator" aria-hidden="true" />
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <aside className="organization-sidebar">
      <div className="sidebar-header">
        <CyberGuardLogo
          to="/dashboard"
          className="sidebar-brand"
          showName={true}
        />
      </div>

      <div className="sidebar-content">
        <section className="sidebar-section">
          <h2 className="sidebar-section-title">Security Center</h2>
          {renderNavigation(securityNavigation)}
        </section>

        <section className="sidebar-section">
          <h2 className="sidebar-section-title">Organization</h2>
          {renderNavigation(organizationNavigation)}
        </section>

        <section className="sidebar-section">
          <h2 className="sidebar-section-title">Administration</h2>
          {renderNavigation(administrationNavigation)}
        </section>

        <div className="sidebar-spacer" />

        <div className="sidebar-organization-status">
          <span className="sidebar-status-dot" />
          <div>
            <strong>Organization Shield</strong>
            <span>Active &amp; Monitored</span>
          </div>
        </div>

        <section className="sidebar-section sidebar-section-bottom">
          <button
            type="button"
            className="sidebar-link sidebar-signout"
            onClick={onSignOut}
          >
            <span className="sidebar-link-icon" aria-hidden="true">
              <IconLogOut size={16} />
            </span>

            <span className="sidebar-link-label">Sign Out</span>
          </button>
        </section>
      </div>
    </aside>
  );
}
