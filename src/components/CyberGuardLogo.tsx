import { NavLink } from "react-router-dom";
import type { MouseEvent } from "react";

import logo from "../assets/logo.png";

interface CyberGuardLogoProps {
  to?: string;
  className?: string;
  showName?: boolean;
  alt?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function CyberGuardLogo({
  to = "/",
  className = "",
  showName = false,
  alt = "CyberGuard",
  onClick,
  onMouseEnter,
  onMouseLeave,
}: CyberGuardLogoProps) {
  return (
    <NavLink
      to={to}
      className={`cyberguard-logo ${className}`.trim()}
      aria-label="CyberGuard Home"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <img
        src={logo}
        alt={alt}
        className="cyberguard-logo-image"
        draggable={false}
      />

      {showName && (
        <span className="cyberguard-logo-name">
          CyberGuard
        </span>
      )}
    </NavLink>
  );
}