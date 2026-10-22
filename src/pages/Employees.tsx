import { useState, useEffect, useRef } from "react";
import { BackendService } from "../services/backendIntegration";
import {
  IconAlertTriangle,
  IconBan,
  IconCheck,
  IconClock,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconUpload,
  IconZap,
} from "../components/Icons";
import type {
  AutomationExecutionResult,
  DepartmentScore,
  EmployeeInput,
  LowScoreEmployee,
} from "../types";

export default function Employees() {
  const [lowScoreEmployees, setLowScoreEmployees] = useState<LowScoreEmployee[]>([]);
  const [departments, setDepartments] = useState<DepartmentScore[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<LowScoreEmployee | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Automation states
  const [isAutomating, setIsAutomating] = useState(false);
  const [isAutoPilotActive, setIsAutoPilotActive] = useState(false);
  const [automationReport, setAutomationReport] = useState<AutomationExecutionResult | null>(null);
  const autoPilotTimerRef = useRef<number | null>(null);

  // Modals for Adding Employee & CSV Upload
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState<EmployeeInput>({
    name: "",
    empId: "",
    email: "",
    department: "Engineering",
    position: "",
  });
  const [employeeFormError, setEmployeeFormError] = useState<string | null>(null);

  // CSV State
  const [csvContent, setCsvContent] = useState("");
  const [csvParsedPreview, setCsvParsedPreview] = useState<EmployeeInput[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isCsvImporting, setIsCsvImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    BackendService.getLowScoreEmployees().then((data) => setLowScoreEmployees(data));
    BackendService.getDepartmentScores().then((data) => setDepartments(data));
  }, []);

  const notify = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 4500);
  };

  // Run the Automated 36h Warning & Suspension Engine
  const handleRunAutomation = async () => {
    setIsAutomating(true);
    try {
      const result = await BackendService.runAutomatedRemediationEngine();
      setLowScoreEmployees(result.updatedEmployees);
      setAutomationReport(result);
      notify(result.message);
    } catch {
      notify("Failed to execute automation cycle.");
    } finally {
      setIsAutomating(false);
    }
  };

  // Toggle Autonomous Auto-Pilot Background Timer
  const handleToggleAutoPilot = () => {
    setIsAutoPilotActive((prev) => {
      const nextState = !prev;
      if (nextState) {
        notify("Autonomous Auto-Pilot ACTIVATED: Monitoring intervals & enforcing warning/suspension rules.");
        autoPilotTimerRef.current = window.setInterval(async () => {
          const res = await BackendService.runAutomatedRemediationEngine();
          setLowScoreEmployees(res.updatedEmployees);
          if (res.warningsSent > 0 || res.accountsSuspended > 0) {
            notify(`[Auto-Pilot] ${res.message}`);
          }
        }, 30000);
      } else {
        if (autoPilotTimerRef.current) {
          window.clearInterval(autoPilotTimerRef.current);
          autoPilotTimerRef.current = null;
        }
        notify("Autonomous Auto-Pilot PAUSED. Manual trigger mode enabled.");
      }
      return nextState;
    });
  };

  useEffect(() => {
    return () => {
      if (autoPilotTimerRef.current) {
        window.clearInterval(autoPilotTimerRef.current);
      }
    };
  }, []);

  // Reset Demo Queue
  const handleResetDemo = async () => {
    const fresh = await BackendService.resetEmployeeRemediationDemo();
    setLowScoreEmployees(fresh);
    notify("Demo queue reset to initial warning cycle states.");
  };

  const handleSendWarning = async (empId: string, slot: 1 | 2 | 3) => {
    const res = await BackendService.sendWarningEmail(empId, slot);
    if (res.success) {
      setLowScoreEmployees((prev) =>
        prev.map((e) => (e.id === empId ? res.employee : e)),
      );
      notify(`Warning Email #${slot} dispatched to ${res.employee.email}`);
    }
  };

  const handleSuspend = async (empId: string) => {
    const res = await BackendService.suspendEmployeeAccount(
      empId,
      "Account suspended: 3x 12-hr warning slots expired without remediation (Data Leakage Risk).",
    );
    if (res.success) {
      setLowScoreEmployees((prev) =>
        prev.map((e) => (e.id === empId ? res.employee : e)),
      );
      notify(`Account for ${res.employee.name} has been SUSPENDED.`);
    }
  };

  const handleReinstate = async (empId: string) => {
    const res = await BackendService.reinstateEmployeeAccount(empId);
    if (res.success) {
      setLowScoreEmployees((prev) =>
        prev.map((e) => (e.id === empId ? res.employee : e)),
      );
      notify(`Account for ${res.employee.name} reinstated successfully.`);
    }
  };

  // Add Individual Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeFormError(null);

    if (!newEmployee.name.trim()) {
      setEmployeeFormError("Employee name is required.");
      return;
    }
    if (!newEmployee.email.trim() || !newEmployee.email.includes("@")) {
      setEmployeeFormError("A valid email address is required.");
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
      setLowScoreEmployees((prev) => [res.employee, ...prev]);
      setShowAddEmpModal(false);
      setNewEmployee({
        name: "",
        empId: "",
        email: "",
        department: departments[0]?.name || "Engineering",
        position: "",
      });
      notify(`Registered ${res.employee.name} (${res.employee.empId}).`);
    } else {
      setEmployeeFormError(res.error || "Failed to add employee.");
    }
  };

  // Remove Employee
  const handleRemoveEmployee = async (emp: LowScoreEmployee) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${emp.name} (${emp.empId})? This action will revoke their credentials.`,
    );
    if (!confirmed) return;

    const res = await BackendService.removeEmployee(emp.id);
    if (res.success) {
      setLowScoreEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      if (selectedEmp?.id === emp.id) setSelectedEmp(null);
      notify(`Employee ${emp.name} (${emp.empId}) removed.`);
    }
  };

  // CSV Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
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
        errors.push(`Row ${i + 1}: Missing name or email.`);
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
    const sample = `name,emp id,email,department,position\nElena Rostova,CG-EMP-108,elena.rostova@cyberguard.internal,Engineering,Senior Cloud Architect\nMarcus Vance,CG-EMP-109,marcus.vance@cyberguard.internal,Finance,Risk Analyst\nSophia Chen,CG-EMP-110,sophia.chen@cyberguard.internal,Legal,Compliance Lead`;
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
      setCsvErrors(["Please select a CSV file first."]);
      return;
    }

    setIsCsvImporting(true);
    try {
      const res = await BackendService.importEmployeesCsv(csvContent);
      if (res.success) {
        setLowScoreEmployees(res.employees);
        setShowCsvModal(false);
        setCsvContent("");
        setCsvParsedPreview([]);
        setCsvErrors([]);
        notify(`Imported ${res.addedCount} employee records via CSV.`);
      } else {
        setCsvErrors(res.errors);
      }
    } catch {
      setCsvErrors(["Failed to process CSV file."]);
    } finally {
      setIsCsvImporting(false);
    }
  };

  return (
    <div className="organization-section employees-page">
      {toastMsg && (
        <div className="dashboard-toast-notification" role="status">
          <span className="toast-bullet" />
          <span>{toastMsg}</span>
        </div>
      )}

      <header className="organization-section-header">
        <div>
          <div className="badge-row">
            <span className="organization-section-eyebrow">
              ORGANIZATION PERSONNEL &amp; RISK
            </span>
            <span className="badge-highlight-red">AUTOMATED 12H WARNING ENGINE</span>
          </div>

          <h1>Employees &amp; Warning Remediation</h1>

          <p>
            Monitor workforce cybersecurity scores. Employees whose posture falls
            below organizational safety standards are provided 3 sequential
            warning emails across three 12-hour time slots. Add or remove
            personnel individually or upload bulk CSV details.
          </p>
        </div>

        <div className="employees-header-stat-chips">
          <div className="emp-stat-chip chip-red">
            <span className="stat-chip-label">Monitored Personnel</span>
            <strong className="stat-chip-num">{lowScoreEmployees.length}</strong>
          </div>
          <div className="emp-stat-chip chip-yellow">
            <span className="stat-chip-label">Active Warning Cycles</span>
            <strong className="stat-chip-num">
              {lowScoreEmployees.filter((e) => e.accountStatus === "warning_active").length}
            </strong>
          </div>
          <div className="emp-stat-chip chip-red">
            <span className="stat-chip-label">Suspended</span>
            <strong className="stat-chip-num">
              {lowScoreEmployees.filter((e) => e.accountStatus === "suspended").length}
            </strong>
          </div>

          <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
            <button
              type="button"
              className="button button-secondary btn-sm"
              onClick={() => setShowCsvModal(true)}
            >
              <IconUpload size={14} className="icon-mr" />
              <span>Upload CSV</span>
            </button>
            <button
              type="button"
              className="button button-primary btn-sm"
              onClick={() => setShowAddEmpModal(true)}
            >
              <IconPlus size={14} className="icon-mr" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3x 12hr Warning System Explanation Banner */}
      <section className="slots-policy-banner">
        <div className="policy-banner-content">
          <div className="policy-banner-title-row">
            <IconClock size={20} className="policy-icon-badge" />
            <h3>Enterprise 36-Hour Remediation Cycle (3 x 12-Hour Slots)</h3>
          </div>
          <p>
            <strong>Slot 1 (0h–12h):</strong> Initial alert sent to employee.
            <span className="policy-divider">·</span>
            <strong>Slot 2 (12h–24h):</strong> Escalation notice with direct device scan instructions.
            <span className="policy-divider">·</span>
            <strong>Slot 3 (24h–36h):</strong> FINAL WARNING: Imminent suspension due to data leakage risk.
            <span className="policy-divider">·</span>
            <strong>After 36h:</strong> Automatic Account Suspension enforced by CyberGuard.
          </p>
        </div>
      </section>

      {/* AUTOMATION CONTROL STRIP */}
      <section className="automation-command-strip">
        <div className="automation-status-group">
          <div className="automation-badge-title">
            <span className={`automation-pulse-dot ${isAutoPilotActive ? "dot-active" : "dot-idle"}`} />
            <strong>36-Hour Automation Engine</strong>
            <span className={`automation-status-pill ${isAutoPilotActive ? "pill-active" : "pill-idle"}`}>
              {isAutoPilotActive ? "AUTONOMOUS MODE ACTIVE" : "MANUAL TRIGGER READY"}
            </span>
          </div>
          <p className="automation-strip-desc">
            Autonomous policy execution: checks interval hours, dispatches sequential 12-hour warning emails, and locks out delinquent accounts exceeding 36 hours.
          </p>
        </div>

        <div className="automation-actions-group">
          <button
            type="button"
            className={`button button-primary automation-run-btn ${isAutomating ? "is-executing" : ""}`}
            onClick={handleRunAutomation}
            disabled={isAutomating}
            title="Execute automated 12h cycle: advances warnings and auto-suspends delinquent accounts"
          >
            <IconZap size={16} className="automation-btn-icon" />
            <span>{isAutomating ? "Running Auto-Cycles..." : "Run Automation Cycle"}</span>
          </button>

          <button
            type="button"
            className={`button button-secondary automation-autopilot-btn ${isAutoPilotActive ? "active-autopilot" : ""}`}
            onClick={handleToggleAutoPilot}
            title={isAutoPilotActive ? "Pause autonomous auto-pilot" : "Enable background automated evaluation"}
          >
            <span className="autopilot-dot" />
            <span>{isAutoPilotActive ? "Auto-Pilot: ON" : "Auto-Pilot: OFF"}</span>
          </button>

          <button
            type="button"
            className="button button-ghost automation-reset-btn"
            onClick={handleResetDemo}
            title="Reset test employees to initial warning slots"
          >
            <IconRefresh size={14} className="icon-mr" />
            <span>Reset Demo Queue</span>
          </button>
        </div>
      </section>

      {/* Low-Score Employees List */}
      <section className="dashboard-low-employees-section">
        <div className="section-header-row">
          <div>
            <span className="badge-highlight-blue">PERSONNEL DIRECTORY &amp; REMEDIATION QUEUE</span>
            <h2>Registered Employees ({lowScoreEmployees.length})</h2>
          </div>
        </div>

        <div className="employees-warning-list">
          {lowScoreEmployees.map((emp) => (
            <article
              key={emp.id}
              className={`employee-warning-card ${
                emp.accountStatus === "suspended" ? "card-status-suspended" : ""
              }`}
            >
              <div className="emp-card-header">
                <div className="emp-profile">
                  <div className="emp-avatar">
                    {emp.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong className="emp-name">{emp.name}</strong>
                      <span className="emp-id-badge">{emp.empId}</span>
                      <span className="emp-position-chip">{emp.position}</span>
                    </div>
                    <span className="emp-email">{emp.email}</span>
                    <small className="emp-dept">{emp.department}</small>
                  </div>
                </div>

                <div className="emp-score-badge">
                  <span className="score-val">{emp.cyberScore}</span>
                  <span className="score-max">/100</span>
                  <span className={emp.cyberScore < 70 ? "badge-danger-high" : "trend-badge trend-up"}>
                    {emp.cyberScore < 70 ? "LOW SCORE" : "COMPLIANT"}
                  </span>
                </div>
              </div>

              <div className="emp-risk-reason">
                <strong>Status / Risk:</strong> <span>{emp.riskReason}</span>
              </div>

              {/* 3x 12hr Warning Slot Tracker */}
              <div className="warning-slots-timeline">
                {emp.warningSlots.map((slot) => {
                  const isSent = slot.status === "sent" || slot.status === "expired";
                  return (
                    <div
                      key={slot.slotNumber}
                      className={`timeline-slot ${isSent ? "slot-sent" : "slot-pending"} ${
                        emp.currentSlot === slot.slotNumber ? "slot-current" : ""
                      }`}
                    >
                      <div className="slot-dot">
                        {isSent ? <IconCheck size={11} /> : slot.slotNumber}
                      </div>
                      <div className="slot-info">
                        <strong>Slot #{slot.slotNumber} ({slot.slotHours})</strong>
                        <span>{slot.title}</span>
                        {slot.sentAt && <small>Dispatched: {slot.sentAt}</small>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status and Action Buttons */}
              <div className="emp-action-bar">
                <div className="emp-current-state">
                  {emp.accountStatus === "suspended" ? (
                    <span className="badge-danger-suspended">
                      <IconBan size={14} className="icon-mr" /> ACCOUNT SUSPENDED (DATA LEAK RISK)
                    </span>
                  ) : (
                    <span className="badge-warning-active">
                      <IconClock size={13} className="icon-mr" /> Active Warning Cycle: Slot #{emp.currentSlot} (
                      {emp.hoursElapsed}h elapsed)
                    </span>
                  )}
                </div>

                <div className="emp-buttons-group">
                  <button
                    type="button"
                    className="button button-secondary btn-sm"
                    onClick={() => setSelectedEmp(emp)}
                  >
                    View Details
                  </button>

                  {emp.accountStatus !== "suspended" ? (
                    <>
                      {emp.currentSlot < 3 && (
                        <button
                          type="button"
                          className="button button-primary btn-sm"
                          onClick={() =>
                            handleSendWarning(
                              emp.id,
                              (emp.currentSlot + 1) as 1 | 2 | 3,
                            )
                          }
                        >
                          Send Slot #{emp.currentSlot + 1} Warning
                        </button>
                      )}

                      <button
                        type="button"
                        className="button button-danger btn-sm"
                        onClick={() => handleSuspend(emp.id)}
                      >
                        Suspend Account
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="button button-primary btn-sm"
                      onClick={() => handleReinstate(emp.id)}
                    >
                      Reinstate Account
                    </button>
                  )}

                  <button
                    type="button"
                    className="button button-ghost btn-sm"
                    onClick={() => handleRemoveEmployee(emp)}
                    title="Remove employee record"
                    style={{ color: "var(--cg-red)" }}
                  >
                    <IconTrash size={14} className="icon-mr" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Modal: View Notice Details */}
      {selectedEmp && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedEmp(null)}
          role="presentation"
        >
          <div
            className="admin-modal-card email-preview-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="emp-modal-title"
          >
            <div className="modal-header">
              <span className="badge-highlight-blue">SECURITY REMEDIATION LOG</span>
              <h2 id="emp-modal-title">Remediation Record: {selectedEmp.name}</h2>
            </div>

            <div className="modal-content-body">
              <p>
                <strong>Employee:</strong> {selectedEmp.name} (<code>{selectedEmp.empId}</code>)
              </p>
              <p>
                <strong>Position:</strong> {selectedEmp.position}
              </p>
              <p>
                <strong>Email:</strong> {selectedEmp.email}
              </p>
              <p>
                <strong>Department:</strong> {selectedEmp.department}
              </p>
              <p>
                <strong>Current Cyber Score:</strong> {selectedEmp.cyberScore}/100
              </p>
              <p>
                <strong>Identified Risk:</strong> {selectedEmp.riskReason}
              </p>
              <p>
                <strong>Active Remediation Slot:</strong> Slot #{selectedEmp.currentSlot} ({selectedEmp.hoursElapsed} hours elapsed out of 36h total limit).
              </p>

              {selectedEmp.suspendedReason && (
                <div className="suspension-audit-card">
                  <IconBan size={22} className="audit-icon text-red" />
                  <div>
                    <strong>Account Suspended</strong>
                    <p>{selectedEmp.suspendedReason}</p>
                    <small>Enforced at: {selectedEmp.suspendedAt}</small>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setSelectedEmp(null)}
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Individual Employee */}
      {showAddEmpModal && (
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
                onClick={() => setShowAddEmpModal(false)}
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
                  <label htmlFor="emp-page-name-input">Full Name *</label>
                  <input
                    id="emp-page-name-input"
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
                  <label htmlFor="emp-page-id-input">Employee ID</label>
                  <input
                    id="emp-page-id-input"
                    type="text"
                    placeholder="e.g. CG-EMP-105"
                    value={newEmployee.empId}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, empId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label htmlFor="emp-page-email-input">Organization Email *</label>
                <input
                  id="emp-page-email-input"
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
                  <label htmlFor="emp-page-dept-input">Department *</label>
                  <select
                    id="emp-page-dept-input"
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
                  <label htmlFor="emp-page-pos-input">Position / Role *</label>
                  <input
                    id="emp-page-pos-input"
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
                  onClick={() => setShowAddEmpModal(false)}
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

      {/* Modal: CSV Upload */}
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

      {/* Modal: Automation Report */}
      {automationReport && (
        <div
          className="admin-modal-overlay"
          onClick={() => setAutomationReport(null)}
          role="presentation"
        >
          <div
            className="admin-modal-card automation-report-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="automation-report-title"
          >
            <div className="modal-header">
              <div className="automation-modal-title-row">
                <span className="badge-highlight-blue">ENGINE AUDIT LOG</span>
                <span className="automation-timestamp-badge">CYBERGUARD AUTO-CYCLE</span>
              </div>
              <h2 id="automation-report-title">Automated Remediation Execution Report</h2>
            </div>

            <div className="modal-content-body">
              <div className="automation-stats-summary-grid">
                <div className="automation-stat-pill pill-blue">
                  <span className="stat-label">Warnings Dispatched</span>
                  <strong className="stat-val">{automationReport.warningsSent}</strong>
                </div>
                <div className="automation-stat-pill pill-red">
                  <span className="stat-label">Accounts Suspended</span>
                  <strong className="stat-val">{automationReport.accountsSuspended}</strong>
                </div>
                <div className="automation-stat-pill pill-green">
                  <span className="stat-label">Total Accounts Evaluated</span>
                  <strong className="stat-val">{automationReport.details.length}</strong>
                </div>
              </div>

              <div className="automation-table-container">
                <table className="automation-audit-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Automated Action</th>
                      <th>Remediation Trigger / Policy Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {automationReport.details.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.employeeName}</strong>
                          <div className="table-sub">{item.employeeEmail}</div>
                        </td>
                        <td>
                          {item.actionTaken === "warning_sent" ? (
                            <span className="badge-warning-active">
                              <IconAlertTriangle size={13} className="icon-mr" /> Warning Slot #{item.slotNumber} Sent
                            </span>
                          ) : item.actionTaken === "account_suspended" ? (
                            <span className="badge-danger-suspended">
                              <IconBan size={13} className="icon-mr" /> Account Suspended
                            </span>
                          ) : (
                            <span className="status-pill status-pill-green">
                              <IconCheck size={12} className="icon-mr" /> Contained
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="audit-reason-text">{item.reason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setAutomationReport(null)}
              >
                Acknowledge &amp; Dismiss Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
