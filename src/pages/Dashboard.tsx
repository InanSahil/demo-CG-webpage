import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { BackendService } from "../services/backendIntegration";
import {
  IconActivity,
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconClock,
  IconDownload,
  IconLaptop,
  IconLayers,
  IconPlus,
  IconRefresh,
  IconShield,
  IconTrash,
  IconUpload,
  IconUsers,
  IconZap,
} from "../components/Icons";
import type {
  AdminThreatIncident,
  DepartmentScore,
  EmployeeInput,
  LowScoreEmployee,
  OrganizationDevice,
} from "../types";

export default function Dashboard() {
  const { user } = useAuth();

  // Core Data States
  const [departments, setDepartments] = useState<DepartmentScore[]>([]);
  const [employees, setEmployees] = useState<LowScoreEmployee[]>([]);
  const [devices, setDevices] = useState<OrganizationDevice[]>([]);
  const [adminThreats, setAdminThreats] = useState<AdminThreatIncident[]>([]);

  // Workforce Directory Active Tab: 'employees' | 'departments' | 'escalations'
  const [directoryTab, setDirectoryTab] = useState<
    "employees" | "departments" | "escalations"
  >("employees");

  // Search filter for personnel
  const [searchQuery, setSearchQuery] = useState("");

  // Automation / Action States
  const [isAutomating, setIsAutomating] = useState(false);
  const [lastAutomationRun, setLastAutomationRun] = useState<string | null>(null);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Modals
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [selectedDeviceForSuspension, setSelectedDeviceForSuspension] =
    useState<OrganizationDevice | null>(null);
  const [adminSuspendReason, setAdminSuspendReason] = useState(
    "Unplanned off-hours login detected from unverified IP & untrusted location. Immediate suspension enforced by administrator authority.",
  );
  const [showApiIntegrationDrawer, setShowApiIntegrationDrawer] = useState(false);

  // Form State: Add Employee (name, emp id, email, department, position)
  const [newEmployee, setNewEmployee] = useState<EmployeeInput>({
    name: "",
    empId: "",
    email: "",
    department: "Engineering",
    position: "",
  });
  const [employeeFormError, setEmployeeFormError] = useState<string | null>(null);

  // Form State: Add Department (name only, individual)
  const [newDeptName, setNewDeptName] = useState("");
  const [deptFormError, setDeptFormError] = useState<string | null>(null);

  // CSV Upload States
  const [csvContent, setCsvContent] = useState("");
  const [csvParsedPreview, setCsvParsedPreview] = useState<EmployeeInput[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isCsvImporting, setIsCsvImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      BackendService.getDepartmentScores(),
      BackendService.getLowScoreEmployees(),
      BackendService.getOrganizationDevices(),
      BackendService.getAdminThreatIncidents(),
    ]).then(([depts, emps, devs, threats]) => {
      if (isMounted) {
        setDepartments(depts);
        setEmployees(emps);
        setDevices(devs);
        setAdminThreats(threats);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const notify = (msg: string) => {
    setActionNotification(msg);
    window.setTimeout(() => setActionNotification(null), 4500);
  };

  // ============================================================
  // AUTO-RUN 36-HOUR REMEDIATION ENGINE
  // ============================================================
  const handleRunAutoCycle = async () => {
    setIsAutomating(true);
    try {
      const res = await BackendService.runAutomatedRemediationEngine();
      setEmployees(res.updatedEmployees);
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLastAutomationRun(timeStr);
      notify(
        `[Automated 36h Engine] Cycle Executed: ${res.warningsSent} warnings dispatched, ${res.accountsSuspended} accounts suspended.`,
      );
    } catch {
      notify("Failed to trigger automated remediation cycle.");
    } finally {
      setIsAutomating(false);
    }
  };

  // Warning Email action (individual slot)
  const handleSendWarning = async (empId: string, slot: 1 | 2 | 3) => {
    const result = await BackendService.sendWarningEmail(empId, slot);
    if (result.success) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? result.employee : e)),
      );
      notify(`Warning Email #${slot} dispatched to ${result.employee.email}`);
    }
  };

  // Employee account suspension
  const handleSuspendEmployee = async (empId: string) => {
    const result = await BackendService.suspendEmployeeAccount(
      empId,
      "Account suspended automatically: 3x 12-hr warning slots expired without remediation (Data Leakage Risk).",
    );
    if (result.success) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === empId ? result.employee : e)),
      );
      notify(`Account for ${result.employee.name} has been SUSPENDED.`);
    }
  };

  // Device suspension by Admin Permission
  const confirmSuspendDevice = async () => {
    if (!selectedDeviceForSuspension) return;
    const adminEmail = user?.email || "admin.lead@cyberguard.internal";
    const result = await BackendService.suspendDeviceByAdmin(
      selectedDeviceForSuspension.id,
      adminEmail,
      adminSuspendReason,
    );

    if (result.success) {
      setDevices((prev) =>
        prev.map((d) => (d.id === result.device.id ? result.device : d)),
      );
      notify(
        `Device ${result.device.name} (${result.device.assignedEmail}) SUSPENDED under admin authority.`,
      );
      setSelectedDeviceForSuspension(null);
    }
  };

  // Admin Threat Majority Voting
  const handleCastAdminVote = async (
    incidentId: string,
    decision: "suspend" | "clear",
  ) => {
    const voterEmail = user?.email || "sarah.connor@cyberguard.internal";
    const result = await BackendService.castAdminVote(
      incidentId,
      voterEmail,
      decision,
    );

    if (result.success) {
      setAdminThreats((prev) =>
        prev.map((inc) => (inc.id === incidentId ? result.incident : inc)),
      );
      if (result.incident.status === "suspended") {
        notify(
          `CONSENSUS REACHED: Admin ${result.incident.compromisedAdminName} is now SUSPENDED.`,
        );
      } else {
        notify(`Vote recorded: ${decision.toUpperCase()} by ${voterEmail}`);
      }
    }
  };

  // ============================================================
  // WORKFORCE & DEPARTMENT MANAGEMENT HANDLERS
  // ============================================================

  // Add Individual Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeFormError(null);

    if (!newEmployee.name.trim()) {
      setEmployeeFormError("Employee name is required.");
      return;
    }
    if (!newEmployee.email.trim() || !newEmployee.email.includes("@")) {
      setEmployeeFormError("A valid employee email address is required.");
      return;
    }

    const autoEmpId =
      newEmployee.empId.trim() ||
      `CG-EMP-${Math.floor(100 + Math.random() * 900)}`;

    const res = await BackendService.addEmployee({
      ...newEmployee,
      empId: autoEmpId,
      position: newEmployee.position.trim() || "Security Personnel",
    });

    if (res.success) {
      setEmployees((prev) => [res.employee, ...prev]);
      // refresh departments for updated headcount
      const updatedDepts = await BackendService.getDepartmentScores();
      setDepartments(updatedDepts);
      setShowAddEmployeeModal(false);
      setNewEmployee({
        name: "",
        empId: "",
        email: "",
        department: departments[0]?.name || "Engineering",
        position: "",
      });
      notify(`Employee ${res.employee.name} (${res.employee.empId}) successfully registered.`);
    } else {
      setEmployeeFormError(res.error || "Failed to add employee.");
    }
  };

  // Remove Individual Employee
  const handleRemoveEmployee = async (emp: LowScoreEmployee) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${emp.name} (${emp.empId}) from the organization? This will also remove their credentials and revoke access.`,
    );
    if (!confirmed) return;

    const res = await BackendService.removeEmployee(emp.id);
    if (res.success) {
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      const updatedDepts = await BackendService.getDepartmentScores();
      setDepartments(updatedDepts);
      notify(`Employee ${emp.name} (${emp.empId}) removed from organization.`);
    }
  };

  // Add Individual Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptFormError(null);

    if (!newDeptName.trim()) {
      setDeptFormError("Department name cannot be blank.");
      return;
    }

    const res = await BackendService.addDepartment(newDeptName.trim());
    if (res.success) {
      setDepartments((prev) => [...prev, res.department]);
      setShowAddDeptModal(false);
      setNewDeptName("");
      notify(`Department '${res.department.name}' created successfully.`);
    } else {
      setDeptFormError(res.error || "Failed to create department.");
    }
  };

  // Remove Individual Department
  const handleRemoveDepartment = async (dept: DepartmentScore) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove the '${dept.name}' department? Personnel assigned to this unit will need reassignment.`,
    );
    if (!confirmed) return;

    const res = await BackendService.removeDepartment(dept.id);
    if (res.success) {
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
      notify(`Department '${dept.name}' removed.`);
    }
  };

  // CSV File Handler & Parsing Preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCsvPreview(text);
    };
    reader.readAsText(file);
  };

  const parseCsvPreview = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      setCsvErrors(["CSV file must have a header row and at least one data row."]);
      setCsvParsedPreview([]);
      return;
    }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const nameIdx = header.findIndex((h) => h.includes("name"));
    const empIdIdx = header.findIndex((h) => h.includes("id") || h.includes("emp"));
    const emailIdx = header.findIndex((h) => h.includes("mail"));
    const deptIdx = header.findIndex((h) => h.includes("dept") || h.includes("department"));
    const posIdx = header.findIndex((h) => h.includes("position") || h.includes("role") || h.includes("title"));

    const errors: string[] = [];
    const previewList: EmployeeInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const name = nameIdx !== -1 ? cols[nameIdx] || "" : cols[0] || "";
      const empId = empIdIdx !== -1 ? cols[empIdIdx] || "" : cols[1] || "";
      const email = emailIdx !== -1 ? cols[emailIdx] || "" : cols[2] || "";
      const dept = deptIdx !== -1 ? cols[deptIdx] || "Operations" : cols[3] || "Operations";
      const pos = posIdx !== -1 ? cols[posIdx] || "Personnel" : cols[4] || "Personnel";

      if (!name || !email) {
        errors.push(`Row ${i + 1}: Missing required name or email.`);
      } else {
        previewList.push({
          name,
          empId: empId || `CG-EMP-${100 + i}`,
          email,
          department: dept,
          position: pos,
        });
      }
    }

    setCsvErrors(errors);
    setCsvParsedPreview(previewList);
  };

  const handleDownloadCsvTemplate = () => {
    const sample = `name,emp id,email,department,position\nElena Rostova,CG-EMP-108,elena.rostova@cyberguard.internal,Engineering,Senior Cloud Architect\nMarcus Vance,CG-EMP-109,marcus.vance@cyberguard.internal,Finance,Risk Analyst\nSophia Chen,CG-EMP-110,sophia.chen@cyberguard.internal,Legal,Compliance Lead\nVikram Patel,CG-EMP-111,vikram.patel@cyberguard.internal,Operations,Infrastructure Specialist`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cyberguard_employees_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = async () => {
    if (!csvContent.trim()) {
      setCsvErrors(["Please select or drag a CSV file first."]);
      return;
    }

    setIsCsvImporting(true);
    try {
      const res = await BackendService.importEmployeesCsv(csvContent);
      if (res.success) {
        setEmployees(res.employees);
        const updatedDepts = await BackendService.getDepartmentScores();
        setDepartments(updatedDepts);
        setShowCsvModal(false);
        setCsvContent("");
        setCsvParsedPreview([]);
        setCsvErrors([]);
        notify(
          `Successfully imported ${res.addedCount} employee records via CSV batch ingestion.`,
        );
      } else {
        setCsvErrors(res.errors);
      }
    } catch {
      setCsvErrors(["Failed to process CSV file."]);
    } finally {
      setIsCsvImporting(false);
    }
  };

  // Calculations
  const displayName = user?.full_name?.trim() || "Security Administrator";
  const lowDepts = departments.filter((d) => d.isLowScoreWarning);
  const anomalousDevices = devices.filter(
    (d) => d.isUnplannedAnomaly && d.status !== "Suspended",
  );
  const activeEscalations = employees.filter(
    (e) => e.accountStatus !== "suspended",
  );
  const suspendedEmployees = employees.filter(
    (e) => e.accountStatus === "suspended",
  );

  const overallAvgScore =
    departments.length > 0
      ? Math.round(
          departments.reduce((acc, d) => acc + d.averageScore, 0) /
            departments.length,
        )
      : 78;

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.empId.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-page admin-redesigned-dashboard">
      {/* Toast Notification */}
      {actionNotification && (
        <div className="dashboard-toast-notification" role="status">
          <span className="toast-bullet" />
          <span>{actionNotification}</span>
        </div>
      )}

      {/* ============================================================
          SECTION 1: EXECUTIVE COMMAND HEADER
          ============================================================ */}
      <section className="dashboard-heading">
        <div>
          <div className="dashboard-badge-row">
            <span className="dashboard-eyebrow">ENTERPRISE COMMAND CENTER</span>
            <span className="badge-highlight-blue">ZERO TRUST ACTIVE</span>
          </div>

          <h1>Executive Security Overview</h1>

          <p>
            Welcome, {displayName}. Real-time organizational risk posture,
            departmental cyber score benchmarks, and workforce lifecycle
            governance.
          </p>
        </div>
      </section>

      {/* ============================================================
          SECTION 2: PROMINENT AUTO-RUN 36-HOUR CYCLE HERO BANNER
          ============================================================ */}
      <section className="dashboard-auto-run-hero">
        <div className="auto-run-hero-left">
          <div className="auto-run-badge-row">
            <span className="hero-status-pill">
              <span className="hero-pulse-dot" />
              <span>36-HOUR AUTOMATED REMEDIATION ENGINE</span>
            </span>
            {lastAutomationRun && (
              <span className="hero-last-run-tag">
                Last Run: {lastAutomationRun}
              </span>
            )}
          </div>

          <div className="auto-run-title-group">
            <h2>Automated 3-Stage 12h Warning &amp; Account Suspension Engine</h2>
            <p>
              High-risk personnel undergo a strict 36-hour remediation protocol
              split into three 12-hour slots. If remedial action is not taken
              before slot expiration, delinquent accounts are automatically
              suspended to prevent critical data leakage.
            </p>
          </div>

          <div className="auto-run-stats-row">
            <div className="hero-stat-chip chip-blue">
              <span className="stat-label">Monitored Personnel</span>
              <strong className="stat-val">{employees.length}</strong>
            </div>
            <div className="hero-stat-chip chip-red">
              <span className="stat-label">Active Escalations</span>
              <strong className="stat-val">{activeEscalations.length}</strong>
            </div>
            <div className="hero-stat-chip chip-green">
              <span className="stat-label">Accounts Suspended</span>
              <strong className="stat-val">{suspendedEmployees.length}</strong>
            </div>
          </div>
        </div>

        <div className="auto-run-hero-action">
          <button
            type="button"
            className={`button button-primary auto-run-hero-button ${
              isAutomating ? "is-executing" : ""
            }`}
            onClick={handleRunAutoCycle}
            disabled={isAutomating}
            title="Trigger automated 36-hour remediation engine now"
          >
            <IconZap size={18} className="hero-btn-icon" />
            <div className="hero-btn-text">
              <strong>{isAutomating ? "Executing Cycle..." : "Auto-Run 36h Cycle"}</strong>
              <small>Advance slots &amp; enforce suspensions</small>
            </div>
          </button>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: STANDOUT HIGHLIGHT METRIC CARDS (RED, GREEN, BLUE)
          ============================================================ */}
      <section className="admin-metrics-grid">
        <div className="admin-metric-card metric-blue">
          <div className="metric-header">
            <span className="metric-label">Overall Cyber Score</span>
            <IconActivity size={18} className="metric-icon" />
          </div>
          <div className="metric-number-row">
            <span className="metric-big-number">{overallAvgScore}</span>
            <span className="metric-sub-number">/100</span>
          </div>
          <div className="metric-footer">
            <span className="metric-tag tag-blue">Threshold: &ge; 70</span>
            <span className="metric-note">Across {departments.length} departments</span>
          </div>
        </div>

        <div className="admin-metric-card metric-red">
          <div className="metric-header">
            <span className="metric-label">Department Risk</span>
            <IconAlertTriangle size={18} className="metric-icon" />
          </div>
          <div className="metric-number-row">
            <span className="metric-big-number text-red">{lowDepts.length}</span>
            <span className="metric-sub-number">Below 70</span>
          </div>
          <div className="metric-footer">
            <span className="metric-tag tag-red">
              {lowDepts.length > 0 ? "Data Leakage Risk" : "Compliant"}
            </span>
            <span className="metric-note">
              {lowDepts.map((d) => d.name).join(", ") || "All Clear"}
            </span>
          </div>
        </div>

        <div className="admin-metric-card metric-red">
          <div className="metric-header">
            <span className="metric-label">12h Warning Cycles</span>
            <IconClock size={18} className="metric-icon" />
          </div>
          <div className="metric-number-row">
            <span className="metric-big-number text-red">
              {activeEscalations.length}
            </span>
            <span className="metric-sub-number">Escalating</span>
          </div>
          <div className="metric-footer">
            <span className="metric-tag tag-red">3-Slot Protocol</span>
            <span className="metric-note">36h Max Runway</span>
          </div>
        </div>

        <div className="admin-metric-card metric-green">
          <div className="metric-header">
            <span className="metric-label">Monitored Fleet</span>
            <IconLaptop size={18} className="metric-icon" />
          </div>
          <div className="metric-number-row">
            <span className="metric-big-number text-green">{devices.length}</span>
            <span className="metric-sub-number">
              {anomalousDevices.length > 0
                ? `· ${anomalousDevices.length} Flagged`
                : "· All Normal"}
            </span>
          </div>
          <div className="metric-footer">
            <span className="metric-tag tag-green">Zero Trust Auditing</span>
            <span className="metric-note">Unplanned login monitoring</span>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: CRITICAL ADMIN THREAT DETECTION & MAJORITY VOTING
          ============================================================ */}
      {adminThreats.map((incident) => (
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
                <IconAlertTriangle
                  size={24}
                  className="admin-avatar-warning text-red"
                />
                <div className="admin-profile-details">
                  <div className="admin-name-row">
                    <strong>{incident.compromisedAdminName}</strong>
                  </div>
                  <span className="admin-email-text">
                    {incident.compromisedAdminEmail}
                  </span>
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
                      Majority consensus (3 of 5 Administrators) achieved. This
                      account is suspended and credentials revoked.
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
                      <IconCheck size={12} className="icon-mr" />{" "}
                      {voter.split("@")[0]} (Suspend)
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

      {/* ============================================================
          SECTION 5: DEPARTMENT CYBER SCORE GRAPH ANALYSIS
          ============================================================ */}
      <section className="dashboard-department-graph-section">
        <div className="department-graph-header">
          <div>
            <div className="badge-row">
              <span className="badge-highlight-blue">ENTERPRISE GRAPH ANALYSIS</span>
              {lowDepts.length > 0 && (
                <span className="badge-danger-high">
                  <IconAlertTriangle size={14} className="icon-mr" />{" "}
                  {lowDepts.length} DEPARTMENTS BELOW 70 BENCHMARK
                </span>
              )}
            </div>
            <h2>Department Cyber Score Graph Analysis</h2>
            <p>
              Average organizational security score calculated across each unit.
              Departments below the 70 benchmark threshold are flagged for active
              data leakage risk.
            </p>
          </div>

          <div className="graph-header-actions">
            <div className="graph-legend">
              <span className="legend-item legend-safe">● Safe (&ge; 70)</span>
              <span className="legend-item legend-warning">● Warning (&lt; 70)</span>
              <span className="legend-benchmark">--- Benchmark (70)</span>
            </div>

            <Link
              to="/departments"
              className="button button-secondary btn-sm"
              title="View full department breakdown"
            >
              <span>View Department Breakdown →</span>
            </Link>
          </div>
        </div>

        {/* Visual Graph with SVG & HTML Bars */}
        <div className="department-graph-container">
          <div
            className="graph-benchmark-line"
            title="Organizational Safety Benchmark (70/100)"
          />

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
                      <span className="dept-warning-chip">DATA LEAK RISK</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low-Score Department Warning Notice */}
        {lowDepts.length > 0 && (
          <div className="low-score-warning-banner">
            <IconAlertTriangle size={22} className="banner-icon text-red" />
            <div className="banner-text">
              <strong>
                Low-Score Notice: {lowDepts.map((d) => d.name).join(", ")}
              </strong>
              <p>
                Average scores have fallen below the 70 benchmark. Automated
                warning email sequences are active to remediate policy compliance
                and prevent credential/data leakage.
              </p>
            </div>
            <Link to="/departments" className="button button-secondary btn-sm">
              Review Department Details →
            </Link>
          </div>
        )}
      </section>

      {/* ============================================================
          SECTION 6: WORKFORCE & ORGANIZATION DIRECTORY MANAGEMENT
          (Add/Remove Employee, CSV Upload, Individual Add/Remove Dept)
          ============================================================ */}
      <section className="workforce-directory-section">
        <div className="workforce-directory-header">
          <div className="directory-header-titles">
            <span className="badge-highlight-blue">ORGANIZATION DIRECTORY</span>
            <h2>Workforce &amp; Department Management</h2>
            <p>
              Admin control console to add or remove individual employees, upload
              bulk personnel data via CSV, and manage department units individually.
            </p>
          </div>

          <div className="directory-header-actions">
            <button
              type="button"
              className="button button-secondary btn-sm"
              onClick={() => setShowAddDeptModal(true)}
              title="Add a new individual department"
            >
              <IconPlus size={14} className="icon-mr" />
              <span>Add Department</span>
            </button>

            <button
              type="button"
              className="button button-secondary btn-sm"
              onClick={() => setShowCsvModal(true)}
              title="Upload employee details CSV file"
            >
              <IconUpload size={14} className="icon-mr" />
              <span>Upload CSV</span>
            </button>

            <button
              type="button"
              className="button button-primary btn-sm"
              onClick={() => setShowAddEmployeeModal(true)}
              title="Add an individual employee"
            >
              <IconPlus size={14} className="icon-mr" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Directory Sub-Tabs and Search Bar */}
        <div className="workforce-directory-controls">
          <div className="directory-tabs-group">
            <button
              type="button"
              className={`directory-tab-button ${
                directoryTab === "employees" ? "active" : ""
              }`}
              onClick={() => setDirectoryTab("employees")}
            >
              <IconUsers size={15} className="icon-mr" />
              <span>Employees Directory ({employees.length})</span>
            </button>

            <button
              type="button"
              className={`directory-tab-button ${
                directoryTab === "departments" ? "active" : ""
              }`}
              onClick={() => setDirectoryTab("departments")}
            >
              <IconLayers size={15} className="icon-mr" />
              <span>Department Units ({departments.length})</span>
            </button>

            <button
              type="button"
              className={`directory-tab-button ${
                directoryTab === "escalations" ? "active" : ""
              }`}
              onClick={() => setDirectoryTab("escalations")}
            >
              <IconClock size={15} className="icon-mr" />
              <span>12h Warning Escalations ({activeEscalations.length})</span>
            </button>
          </div>

          {directoryTab === "employees" && (
            <div className="directory-search-box">
              <input
                type="text"
                placeholder="Search by name, emp id, email, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="directory-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* TAB 1: EMPLOYEES DIRECTORY */}
        {directoryTab === "employees" && (
          <div className="workforce-table-card">
            <div className="table-responsive">
              <table className="workforce-data-table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name &amp; Position</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Cyber Score</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty-row">
                        No employees found matching &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr
                        key={emp.id}
                        className={
                          emp.accountStatus === "suspended"
                            ? "row-suspended"
                            : ""
                        }
                      >
                        <td>
                          <span className="emp-id-badge">{emp.empId}</span>
                        </td>
                        <td>
                          <div className="emp-identity-cell">
                            <strong>{emp.name}</strong>
                            <span className="emp-position-label">
                              {emp.position}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="emp-email-text">{emp.email}</span>
                        </td>
                        <td>
                          <span className="emp-dept-badge">
                            {emp.department}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`cyber-score-pill ${
                              emp.cyberScore < 70 ? "score-low" : "score-good"
                            }`}
                          >
                            {emp.cyberScore} / 100
                          </span>
                        </td>
                        <td>
                          {emp.accountStatus === "suspended" ? (
                            <span className="status-chip-suspended">
                              <IconBan size={12} className="icon-mr" /> Suspended
                            </span>
                          ) : emp.accountStatus === "warning_active" ? (
                            <span className="status-chip-warning">
                              <IconClock size={12} className="icon-mr" /> Slot #{emp.currentSlot} Warning
                            </span>
                          ) : (
                            <span className="status-chip-active">
                              <IconCheck size={12} className="icon-mr" /> Active
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="table-actions-group">
                            <button
                              type="button"
                              className="button-icon-danger"
                              onClick={() => handleRemoveEmployee(emp)}
                              title={`Remove ${emp.name} (${emp.empId})`}
                            >
                              <IconTrash size={15} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="workforce-table-footer">
              <span>Showing {filteredEmployees.length} of {employees.length} registered personnel</span>
              <div className="footer-quick-csv">
                <span>Need bulk setup?</span>
                <button
                  type="button"
                  className="inline-link-btn"
                  onClick={() => setShowCsvModal(true)}
                >
                  Upload CSV file
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEPARTMENT UNITS (Individual Management Only) */}
        {directoryTab === "departments" && (
          <div className="department-units-grid">
            {departments.map((dept) => {
              const isLow = dept.isLowScoreWarning;
              return (
                <div
                  key={dept.id}
                  className={`dept-unit-card ${
                    isLow ? "dept-unit-warning" : "dept-unit-safe"
                  }`}
                >
                  <div className="unit-card-header">
                    <div>
                      <span className="unit-dept-tag">Department Unit</span>
                      <h3>{dept.name}</h3>
                    </div>
                    <button
                      type="button"
                      className="button-icon-danger-sm"
                      onClick={() => handleRemoveDepartment(dept)}
                      title={`Remove department '${dept.name}'`}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>

                  <div className="unit-card-metrics">
                    <div className="unit-metric-box">
                      <span className="metric-box-title">Average Cyber Score</span>
                      <strong
                        className={`metric-box-val ${
                          isLow ? "text-red" : "text-green"
                        }`}
                      >
                        {dept.averageScore} / 100
                      </strong>
                    </div>

                    <div className="unit-metric-box">
                      <span className="metric-box-title">Assigned Personnel</span>
                      <strong className="metric-box-val">
                        {dept.headCount} Members
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

            {/* Quick Add Department Card */}
            <div
              className="dept-unit-card dept-unit-add-new"
              onClick={() => setShowAddDeptModal(true)}
              role="button"
              tabIndex={0}
            >
              <div className="add-unit-inner">
                <span className="add-unit-icon">
                  <IconPlus size={24} />
                </span>
                <strong>Add Department Unit</strong>
                <p>Create an individual organizational department.</p>
                <small>(Departments are added individually only)</small>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ACTIVE 12H WARNING ESCALATIONS */}
        {directoryTab === "escalations" && (
          <div className="panel-escalations-list">
            {employees
              .filter((e) => e.accountStatus !== "active")
              .map((emp) => (
                <div
                  key={emp.id}
                  className={`panel-escalation-item ${
                    emp.accountStatus === "suspended" ? "item-suspended" : ""
                  }`}
                >
                  <div className="escalation-item-top">
                    <div className="emp-mini-info">
                      <div className="emp-identity-row">
                        <strong>{emp.name}</strong>
                        <span className="emp-id-badge">{emp.empId}</span>
                        <span className="emp-position-chip">{emp.position}</span>
                      </div>
                      <span>
                        {emp.department} · {emp.email}
                      </span>
                    </div>
                    <div className="emp-mini-score">
                      <span
                        className={
                          emp.cyberScore < 70
                            ? "score-badge-red"
                            : "score-badge-green"
                        }
                      >
                        {emp.cyberScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="escalation-risk-note">
                    <span>Risk Reason: {emp.riskReason}</span>
                  </div>

                  {/* 3-Slot Visual Tracker */}
                  <div className="mini-slot-tracker">
                    {emp.warningSlots.map((slot) => {
                      const isSent =
                        slot.status === "sent" || slot.status === "expired";
                      const isCurrent = emp.currentSlot === slot.slotNumber;
                      return (
                        <div
                          key={slot.slotNumber}
                          className={`mini-slot-badge ${
                            isSent
                              ? "slot-completed"
                              : isCurrent
                                ? "slot-active"
                                : ""
                          }`}
                          title={`Slot #${slot.slotNumber} (${slot.slotHours})`}
                        >
                          <span className="mini-slot-number">
                            {isSent ? (
                              <IconCheck size={11} />
                            ) : (
                              `#${slot.slotNumber}`
                            )}
                          </span>
                          <span className="mini-slot-label">
                            {slot.slotHours}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="escalation-item-actions">
                    {emp.accountStatus === "suspended" ? (
                      <span className="status-suspended-pill">
                        <IconBan size={13} className="icon-mr" /> Account Suspended
                      </span>
                    ) : (
                      <>
                        {emp.currentSlot < 3 && (
                          <button
                            type="button"
                            className="button button-primary btn-xs"
                            onClick={() =>
                              handleSendWarning(
                                emp.id,
                                (emp.currentSlot + 1) as 1 | 2 | 3,
                              )
                            }
                          >
                            Send Slot #{emp.currentSlot + 1} Warning (12h)
                          </button>
                        )}
                        <button
                          type="button"
                          className="button button-danger btn-xs"
                          onClick={() => handleSuspendEmployee(emp.id)}
                        >
                          Suspend Account Immediately
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ============================================================
          SECTION 7: UNPLANNED LOGIN & DEVICE ACTIVATION ALERTS
          ============================================================ */}
      <section className="dashboard-panel-card">
        <div className="panel-card-header">
          <div>
            <span className="badge-highlight-blue">DEVICE POSTURE</span>
            <h3>Unplanned Login Alerts</h3>
            <p>
              Logins detected outside approved hours or untrusted locations.
              Administrator permission required for immediate lockout.
            </p>
          </div>
          <Link to="/devices" className="panel-link-action">
            View all {devices.length} Devices →
          </Link>
        </div>

        <div className="panel-device-alerts-list">
          {anomalousDevices.length === 0 ? (
            <div className="panel-empty-alert">
              <IconCheck size={20} className="empty-icon-green" />
              <strong>No Active Device Anomalies</strong>
              <p>
                All monitored endpoints are currently operating within planned
                hours and locations.
              </p>
            </div>
          ) : (
            anomalousDevices.map((device) => (
              <div key={device.id} className="anomalous-device-item">
                <div className="anomaly-item-header">
                  <IconAlertTriangle
                    size={16}
                    className="anomaly-warning-icon text-red"
                  />
                  <div className="anomaly-device-title">
                    <strong>{device.name}</strong>
                    <span>
                      {device.assignedEmail} · {device.os}
                    </span>
                  </div>
                  <span className="anomaly-badge">UNPLANNED LOGIN</span>
                </div>

                <div className="anomaly-details-grid">
                  <div>
                    <small>Expected Schedule</small>
                    <strong>{device.plannedSchedule}</strong>
                    <span>{device.plannedLocation}</span>
                  </div>
                  <div>
                    <small>Detected Anomaly</small>
                    <strong className="text-red">
                      {device.lastLoginTime}
                    </strong>
                    <span className="text-red">
                      {device.lastLoginLocation} ({device.lastLoginIp})
                    </span>
                  </div>
                </div>

                <div className="anomaly-action-row">
                  <button
                    type="button"
                    className="button button-danger btn-sm"
                    onClick={() => setSelectedDeviceForSuspension(device)}
                  >
                    <span>Authorize Device Suspension</span>
                    <IconShield size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ============================================================
          SECTION 8: SPECIALIZED ADMINISTRATION SHORTCUTS
          (Incidents, CyberScore & Policies removed; Cleaned Hub)
          ============================================================ */}
      <section className="admin-command-hub-section">
        <div className="hub-header">
          <span className="badge-highlight-blue">ADMINISTRATION SHORTCUTS</span>
          <h2>Command Center Portals</h2>
        </div>

        <div className="hub-cards-grid">
          <Link to="/threats" className="hub-card">
            <span className="hub-card-icon">
              <IconShield size={20} />
            </span>
            <div className="hub-card-content">
              <strong>Threat Center</strong>
              <p>
                Real-time threat vectors, mitigation protocols, and perimeter
                defense logs.
              </p>
            </div>
            <span className="hub-card-arrow">→</span>
          </Link>

          <Link to="/departments" className="hub-card">
            <span className="hub-card-icon">
              <IconLayers size={20} />
            </span>
            <div className="hub-card-content">
              <strong>Department Audits</strong>
              <p>
                Headcount risk breakdowns, benchmark analyses, and individual
                department setup.
              </p>
            </div>
            <span className="hub-card-arrow">→</span>
          </Link>

          <Link to="/employees" className="hub-card">
            <span className="hub-card-icon">
              <IconUsers size={20} />
            </span>
            <div className="hub-card-content">
              <strong>Employee Warnings &amp; Directory</strong>
              <p>
                Manage the 3-stage 12h warning sequence, remediation, and bulk CSV
                roster.
              </p>
            </div>
            <span className="hub-card-arrow">→</span>
          </Link>

          <Link to="/devices" className="hub-card">
            <span className="hub-card-icon">
              <IconLaptop size={20} />
            </span>
            <div className="hub-card-content">
              <strong>Device &amp; Hardware Fleet</strong>
              <p>
                Endpoint activation status, hardware health, and IP location
                tracking.
              </p>
            </div>
            <span className="hub-card-arrow">→</span>
          </Link>

          <Link to="/settings" className="hub-card">
            <span className="hub-card-icon">
              <IconRefresh size={20} />
            </span>
            <div className="hub-card-content">
              <strong>Security Settings &amp; API</strong>
              <p>
                Configure credentials, zero-trust thresholds, and webhook
                integrations.
              </p>
            </div>
            <span className="hub-card-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ============================================================
          MODAL 1: ADD INDIVIDUAL EMPLOYEE
          (name, emp id, email, department, position)
          ============================================================ */}
      {showAddEmployeeModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card directory-form-modal">
            <div className="modal-header-standard">
              <div>
                <span className="badge-highlight-blue">INDIVIDUAL REGISTRATION</span>
                <h3>Add New Employee</h3>
              </div>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setShowAddEmployeeModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="modal-form-content">
              {employeeFormError && (
                <div className="form-error-banner">{employeeFormError}</div>
              )}

              <div className="form-row-2col">
                <div className="form-field-group">
                  <label htmlFor="emp-name-input">Full Name *</label>
                  <input
                    id="emp-name-input"
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={newEmployee.name}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="emp-id-input">Employee ID</label>
                  <input
                    id="emp-id-input"
                    type="text"
                    placeholder="e.g. CG-EMP-105 (Auto-generated if blank)"
                    value={newEmployee.empId}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, empId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="emp-email-input">Organization Email *</label>
                <input
                  id="emp-email-input"
                  type="email"
                  required
                  placeholder="rachel.adams@cyberguard.internal"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                />
              </div>

              <div className="form-row-2col">
                <div className="form-field-group">
                  <label htmlFor="emp-dept-input">Department *</label>
                  <select
                    id="emp-dept-input"
                    value={newEmployee.department}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        department: e.target.value,
                      })
                    }
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field-group">
                  <label htmlFor="emp-position-input">Position / Role *</label>
                  <input
                    id="emp-position-input"
                    type="text"
                    required
                    placeholder="e.g. Senior Security Architect"
                    value={newEmployee.position}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        position: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setShowAddEmployeeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Register Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: UPLOAD CSV FILE OF EMPLOYEE DETAILS
          (name, emp id, email, department, position)
          ============================================================ */}
      {showCsvModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card csv-uploader-modal">
            <div className="modal-header-standard">
              <div>
                <span className="badge-highlight-blue">BULK INGESTION</span>
                <h3>Upload Employees CSV</h3>
              </div>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setShowCsvModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="csv-modal-body">
              <p>
                Import employee records in bulk. Required columns:{" "}
                <code>name, emp id, email, department, position</code>.
              </p>

              <div className="csv-template-bar">
                <span>Need the standard template?</span>
                <button
                  type="button"
                  className="button button-secondary btn-xs"
                  onClick={handleDownloadCsvTemplate}
                >
                  <IconDownload size={13} className="icon-mr" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Drag and Drop / Selector Dropzone */}
              <div
                className="csv-dropzone-box"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept=".csv,text/csv"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <IconUpload size={32} className="dropzone-icon" />
                <strong>Click to choose or drag a CSV file here</strong>
                <span>Supports .csv with comma separation</span>
              </div>

              {/* Errors Display */}
              {csvErrors.length > 0 && (
                <div className="csv-error-list">
                  <strong>Errors detected:</strong>
                  <ul>
                    {csvErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Preview Table */}
              {csvParsedPreview.length > 0 && (
                <div className="csv-preview-section">
                  <div className="preview-header">
                    <strong>Preview ({csvParsedPreview.length} rows detected):</strong>
                  </div>
                  <div className="table-responsive preview-table-container">
                    <table className="csv-preview-table">
                      <thead>
                        <tr>
                          <th>Emp ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsedPreview.map((row, idx) => (
                          <tr key={idx}>
                            <td><code>{row.empId}</code></td>
                            <td>{row.name}</td>
                            <td>{row.email}</td>
                            <td>{row.department}</td>
                            <td>{row.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowCsvModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={handleImportCsv}
                disabled={csvParsedPreview.length === 0 || isCsvImporting}
              >
                {isCsvImporting
                  ? "Importing..."
                  : `Import ${csvParsedPreview.length} Employees`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 3: ADD INDIVIDUAL DEPARTMENT (Individual Only)
          ============================================================ */}
      {showAddDeptModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card directory-form-modal">
            <div className="modal-header-standard">
              <div>
                <span className="badge-highlight-blue">INDIVIDUAL DEPARTMENT UNIT</span>
                <h3>Add New Department</h3>
              </div>
              <button
                type="button"
                className="modal-close-x"
                onClick={() => setShowAddDeptModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="modal-form-content">
              {deptFormError && (
                <div className="form-error-banner">{deptFormError}</div>
              )}

              <p className="modal-note-text">
                Note: Per organization governance policy, department units can only
                be created or removed individually (CSV import is restricted to
                personnel).
              </p>

              <div className="form-field-group">
                <label htmlFor="dept-name-input">Department Name *</label>
                <input
                  id="dept-name-input"
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
                  onClick={() => setShowAddDeptModal(false)}
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

      {/* ============================================================
          MODAL 4: SUSPEND DEVICE BY ADMIN CONFIRMATION MODAL
          ============================================================ */}
      {selectedDeviceForSuspension && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true">
          <div className="admin-modal-card">
            <div className="modal-header-danger">
              <IconAlertTriangle size={22} className="modal-icon text-red" />
              <h3>Enforce Admin Device Suspension</h3>
            </div>

            <div className="modal-body">
              <p>
                You are about to suspend{" "}
                <strong>{selectedDeviceForSuspension.name}</strong> assigned to{" "}
                <code>{selectedDeviceForSuspension.assignedEmail}</code>.
              </p>

              <div className="modal-alert-box">
                <strong>Detected Anomaly:</strong>
                <div>
                  Last login at {selectedDeviceForSuspension.lastLoginTime} from{" "}
                  {selectedDeviceForSuspension.lastLoginLocation} (
                  {selectedDeviceForSuspension.lastLoginIp}).
                </div>
              </div>

              <label className="modal-label" htmlFor="suspend-reason-input">
                Administrative Justification:
              </label>
              <textarea
                id="suspend-reason-input"
                className="modal-textarea"
                rows={3}
                value={adminSuspendReason}
                onChange={(e) => setAdminSuspendReason(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSelectedDeviceForSuspension(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={confirmSuspendDevice}
              >
                Confirm &amp; Suspend Immediately
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BACKEND API INTEGRATION SCOPE DRAWER
          ============================================================ */}
      {showApiIntegrationDrawer && (
        <div
          className="api-drawer-overlay active"
          onClick={() => setShowApiIntegrationDrawer(false)}
          aria-hidden="true"
        >
          <div
            className="api-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Backend Integration Scope"
          >
            <div className="api-drawer-header">
              <div>
                <span className="badge-highlight-blue">
                  BACKEND INTEGRATION SCOPE
                </span>
                <h3>Enterprise REST &amp; Workforce Endpoints</h3>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setShowApiIntegrationDrawer(false)}
              >
                ✕
              </button>
            </div>

            <div className="api-drawer-content">
              <p>
                All CyberGuard dashboard components are wired into a typed,
                service-oriented architecture via <code>BackendService</code>. Connect
                to your production backend by pointing <code>VITE_API_URL</code>.
              </p>

              <div className="endpoint-block">
                <span className="method-get">GET</span>
                <code>/api/v1/departments/scores</code>
                <p>
                  Returns department list with 70 benchmark status and average scores.
                </p>
              </div>

              <div className="endpoint-block">
                <span className="method-post">POST</span>
                <code>/api/v1/departments</code>
                <p>Creates an individual department unit (individual only).</p>
              </div>

              <div className="endpoint-block">
                <span className="method-delete">DELETE</span>
                <code>/api/v1/departments/:id</code>
                <p>Removes an individual department unit.</p>
              </div>

              <div className="endpoint-block">
                <span className="method-get">GET</span>
                <code>/api/v1/employees</code>
                <p>Returns personnel directory with emp id, email, position &amp; warnings.</p>
              </div>

              <div className="endpoint-block">
                <span className="method-post">POST</span>
                <code>/api/v1/employees</code>
                <p>Registers individual employee with name, empId, email, department, position.</p>
              </div>

              <div className="endpoint-block">
                <span className="method-post">POST</span>
                <code>/api/v1/employees/import-csv</code>
                <p>Batch parses and imports employee details CSV with schema validation.</p>
              </div>

              <div className="endpoint-block">
                <span className="method-post">POST</span>
                <code>/api/v1/automation/run-36h-cycle</code>
                <p>Executes automated 3-slot 12h cycle and suspends expired accounts.</p>
              </div>

              <div className="endpoint-block">
                <span className="method-post">POST</span>
                <code>/api/v1/devices/:id/suspend</code>
                <p>Admin permission device suspension with justification payload.</p>
              </div>

              <div className="endpoint-block">
                <span className="method-post">POST</span>
                <code>/api/v1/admin-threats/:id/vote</code>
                <p>
                  Casts majority consensus vote (suspend/clear) for compromised admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
