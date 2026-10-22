import { useState, useEffect } from "react";
import { BackendService } from "../services/backendIntegration";
import { IconAlertTriangle } from "../components/Icons";
import type { DepartmentScore } from "../types";

export default function CyberScore() {
  const [departments, setDepartments] = useState<DepartmentScore[]>([]);

  useEffect(() => {
    BackendService.getDepartmentScores().then((depts) => {
      setDepartments(depts);
    });
  }, []);

  const overallAvg =
    departments.length > 0
      ? Math.round(
          departments.reduce((acc, d) => acc + d.averageScore, 0) /
            departments.length,
        )
      : 78;

  const lowDepts = departments.filter((d) => d.isLowScoreWarning);

  return (
    <div className="organization-section cyber-score-page">
      <header className="organization-section-header">
        <div>
          <div className="badge-row">
            <span className="organization-section-eyebrow">
              SECURITY ANALYTICS &amp; FORENSICS
            </span>
            <span className="badge-highlight-blue">ENTERPRISE AUDIT</span>
          </div>

          <h1>Cyber Score &amp; Risk Posture Analysis</h1>

          <p>
            Holistic organizational posture analysis combining enterprise department-wise
            risk tracking, benchmark compliance, and data leakage defense across your workforce.
          </p>
        </div>

        <div className="score-header-stats">
          <div className="header-score-pill">
            <span>Overall Score:</span>
            <strong className={overallAvg < 70 ? "text-danger" : "text-success"}>
              {overallAvg}/100
            </strong>
          </div>
        </div>
      </header>

      {/* DEPARTMENT GRAPH ANALYSIS */}
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
      </section>
    </div>
  );
}
