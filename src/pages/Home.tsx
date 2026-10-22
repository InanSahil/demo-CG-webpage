import { useState } from "react";
import { NavLink } from "react-router-dom";

import CyberGuardLogo from "../components/CyberGuardLogo";
import introVideo from "../assets/intro.mp4";
import { BackendService } from "../services/backendIntegration";

const highlights = [
  {
    number: "01",
    tag: "PREVENTION",
    color: "blue",
    title: "AI-Powered Threat Defense",
    description:
      "Real-time heuristic scanning of enterprise endpoints, detecting phishing vectors, deepfakes, and zero-day vulnerabilities.",
  },
  {
    number: "02",
    tag: "GOVERNANCE",
    color: "red",
    title: "Anomalous Login & Admin Consensus",
    description:
      "Automated detection of unplanned login times or foreign locations, with immediate admin permission lockouts and peer quorum votes.",
  },
  {
    number: "03",
    tag: "ANALYSIS",
    color: "green",
    title: "Department Cyber Scores & Early Warnings",
    description:
      "Continuous posture scoring per department, automated 3-slot 12hr warning emails for low-scoring personnel to stop data leakage.",
  },
];

export default function Home() {
  const [downloadCount] = useState(() => BackendService.getDownloadsCount());
  const [videoPlaying, setVideoPlaying] = useState(true);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-intro">
            <div className="home-pill-badge">
              <span className="pill-dot-green" />
              <span>DEFENSE SYSTEM v2.4 ONLINE</span>
            </div>

            <h1 className="home-hero-title">
              Autonomous Cybersecurity
              <span className="home-title-highlight">For Modern Enterprise.</span>
            </h1>

            <p className="home-hero-description">
              CyberGuard unifies mobile device defense, department risk analytics,
              and administrative consensus governance. Protect your organizational
              data before breaches happen.
            </p>

            <div className="home-hero-actions">
              <NavLink to="/register" className="button button-primary hero-btn-main">
                <span>Start Organization Trial</span>
                <span className="btn-arrow">→</span>
              </NavLink>

              <NavLink to="/dashboard" className="button button-secondary hero-btn-secondary">
                <span>Open Admin Dashboard</span>
              </NavLink>
            </div>

            {/* Quick Stats Grid */}
            <div className="home-stat-chips">
              <div className="stat-chip chip-blue">
                <span className="stat-chip-label">Downloads</span>
                <strong className="stat-chip-value">
                  {downloadCount.toLocaleString()}+
                </strong>
              </div>

              <div className="stat-chip chip-green">
                <span className="stat-chip-label">Protected Orgs</span>
                <strong className="stat-chip-value">4,280+</strong>
              </div>

              <div className="stat-chip chip-red">
                <span className="stat-chip-label">Threats Blocked</span>
                <strong className="stat-chip-value">1.8M+</strong>
              </div>
            </div>
          </div>

          <div className="home-hero-meta">
            <span>ZERO TRUST ARCHITECTURE</span>
            <span className="home-hero-meta-line" />
            <span>REAL-TIME TELEMETRY</span>
          </div>
        </div>

        {/* Video Player Named 'intro' with Download Counter */}
        <div className="home-hero-visual home-hero-video interactive-component">
          <div className="video-header-bar">
            <div className="video-title-pill">
              <span className="video-play-indicator" />
              <strong>Video: intro</strong>
              <span className="video-codec-badge">HD · MP4</span>
            </div>

            <div className="video-downloads-badge">
              <span className="download-icon">⬇</span>
              <strong>{downloadCount.toLocaleString()}</strong>
              <span>Downloads</span>
            </div>
          </div>

          <video
            className="home-intro-video"
            src={introVideo}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            title="intro"
            aria-label="intro"
            onClick={(e) => {
              const video = e.currentTarget;
              if (video.paused) {
                video.play();
                setVideoPlaying(true);
              } else {
                video.pause();
                setVideoPlaying(false);
              }
            }}
          />

          <div className="home-video-overlay" />

          <div className="home-video-brand">
            <div className="home-video-brand-logo">
              <CyberGuardLogo className="home-video-logo" />
            </div>

            <div className="home-video-brand-text">
              <span>CYBERGUARD DEFENSE</span>
              <strong>VIDEO: "intro"</strong>
            </div>
          </div>

          <div className="home-video-status">
            <span className="home-video-status-dot" />
            {videoPlaying ? "PLAYING: intro" : "PAUSED"}
          </div>

          <div className="home-video-frame-line home-video-frame-line-top" />
          <div className="home-video-frame-line home-video-frame-line-bottom" />
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="home-highlights">
        <div className="home-section-heading">
          <span className="home-eyebrow">ENTERPRISE RESILIENCE</span>
          <h2>Comprehensive Defense Layered Across Your Workforce</h2>
        </div>

        <div className="home-highlight-grid">
          {highlights.map((item) => (
            <article
              className={`home-highlight-card highlight-${item.color} interactive-component`}
              key={item.number}
            >
              <div className="home-highlight-top">
                <span className={`home-highlight-number num-${item.color}`}>
                  {item.number}
                </span>

                <span className={`home-tag-pill tag-${item.color}`}>
                  {item.tag}
                </span>
              </div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>

              <div className="card-hover-indicator" />
            </article>
          ))}
        </div>
      </section>

      {/* Call to action */}
      <section className="home-cta interactive-component">
        <div className="home-cta-content">
          <span className="home-eyebrow">INSTANT SETUP</span>
          <h2>Equip your organization with CyberGuard.</h2>
          <p>
            Deploy centralized defense, track department security scores, and
            automate data leakage protection with one seamless portal.
          </p>
        </div>

        <div className="home-cta-actions">
          <NavLink to="/register" className="button button-primary home-cta-button">
            <span>Create Organization Account</span>
            <span>→</span>
          </NavLink>
        </div>
      </section>
    </div>
  );
}