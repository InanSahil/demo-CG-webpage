import { useState, useEffect } from "react";
import { BackendService } from "../services/backendIntegration";
import {
  IconAlertTriangle,
  IconCheck,
  IconPlus,
  IconTrash,
} from "../components/Icons";
import type { DepartmentScore } from "../types";

export default function Departments() {
  const [departments, setDepartments] = useState<DepartmentScore[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentScore | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    BackendService.getDepartmentScores().then((data) => setDepartments(data));
  }, []);

  const notify = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newDeptName.trim()) {
      setFormError("Department name cannot be blank.");
      return;
    }

    const res = await BackendService.addDepartment(newDeptName.trim());
    if (res.success) {
      setDepartments((prev) => [...prev, res.department]);
      setShowAddModal(false);
      setNewDeptName("");
      notify(`Department '${res.department.name}' created successfully.`);
    } else {
      setFormError(res.error || "Failed to create department.");
    }
  };

  const handleRemoveDepartment = async (dept: DepartmentScore, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `Are you sure you want to remove the '${dept.name}' department? This action will remove the organizational unit record.`,
    );
    if (!confirmed) return;

    const res = await BackendService.removeDepartment(dept.id);
    if (res.success) {
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
      if (selectedDept?.id === dept.id) setSelectedDept(null);
      notify(`Department '${dept.name}' removed.`);
    }
  };

  const averageScore =
    departments.length > 0
      ? Math.round(
          departments.reduce((total, d) => total + d.averageScore, 0) /
            departments.length,
        )
      : 78;

  const lowDepts = departments.filter((d) => d.isLowScoreWarning);
  const totalHeadcount = departments.reduce((total, d) => total + d.headCount, 0);

  return (
    <div className="departments-page organization-section">
      {toastMsg && (
        <div className="dashboard-toast-notification" role="status">
          <span className="toast-bullet" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER: Upper add button removed as requested; stats formatted as structured pill cards */}
      <header className="organization-section-header departments-header">
        <div>
          <div className="badge-row">
            <span className="organization-section-eyebrow">
              ORGANIZATION RISK HIERARCHY
            </span>
            {lowDepts.length > 0 && (
              <span className="badge-danger-high">
                <IconAlertTriangle size={14} className="icon-mr" /> {lowDepts.length} DEPARTMENTS BELOW 70 THRESHOLD
              </span>
            )}
          </div>

          <h1>Department Risk Analysis</h1>

          <p>
            Monitor department cybersecurity posture across the enterprise. Units
            with average cyber scores below 70 are flagged for data leakage
            vulnerabilities and undergo the 3-stage 12-hour warning remediation cycle.
          </p>
        </div>

        <div className="departments-header-stats">
          <div className="dept-stat-pill pill-blue">
            <span className="stat-pill-label">Total Departments</span>
            <strong className="stat-pill-value">{departments.length}</strong>
          </div>
          <div className="dept-stat-pill pill-green">
            <span className="stat-pill-label">Avg Cyber Score</span>
            <strong className="stat-pill-value">{averageScore}/100</strong>
          </div>
          <div className={`dept-stat-pill ${lowDepts.length > 0 ? "pill-red" : "pill-green"}`}>
            <span className="stat-pill-label">At Risk (&lt;70)</span>
            <strong className="stat-pill-value">{lowDepts.length}</strong>
          </div>
        </div>
      </header>

      {/* DEPARTMENT-WISE CYBER SCORE GRAPH */}
      <section className="dashboard-department-graph-section">
        <div className="department-graph-header">
          <div>
            <div className="badge-row">
              <span className="badge-highlight-blue">ENTERPRISE GRAPH ANALYSIS</span>
              {lowDepts.length > 0 && (
                <span className="badge-danger-high">
                  <IconAlertTriangle size={14} className="icon-mr" /> {lowDepts.length} LOW SCORE DEPARTMENTS AT RISK
                </span>
              )}
            </div>
            <h2>Department Cyber Score Graph Analysis</h2>
            <p>
              Average risk scores calculated across personnel in each unit.
              Departments below 70 are exposed to data leakage risks and undergo
              the 3-stage 12-hour warning remediation cycle.
            </p>
          </div>

          <div className="graph-legend">
            <span className="legend-item legend-safe">● Safe (&ge; 70)</span>
            <span className="legend-item legend-warning">● Warning (&lt; 70)</span>
            <span className="legend-benchmark">--- Benchmark (70)</span>
          </div>
        </div>

        <div className="department-graph-container">
          <div className="graph-benchmark-line" title="Security Threshold (70/100)" />

          <div className="graph-bars-grid">
            {departments.map((dept) => {
              const isLow = dept.isLowScoreWarning;
              return (
                <div
                  key={dept.id}
                  className={`dept-graph-column ${
                    isLow ? "dept-column-warning" : "dept-column-safe"
                  }`}
                  onClick={() => setSelectedDept(dept)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="dept-bar-value">
                    <strong>{dept.averageScore}</strong>
                    <small>/100</small>
                  </div>

                  <div className="dept-bar-track">
                    <div
                      className={`dept-bar-fill ${
                        isLow ? "bar-fill-warning" : "bar-fill-safe"
                      }`}
                      style={{ height: `${dept.averageScore}%` }}
                    >
                      {isLow && <span className="warning-pulse-dot" />}
                    </div>
                  </div>

                  <div className="dept-bar-meta">
                    <strong className="dept-name">{dept.name}</strong>
                    <span className="dept-count">{dept.headCount} personnel</span>
                    {isLow && (
                      <span className="dept-warning-chip">LEAKAGE RISK</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {lowDepts.length > 0 && (
          <div className="low-score-warning-banner">
            <IconAlertTriangle size={20} className="banner-icon text-red" />
            <div className="banner-text">
              <strong>
                Department Threat Notice: {lowDepts.map((d) => d.name).join(", ")}
              </strong>
              <p>
                Scores have dropped below organizational safety threshold (70).
                Automated 12-hour warning emails are currently active for all
                flagged personnel to remediate data leakage vectors.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* LOWER PART: DEPARTMENT DIRECTORY WITH ADD DEPARTMENT BUTTON & CARD */}
      <section className="organization-panel">
        <div className="organization-panel-header">
          <div>
            <span>DEPARTMENT DIRECTORY</span>
            <h2>All Organizational Units</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span className="organization-panel-meta">
              {totalHeadcount} TOTAL PERSONNEL
            </span>
            <button
              type="button"
              className="button button-primary btn-sm"
              onClick={() => setShowAddModal(true)}
              title="Add an individual department unit"
            >
              <IconPlus size={14} className="icon-mr" />
              <span>Add Department</span>
            </button>
          </div>
        </div>

        <div className="department-units-grid" style={{ padding: "16px" }}>
          {departments.map((dept) => {
            const isLow = dept.isLowScoreWarning;
            return (
              <div
                key={dept.id}
                className={`dept-unit-card ${
                  isLow ? "dept-unit-warning" : "dept-unit-safe"
                }`}
                onClick={() => setSelectedDept(dept)}
                style={{ cursor: "pointer" }}
              >
                <div className="unit-card-header">
                  <div>
                    <span className="unit-dept-tag">Department Unit</span>
                    <h3>{dept.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="button-icon-danger-sm"
                    onClick={(e) => handleRemoveDepartment(dept, e)}
                    title={`Remove department '${dept.name}'`}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>

                <div className="unit-card-metrics">
                  <div className="unit-metric-box">
                    <span className="metric-box-title">Avg Score</span>
                    <strong
                      className={`metric-box-val ${
                        isLow ? "text-red" : "text-green"
                      }`}
                    >
                      {dept.averageScore} / 100
                    </strong>
                  </div>

                  <div className="unit-metric-box">
                    <span className="metric-box-title">Personnel</span>
                    <strong className="metric-box-val">
                      {dept.headCount} Employees
                    </strong>
                  </div>
                </div>

                <div className="unit-card-footer">
                  {isLow ? (
                    <span className="unit-status-warning">
                      <IconAlertTriangle size={13} className="icon-mr" /> Data Leakage Risk · Below 70
                    </span>
                  ) : (
                    <span className="unit-status-safe">
                      <IconCheck size={13} className="icon-mr" /> Benchmark Met (&ge; 70)
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Lower Part Add Department Card */}
          <div
            className="dept-unit-card dept-unit-add-new"
            onClick={() => setShowAddModal(true)}
            role="button"
            tabIndex={0}
          >
            <div className="add-unit-inner">
              <span className="add-unit-icon">
                <IconPlus size={24} />
              </span>
              <strong>Add Department Unit</strong>
              <p>Create an individual organizational department</p>
              <small>(Departments created individually only)</small>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL: Add Individual Department */}
      {showAddModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card directory-form-modal">
            <div className="modal-header-standard">
              <div>
                <span className="badge-highlight-blue">INDIVIDUAL CREATION</span>
                <h3>Create Department Unit</h3>
              </div>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="modal-form-content">
              {formError && <div className="form-error-banner">{formError}</div>}

              <p className="modal-note-text">
                Department units can only be created or removed individually (CSV bulk import is restricted to employee personnel).
              </p>

              <div className="form-field-group">
                <label htmlFor="dept-name-create-input">Department Name *</label>
                <input
                  id="dept-name-create-input"
                  type="text"
                  required
                  placeholder="e.g. Information Security, Legal, Research & Development"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Department Detail */}
      {selectedDept && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedDept(null)}
          role="presentation"
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="dept-modal-title"
          >
            <div className="modal-header">
              <span className={selectedDept.isLowScoreWarning ? "badge-danger-critical" : "badge-highlight-blue"}>
                {selectedDept.isLowScoreWarning ? "CRITICAL RISK AUDIT" : "DEPARTMENT PROFILE"}
              </span>
              <h2 id="dept-modal-title">{selectedDept.name}</h2>
            </div>

            <div className="modal-content-body">
              <p>
                <strong>Average Score:</strong> {selectedDept.averageScore}/100
              </p>
              <p>
                <strong>Personnel Headcount:</strong> {selectedDept.headCount} active employees
              </p>
              <p>
                <strong>Risk Classification:</strong> {selectedDept.riskLevel}
              </p>
              <p>
                <strong>Security Trend:</strong> {selectedDept.trend.toUpperCase()}
              </p>
              {selectedDept.isLowScoreWarning && (
                <div className="anomaly-warning-text">
                  <IconAlertTriangle size={15} className="icon-mr text-red" /> This department's average security score has triggered the 3-stage 12-hour warning cycle across personnel to eliminate data leakage vectors.
                </div>
              )}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setSelectedDept(null)}
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
