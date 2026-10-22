import { useState, useEffect } from "react";
import { BackendService } from "../services/backendIntegration";
import { useAuth } from "../context/AuthContext";
import {
  IconAlertTriangle,
  IconLaptop,
  IconMonitor,
  IconShield,
  IconSmartphone,
} from "../components/Icons";
import type { OrganizationDevice } from "../types";

export default function Devices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<OrganizationDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<OrganizationDevice | null>(null);
  const [suspendingDevice, setSuspendingDevice] = useState<OrganizationDevice | null>(null);
  const [adminReason, setAdminReason] = useState(
    "Unplanned off-hours login detected from unverified IP/location. Immediate admin suspension enforced to prevent data leakage.",
  );
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    BackendService.getOrganizationDevices().then((data) => {
      if (isMounted) setDevices(data);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const notify = (msg: string) => {
    setStatusNotification(msg);
    window.setTimeout(() => setStatusNotification(null), 4000);
  };

  const handleAdminSuspend = async () => {
    if (!suspendingDevice) return;
    const adminEmail = user?.email || "admin.lead@cyberguard.internal";
    const res = await BackendService.suspendDeviceByAdmin(
      suspendingDevice.id,
      adminEmail,
      adminReason,
    );

    if (res.success) {
      setDevices((prev) =>
        prev.map((d) => (d.id === res.device.id ? res.device : d)),
      );
      notify(`Device ${res.device.name} (${res.device.assignedEmail}) SUSPENDED by admin.`);
      setSuspendingDevice(null);
    }
  };

  const handleReactivate = async (device: OrganizationDevice) => {
    const res = await BackendService.activateDevice(device.id);
    if (res.success) {
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? res.device : d)),
      );
      notify(`Device ${res.device.name} reactivated to ACTIVE status.`);
    }
  };

  const activeCount = devices.filter((d) => d.status === "Active").length;
  const reviewCount = devices.filter((d) => d.status === "Review").length;
  const suspendedCount = devices.filter((d) => d.status === "Suspended").length;
  const anomalousCount = devices.filter((d) => d.isUnplannedAnomaly && d.status !== "Suspended").length;

  return (
    <div className="devices-page organization-section">
      {statusNotification && (
        <div className="dashboard-toast-notification" role="status">
          <span className="toast-bullet" />
          <span>{statusNotification}</span>
        </div>
      )}

      <header className="organization-section-header devices-header">
        <div>
          <div className="badge-row">
            <span className="organization-section-eyebrow">
              SECURITY OPERATIONS &amp; ASSET MONITORING
            </span>
            {anomalousCount > 0 && (
              <span className="badge-danger-high">
                <IconAlertTriangle size={14} className="icon-mr" /> {anomalousCount} UNPLANNED LOGINS DETECTED
              </span>
            )}
          </div>

          <h1>Device Activation &amp; Login Monitoring</h1>

          <p>
            Surveillance of corporate emails and hardware provided by the
            organization. Any login occurring at unplanned hours or anomalous
            geographic locations requires administrative permission to suspend
            the endpoint and protect enterprise data assets.
          </p>
        </div>

        <div className="devices-header-meta">
          <div className="emp-stat-chip chip-green">
            <span className="stat-chip-label">Active</span>
            <strong className="stat-chip-num">{activeCount}</strong>
          </div>
          <div className="emp-stat-chip chip-yellow">
            <span className="stat-chip-label">Review</span>
            <strong className="stat-chip-num">{reviewCount}</strong>
          </div>
          <div className="emp-stat-chip chip-red">
            <span className="stat-chip-label">Suspended</span>
            <strong className="stat-chip-num">{suspendedCount}</strong>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="device-stat-grid">
        <article className="organization-stat-card card-stat-blue">
          <span>Total Organization Devices</span>
          <strong>{devices.length}</strong>
          <p>Assigned to corporate personnel</p>
        </article>

        <article className="organization-stat-card card-stat-green">
          <span>Active &amp; Compliant</span>
          <strong>{activeCount}</strong>
          <p>Within planned time &amp; location</p>
        </article>

        <article className="organization-stat-card card-stat-yellow">
          <span>Under Security Review</span>
          <strong>{reviewCount}</strong>
          <p>Pending admin verification</p>
        </article>

        <article className="organization-stat-card card-stat-red">
          <span>Suspended by Admin</span>
          <strong>{suspendedCount}</strong>
          <p>Access disabled (Data Leak Risk)</p>
        </article>
      </section>

      {/* Anomalous Unplanned Logins Alert Section */}
      {anomalousCount > 0 && (
        <section className="anomalous-logins-alert-box">
          <div className="alert-box-header">
            <span className="alert-pulse-red" />
            <div>
              <h3>High Risk: Unplanned Time or Location Login Detected</h3>
              <p>
                The following organization-issued devices recorded authentication
                sessions violating scheduled shifts or originating from untrusted
                foreign IP ranges. Admin authorization is enabled to suspend
                access immediately.
              </p>
            </div>
          </div>

          <div className="anomalous-cards-list">
            {devices
              .filter((d) => d.isUnplannedAnomaly && d.status !== "Suspended")
              .map((device) => (
                <div key={device.id} className="anomalous-device-card">
                  <div className="anomalous-card-top">
                    <div>
                      <strong>{device.name}</strong>
                      <span className="employee-name-sub">({device.employeeName})</span>
                    </div>
                    <span className="badge-danger-critical">UNPLANNED LOGIN</span>
                  </div>

                  <div className="anomalous-details-grid">
                    <div>
                      <small>Corporate Email</small>
                      <code>{device.assignedEmail}</code>
                    </div>
                    <div>
                      <small>Expected Schedule &amp; Origin</small>
                      <span>{device.plannedSchedule} · {device.plannedLocation}</span>
                    </div>
                    <div>
                      <small>Actual Login Event</small>
                      <strong className="text-danger">
                        {device.lastLoginTime} from {device.lastLoginLocation} ({device.lastLoginIp})
                      </strong>
                    </div>
                  </div>

                  {device.anomalyDetails && (
                    <div className="anomaly-warning-text">
                      <IconAlertTriangle size={14} className="icon-mr text-red" /> {device.anomalyDetails}
                    </div>
                  )}

                  <div className="anomalous-card-actions">
                    <button
                      type="button"
                      className="button button-danger btn-sm"
                      onClick={() => setSuspendingDevice(device)}
                    >
                      Suspend Device with Admin Permission
                    </button>
                    <button
                      type="button"
                      className="button button-secondary btn-sm"
                      onClick={() => setSelectedDevice(device)}
                    >
                      View Forensic Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Full Device Directory Table */}
      <section className="organization-panel device-directory-panel">
        <div className="organization-panel-header">
          <div>
            <span>ORGANIZATION DIRECTORY</span>
            <h2>All Registered Hardware &amp; Employee Emails</h2>
          </div>
          <span className="organization-panel-meta">
            {devices.length} ASSIGNED ENDPOINTS
          </span>
        </div>

        <div className="device-table-header">
          <span>Device / Hostname</span>
          <span>Assigned Email &amp; User</span>
          <span>Planned Parameters</span>
          <span>Last Recorded Session</span>
          <span>Status</span>
          <span>Admin Actions</span>
        </div>

        <div className="device-list">
          {devices.map((device) => (
            <article
              key={device.id}
              className={`device-row ${
                device.isUnplannedAnomaly && device.status !== "Suspended"
                  ? "device-row-anomalous"
                  : device.status === "Suspended"
                    ? "device-row-suspended"
                    : "device-row-active"
              }`}
            >
              <div className="device-identity">
                <span className="device-icon">
                  {device.type === "Laptop" ? (
                    <IconLaptop size={18} />
                  ) : device.type === "Desktop" ? (
                    <IconMonitor size={18} />
                  ) : (
                    <IconSmartphone size={18} />
                  )}
                </span>
                <div>
                  <strong>{device.name}</strong>
                  <span>{device.os} · {device.deviceId}</span>
                </div>
              </div>

              <div className="device-owner">
                <strong>{device.assignedEmail}</strong>
                <span>{device.employeeName}</span>
              </div>

              <div className="device-platform">
                <strong>{device.plannedSchedule}</strong>
                <span>{device.plannedLocation}</span>
              </div>

              <div className="device-last-active">
                <strong>{device.lastLoginTime}</strong>
                <span>{device.lastLoginLocation}</span>
                {device.isUnplannedAnomaly && device.status !== "Suspended" && (
                  <span className="anomaly-chip">ANOMALY DETECTED</span>
                )}
              </div>

              <div className="device-status-column">
                <span
                  className={`status-pill ${
                    device.status === "Active"
                      ? "status-pill-green"
                      : device.status === "Suspended"
                        ? "status-pill-red"
                        : "status-pill-yellow"
                  }`}
                >
                  {device.status}
                </span>
              </div>

              <div className="device-action-column">
                {device.status !== "Suspended" ? (
                  <button
                    type="button"
                    className="button button-danger btn-sm"
                    onClick={() => setSuspendingDevice(device)}
                  >
                    Admin Suspend
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button button-secondary btn-sm"
                    onClick={() => handleReactivate(device)}
                  >
                    Reactivate
                  </button>
                )}

                <button
                  type="button"
                  className="button button-ghost btn-sm"
                  onClick={() => setSelectedDevice(device)}
                >
                  Inspect
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MODAL: Admin Authorization for Suspension */}
      {suspendingDevice && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSuspendingDevice(null)}
          role="presentation"
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="suspend-modal-title"
          >
            <div className="modal-header">
              <span className="badge-danger-critical">ADMIN PERMISSION REQUIRED</span>
              <h2 id="suspend-modal-title">
                Authorize Endpoint &amp; Account Suspension
              </h2>
            </div>

            <div className="modal-content-body">
              <div className="anomaly-review-box">
                <strong>Anomalous Event Verification:</strong>
                <p>
                  <strong>Device:</strong> {suspendingDevice.name} ({suspendingDevice.deviceId})
                </p>
                <p>
                  <strong>Assigned Organization Email:</strong> {suspendingDevice.assignedEmail}
                </p>
                <p>
                  <strong>Employee:</strong> {suspendingDevice.employeeName}
                </p>
                <p>
                  <strong>Observed Activity:</strong> {suspendingDevice.lastLoginTime} from{" "}
                  {suspendingDevice.lastLoginLocation} ({suspendingDevice.lastLoginIp})
                </p>
                {suspendingDevice.anomalyDetails && (
                  <p className="anomaly-callout">{suspendingDevice.anomalyDetails}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="reason-input">
                  Administrative Justification / Audit Trail:
                </label>
                <textarea
                  id="reason-input"
                  rows={3}
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  className="modal-textarea"
                />
              </div>

              <div className="admin-signoff-badge">
                <span>PERMISSION SIGNED BY:</span>
                <strong>
                  {user?.email || "admin.lead@cyberguard.internal"} (Admin Authorization Granted)
                </strong>
              </div>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setSuspendingDevice(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-danger"
                onClick={handleAdminSuspend}
              >
                Sign &amp; Enforce Immediate Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Device Detail Profile */}
      {selectedDevice && (
        <div
          className="admin-modal-overlay"
          onClick={() => setSelectedDevice(null)}
          role="presentation"
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="detail-modal-title"
          >
            <div className="modal-header">
              <span className="badge-highlight-blue">ENDPOINT PROFILE</span>
              <h2 id="detail-modal-title">{selectedDevice.name}</h2>
            </div>

            <div className="modal-content-body">
              <div className="device-inspect-grid">
                <div>
                  <small>Device Identifier</small>
                  <strong>{selectedDevice.deviceId}</strong>
                </div>
                <div>
                  <small>Operating System</small>
                  <strong>{selectedDevice.os}</strong>
                </div>
                <div>
                  <small>Assigned Email</small>
                  <strong>{selectedDevice.assignedEmail}</strong>
                </div>
                <div>
                  <small>Assigned Employee</small>
                  <strong>{selectedDevice.employeeName}</strong>
                </div>
                <div>
                  <small>Planned Schedule</small>
                  <span>{selectedDevice.plannedSchedule}</span>
                </div>
                <div>
                  <small>Planned Origin Location</small>
                  <span>{selectedDevice.plannedLocation}</span>
                </div>
                <div>
                  <small>Last Login Time</small>
                  <span>{selectedDevice.lastLoginTime}</span>
                </div>
                <div>
                  <small>Last Recorded Origin</small>
                  <span>{selectedDevice.lastLoginLocation} ({selectedDevice.lastLoginIp})</span>
                </div>
                <div>
                  <small>Activation Date</small>
                  <span>{selectedDevice.activationDate}</span>
                </div>
                <div>
                  <small>Current Status</small>
                  <strong className={selectedDevice.status === "Suspended" ? "text-danger" : "text-success"}>
                    {selectedDevice.status}
                  </strong>
                </div>
              </div>

              {selectedDevice.suspendedByAdmin && (
                <div className="suspension-audit-card">
                  <IconShield size={20} className="audit-icon text-red" />
                  <div>
                    <strong>Suspended under Admin Authority</strong>
                    <p>
                      Suspended by: {selectedDevice.suspendedByAdmin} at{" "}
                      {selectedDevice.suspendedAt}
                    </p>
                    <p>
                      Reason: <em>{selectedDevice.adminSuspensionReason}</em>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="button button-primary"
                onClick={() => setSelectedDevice(null)}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}