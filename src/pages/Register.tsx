import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [organization, setOrganization] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      document.body.classList.remove("auth-transition-active");
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isEntering) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isEntering, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isEntering) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await register(
        organization.trim(),
        name.trim(),
        email.trim(),
        password,
      );

      setIsEntering(true);
      document.body.classList.add("auth-transition-active");

      window.setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
          state: {
            fromRegister: true,
          },
        });
      }, 850);
    } catch {
      setErrorMessage("Registration could not be completed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isEntering;

  return (
    <>
      <div
        className={`auth-page ${
          isEntering ? "auth-page-transitioning" : ""
        }`}
      >
        <div className="auth-container register-container">
          <section className="auth-intro">
            <div className="auth-intro-top">
              <span className="home-eyebrow">CYBERGUARD ORGANIZATION</span>

              <span className="auth-system-status">
                <span className="auth-status-dot" />
                SECURE SETUP
              </span>
            </div>

            <div className="auth-intro-main">
              <span className="auth-index">/ 02</span>

              <h1>
                Build your
                <span>security workspace.</span>
              </h1>

              <p>
                Create an organization account to bring your security monitoring,
                threat visibility, and organizational controls together in one
                workspace.
              </p>
            </div>

            <div className="auth-intro-line">
              <span />
              <span />
              <span />
            </div>

            <div className="auth-security-info">
              <div>
                <span>WORKSPACE</span>
                <strong>ORGANIZATION</strong>
              </div>

              <div>
                <span>SETUP</span>
                <strong>SECURE</strong>
              </div>
            </div>
          </section>

          <section className="auth-card">
            <div className="auth-card-heading">
              <div className="auth-card-topline">
                <span className="auth-card-label">CREATE WORKSPACE</span>
                <span className="auth-card-number">CG-REG</span>
              </div>

              <h2>{isEntering ? "Entering workspace" : "Register"}</h2>

              <p>
                {isEntering
                  ? "Setting up your organization command center."
                  : "Set up your organization account to get started."}
              </p>
            </div>

            {errorMessage && !isEntering && (
              <div className="auth-error" role="alert">
                <span className="auth-error-indicator">!</span>
                <div>
                  <strong>Registration error</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <form
              className={`auth-form ${isBusy ? "auth-form-disabled" : ""}`}
              onSubmit={handleSubmit}
            >
              <div className="auth-field">
                <label htmlFor="register-organization">
                  Organization name
                </label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-index">01</span>

                  <input
                    id="register-organization"
                    type="text"
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    placeholder="Your organization"
                    autoComplete="organization"
                    disabled={isBusy}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-name">Administrator name</label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-index">02</span>

                  <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    disabled={isBusy}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">Organization email</label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-index">03</span>

                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@organization.com"
                    autoComplete="email"
                    disabled={isBusy}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-password">Password</label>

                <div className="auth-input-wrapper">
                  <span className="auth-input-index">04</span>

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    disabled={isBusy}
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={isBusy}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`button button-primary auth-submit ${
                  isEntering ? "auth-submit-loading" : ""
                }`}
                disabled={isBusy}
              >
                {isSubmitting && !isEntering ? (
                  <>
                    <span className="auth-submit-loader" />
                    <span>Creating Workspace</span>
                  </>
                ) : isEntering ? (
                  <>
                    <span className="auth-submit-loader" />
                    <span>Entering Command Center</span>
                  </>
                ) : (
                  <>
                    <span>Create Organization</span>
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            {!isBusy && (
              <>
                <div className="auth-divider">
                  <span />
                  <span>OR</span>
                  <span />
                </div>

                <p className="auth-register-text">
                  Already have an organization account?{" "}
                  <NavLink to="/login">Sign in</NavLink>
                </p>

                <NavLink to="/" className="auth-back-link">
                  <span aria-hidden="true">←</span>
                  Back to CyberGuard
                </NavLink>
              </>
            )}

            {isEntering && (
              <div className="auth-transition-status">
                <div className="auth-transition-status-line">
                  <span className="auth-transition-pulse" />
                  <span>INITIALIZING ORGANIZATION WORKSPACE</span>
                </div>

                <div className="auth-transition-progress">
                  <span />
                </div>

                <div className="auth-transition-meta">
                  <span>CYBERGUARD</span>
                  <span>SETUP → ADMIN DASHBOARD</span>
                </div>
              </div>
            )}

            <div className="auth-card-footer">
              <span>CYBERGUARD</span>
              <span>SECURE ORGANIZATIONAL SETUP</span>
            </div>
          </section>
        </div>
      </div>

      {isEntering && (
        <div className="auth-entry-overlay" aria-hidden="true">
          <div className="auth-entry-logo">
            <div className="auth-entry-ring auth-entry-ring-one" />
            <div className="auth-entry-ring auth-entry-ring-two" />
            <div className="auth-entry-core">
              <span />
            </div>
          </div>

          <div className="auth-entry-label">
            <span>CYBERGUARD</span>
            <strong>ENTERING ADMIN DASHBOARD</strong>
          </div>
        </div>
      )}
    </>
  );
}