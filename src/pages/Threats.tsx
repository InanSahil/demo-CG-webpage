import { useState, useEffect } from "react";
import { BackendService } from "../services/backendIntegration";
import { useAuth } from "../context/AuthContext";
import { IconAlertTriangle, IconCheck, IconShield } from "../components/Icons";
import type { AdminThreatIncident } from "../types";

type ThreatSeverity = "Critical" | "High" | "Medium";

interface GeneralThreat {
  id: string;
  type: string;
  source: string;
  severity: ThreatSeverity;
  target: string;
  time: string;
  status: "Active" | "Contained" | "Mitigated";
}

const generalThreats: GeneralThreat[] = [
  {
    id: "THR-001",
    type: "Phishing URL Attack Vector",
    source: "Gateway Heuristic Filter",
    severity: "Critical",
    target: "Corporate Inboxes & Communication Gateways",
    time: "10:42 AM",
    status: "Active",
  },
  {
    id: "THR-002",
    type: "Deepfake Voice Clone Injection",
    source: "Audio Neural Forensic Filter",
    severity: "High",
    target: "Executive Call Verification",
    time: "09:36 AM",
    status: "Contained",
  },
  {
    id: "THR-003",
    type: "QR Code Reverse Proxy Phish",
    source: "Camera OCR Scanner",
    severity: "High",
    target: "Finance Invoicing Terminal",
    time: "09:12 AM",
    status: "Active",
  },
  {
    id: "THR-004",
    type: "Unauthorized Credential Exfiltration",
    source: "Identity Behavior Heuristics",
    severity: "Critical",
    target: "Admin SuperUser Session",
    time: "08:48 AM",
    status: "Active",
  },
];

