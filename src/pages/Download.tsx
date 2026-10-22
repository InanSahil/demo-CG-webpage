import { useState } from "react";
import { NavLink } from "react-router-dom";
import { BackendService } from "../services/backendIntegration";

const platforms = [
  {
    label: "Mobile",
    title: "Protect Me (Mobile App)",
    description:
      "A personal cybersecurity mobile experience designed to monitor calls, SMS, URLs, emails, and detect deepfakes.",
    status: "Available for iOS & Android",
  },
  {
    label: "Web",
    title: "Protect My Organization",
    description:
      "A centralized web command center for organizations to monitor threats, department cyber scores, and device logins.",
    status: "Web Platform",
  },
];

const requirements = [
  "Internet connection",
  "Modern supported browser (Chrome, Firefox, Edge, Safari)",
  "Organization corporate account for the web portal",
  "Mobile app compatible with iOS 16+ & Android 12+",
];

export default function Download() {
  const [downloadCount] = useState(() => BackendService.getDownloadsCount());

  return (
    <div className="download-page">
      <section className="download-hero interactive-component">
        <div className="download-hero-content">
          <div className="home-pill-badge">
            <span className="pill-dot-green" />
            <span>CROSS-PLATFORM DEPLOYMENT</span>
          </div>

          <h1>
            Security wherever
            <span className="home-title-highlight">you need it.</span>
          </h1>

          <p>
            Access CyberGuard through the platform designed for your
            security needs. Protect personal mobile endpoints or manage
            organizational risk through our unified command center.
          </p>

          <div className="download-counter interactive-component">
            <span className="download-counter-label">
              TOTAL PLATFORM DOWNLOADS
            </span>

            <div className="download-counter-value">
              <span className="download-counter-number">
                {downloadCount.toLocaleString()}
              </span>

              <span className="download-counter-plus">+</span>
            </div>

            <span className="download-counter-caption">
              ACTIVE VERIFIED INSTALLATIONS
            </span>
          </div>
        </div>

        <div className="download-hero-stat interactive-component">
          <span className="download-hero-stat-label">CYBERGUARD</span>

          <strong>ONE</strong>

          <span>
            UNIFIED SECURITY
            <br />
            ECOSYSTEM
          </span>
        </div>
      </section>

      <section className="download-platforms">
        <div className="download-section-heading">
          <span className="home-eyebrow">CHOOSE YOUR PLATFORM</span>

          <h2>One ecosystem. Two experiences.</h2>
        </div>

        <div className="download-platform-grid">
          {platforms.map((platform) => (
            <article
              className="download-platform-card interactive-component"
              key={platform.title}
            >
              <div className="download-platform-top">
                <span className="download-platform-label">
                  {platform.label}
                </span>

                <span className="download-platform-status">
                  {platform.status}
                </span>
              </div>

              <h3>{platform.title}</h3>

              <p>{platform.description}</p>

              {platform.label === "Web" ? (
                <NavLink
                  to="/login"
                  className="button button-primary download-platform-button"
                >
                  Open Organization Portal
                </NavLink>
              ) : (
                <NavLink
                  to="/how-it-works"
                  className="button button-secondary download-platform-button"
                >
                  View Mobile Capabilities
                </NavLink>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="download-requirements interactive-component">
        <div>
          <span className="home-eyebrow">REQUIREMENTS</span>

          <h2>Simple to get started.</h2>

          <p>
            CyberGuard is designed to keep access straightforward
            while providing the infrastructure required for
            cybersecurity analysis and organizational monitoring.
          </p>
        </div>

        <ul>
          {requirements.map((requirement, index) => (
            <li key={requirement}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {requirement}
            </li>
          ))}
        </ul>
      </section>

      <section className="download-cta interactive-component">
        <span className="home-eyebrow">ORGANIZATIONS</span>

        <h2>Ready to secure your organization?</h2>

        <p>
          Create an organization workspace and start building a
          centralized view of your cybersecurity environment.
        </p>

        <NavLink to="/register" className="button button-primary">
          Create Organization Account →
        </NavLink>
      </section>
    </div>
  );
}