export default function Threats() {
  const { user } = useAuth();
  const [adminIncidents, setAdminIncidents] = useState<AdminThreatIncident[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<GeneralThreat | null>(null);
  const [voteToast, setVoteToast] = useState<string | null>(null);

  useEffect(() => {
    BackendService.getAdminThreatIncidents().then((data) =>
      setAdminIncidents(data),
    );
  }, []);

  const notify = (msg: string) => {
    setVoteToast(msg);
    window.setTimeout(() => setVoteToast(null), 4000);
  };

  const handleCastAdminVote = async (
    incidentId: string,
    decision: "suspend" | "clear",
  ) => {
    const voterEmail = user?.email || "sarah.connor@cyberguard.internal";
    const res = await BackendService.castAdminVote(
      incidentId,
      voterEmail,
      decision,
    );
    if (res.success) {
      setAdminIncidents((prev) =>
        prev.map((inc) => (inc.id === incidentId ? res.incident : inc)),
      );
      if (res.incident.status === "suspended") {
        notify(
          `MAJORITY REACHED: Admin ${res.incident.compromisedAdminName} is now SUSPENDED.`,
        );
      } else {
        notify(`Vote recorded: ${decision.toUpperCase()} by ${voterEmail}`);
      }
    }
  };

  return (
    <div className="organization-section threats-page">
      {voteToast && (
        <div className="dashboard-toast-notification" role="status">
          <span className="toast-bullet" />
          <span>{voteToast}</span>
        </div>
      )}

      <header className="organization-section-header">
        <div>
          <div className="badge-row">
            <span className="organization-section-eyebrow">
              REAL-TIME THREAT RADAR
            </span>
            <span className="badge-highlight-red">CRITICAL HEURISTICS ACTIVE</span>
          </div>

          <h1>Threat Center &amp; Admin Consensus</h1>

          <p>
            Continuous detection of phishing, deepfakes, and internal account
            compromise. If a threat is detected on an administrator, it is
            reported to all peer admins for majority vote suspension.
          </p>
        </div>

        <div className="threats-header-pills">
          <span className="stat-pill-red">Critical: 2</span>
          <span className="stat-pill-yellow">High: 2</span>
          <span className="stat-pill-green">Mitigated: 98.4%</span>
        </div>
      </header>

      {/* ADMIN THREAT DETECTION & PEER MAJORITY CONSENSUS SYSTEM */}
      {adminIncidents.map((incident) => (
        <section
          key={incident.id}
          className={`admin-threat-consensus-panel ${
            incident.status === "suspended"
              ? "threat-status-suspended"
              : "threat-status-active"
          }`}
        >
          <div className="consensus-panel-header">
            <div className="consensus-title-group">
              <span className="badge-danger-critical">
                {incident.status === "suspended"
                  ? "ADMIN SUSPENDED BY MAJORITY"
                  : "CRITICAL ADMIN THREAT DETECTED"}
              </span>
              <h2>{incident.threatTitle}</h2>
            </div>
            <span className="consensus-time-tag">{incident.detectedAt}</span>
          </div>

          <div className="consensus-body">
            <div className="consensus-description-card">
              <div className="compromised-admin-profile">
                <IconAlertTriangle size={24} className="admin-avatar-warning text-red" />
                <div className="admin-profile-details">
                  <div className="admin-name-row">
                    <strong>{incident.compromisedAdminName}</strong>
                  </div>
                  <span className="admin-email-text">{incident.compromisedAdminEmail}</span>
                </div>
                <span className="threat-type-pill">{incident.threatType}</span>
              </div>
              <p>{incident.anomalyDescription}</p>

              {incident.status === "suspended" && (
                <div className="majority-resolved-notice">
                  <IconCheck size={16} className="resolved-check text-green" />
                  <div>
                    <strong>Action Enforced: Privileges Revoked</strong>
                    <p>
                      3 out of 5 Administrators reached majority consensus. This
                      admin account has been suspended and cryptographic session
                      tokens revoked.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Voting Console */}
            <div className="consensus-voting-box">
              <div className="voting-box-heading">
                <span>ADMIN CONSENSUS COMMITTEE</span>
                <strong>Majority Vote Required (3 of 5)</strong>
              </div>

              <div className="vote-tally-bar">
                <div className="vote-tally-labels">
                  <span className="votes-suspend-label">
                    Suspend Votes: {incident.votesToSuspend.length} / 5
                  </span>
                  <span className="votes-needed">
                    {incident.votesToSuspend.length >= 3
                      ? "Majority Met"
                      : `${3 - incident.votesToSuspend.length} more needed`}
                  </span>
                </div>

                <div className="vote-progress-track">
                  <div
                    className="vote-progress-fill"
                    style={{
                      width: `${(incident.votesToSuspend.length / 5) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Voter list */}
              <div className="voters-list">
                <span className="voters-title">Recorded Admin Votes:</span>
                <div className="voters-chips">
                  {incident.votesToSuspend.map((voter) => (
                    <span key={voter} className="voter-chip vote-suspend">
                      <IconCheck size={12} className="icon-mr" /> {voter.split("@")[0]} (Suspend)
                    </span>
                  ))}
                  {incident.votesToClear.map((voter) => (
                    <span key={voter} className="voter-chip vote-clear">
                      ○ {voter.split("@")[0]} (Clear)
                    </span>
                  ))}
                </div>
              </div>

              {/* Cast Vote Buttons */}
              {incident.status === "voting_active" && (
                <div className="voting-action-buttons">
                  <button
                    type="button"
                    className="button button-danger vote-btn-suspend"
                    onClick={() => handleCastAdminVote(incident.id, "suspend")}
                  >
                    <span>Vote to Suspend Admin</span>
                    <IconShield size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="button button-secondary vote-btn-clear"
                    onClick={() => handleCastAdminVote(incident.id, "clear")}
                  >
                    <span>Vote to Clear / False Alarm</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* GENERAL THREATS RADAR */}
      <section className="organization-panel general-threats-panel">
        <div className="organization-panel-header">
          <div>
            <span>ACTIVE INCIDENT QUEUE</span>
            <h2>Detected Threat Feeds</h2>
          </div>
          <span className="organization-panel-meta">LIVE FEED</span>
        </div>

        <div className="threats-table-wrapper">
          <table className="threats-table">
            <thead>
              <tr>
                <th>Threat Vector</th>
                <th>Detection Source</th>
                <th>Target Asset</th>
                <th>Severity</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {generalThreats.map((thr) => (
                <tr key={thr.id} className="threat-table-row">
                  <td>
                    <strong>{thr.type}</strong>
                    <div className="table-sub">{thr.id}</div>
                  </td>
                  <td>{thr.source}</td>
                  <td>
                    <code>{thr.target}</code>
                  </td>
                  <td>
                    <span
                      className={`badge-severity ${
                        thr.severity === "Critical"
                          ? "badge-danger-critical"
                          : "badge-danger-high"
                      }`}
                    >
                      {thr.severity}
                    </span>
                  </td>
                  <td>{thr.time}</td>
                  <td>
                    <span className="status-pill status-pill-yellow">
                      {thr.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="button button-secondary btn-sm"
                      onClick={() => setSelectedThreat(thr)}
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: Threat Investigation */}
      {selectedThreat && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedThreat(null)}
          role="presentation"
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="threat-modal-title"
          >
            <div className="modal-header">
              <span className="badge-danger-critical">
                {selectedThreat.severity.toUpperCase()} SEVERITY
              </span>
              <h2 id="threat-modal-title">{selectedThreat.type}</h2>
            </div>

            <div className="modal-content-body">
              <div className="threat-inspect-details">
                <p>
                  <strong>Identifier:</strong> {selectedThreat.id}
                </p>
                <p>
                  <strong>Detection Engine:</strong> {selectedThreat.source}
                </p>
                <p>
                  <strong>Target Vector:</strong> {selectedThreat.target}
                </p>
                <p>
                  <strong>Timestamp:</strong> Today at {selectedThreat.time}
                </p>
                <p>
                  <strong>Remediation Strategy:</strong> Automated neural
                  containment rule executed. Payload blocked from reaching the
                  internal network.
                </p>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setSelectedThreat(null)}
              >
                Close Forensics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}