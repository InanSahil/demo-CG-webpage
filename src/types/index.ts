export interface User {
  id: string;
  email: string;
  full_name: string;
  role?: "super_admin" | "admin" | "security_lead" | "analyst";
  is_active: boolean;
  is_verified: boolean;
}

export interface Organization {
  id: string;
  name: string;
  memberCount?: number;
}

export interface Detection {
  id: string;
  type: string;
  status: string;
  createdAt?: string;
}

export interface Threat {
  id: string;
  category: string;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  score?: number;
  source?: string;
  detectedAt?: string;
}

export interface Incident {
  id: string;
  title: string;
  status: "Open" | "In Review" | "Resolved" | "Mitigated";
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  createdAt?: string;
}

export interface CyberScore {
  score: number;
  riskLevel?: string;
  status?: string;
}

export interface Notification {
  id: string;
  title: string;
  message?: string;
  read: boolean;
  createdAt?: string;
}

// Mobile UI Telemetry Types (as per mobile reference)
export interface MobileScoreTrend {
  division: string; // "0h", "6h", "12", "18", "24", "30", "36"
  score: number;
}

export interface MobileTelemetryCard {
  id: "calls" | "sms" | "url" | "email";
  label: string;
  score: number; // e.g. 88, 82, 91, 74
  trend: string; // e.g. "+2"
  history: MobileScoreTrend[];
  risk: "SAFE" | "ATTENTION" | "HIGH";
}

export interface DeepfakeScanItem {
  id: "image" | "video" | "audio";
  title: string;
  description: string;
  status: "idle" | "scanning" | "clear" | "threat_detected";
  score?: number;
}

// Department Analysis & Cyber Score
export interface DepartmentScore {
  id: string;
  name: string;
  averageScore: number; // e.g. 92, 58, 64
  headCount: number;
  isLowScoreWarning: boolean; // true if score < 70
  trend: "improving" | "stable" | "declining";
  riskLevel: "CRITICAL" | "HIGH" | "MODERATE" | "SAFE";
}

// Low Score Employee & 3-Slot 12hr Warning System
export type WarningSlotStatus = "pending" | "sent" | "remediated" | "expired";

export interface WarningSlot {
  slotNumber: 1 | 2 | 3;
  slotHours: "0h–12h" | "12h–24h" | "24h–36h";
  title: string;
  sentAt?: string;
  status: WarningSlotStatus;
}

export interface LowScoreEmployee {
  id: string;
  name: string;
  empId: string; // Employee ID e.g. "CG-EMP-014"
  email: string;
  department: string;
  position: string; // e.g. "Lead Engineer", "Financial Analyst"
  cyberScore: number;
  riskReason: string;
  warningSlots: [WarningSlot, WarningSlot, WarningSlot];
  currentSlot: 1 | 2 | 3;
  hoursElapsed: number; // 0 to 36+
  accountStatus: "active" | "warning_active" | "suspended";
  suspendedReason?: string;
  suspendedAt?: string;
}

export interface EmployeeInput {
  name: string;
  empId: string;
  email: string;
  department: string;
  position: string;
}

export interface DepartmentInput {
  name: string;
}

// Devices & Login Monitoring (Organisation-provided)
export interface OrganizationDevice {
  id: string;
  deviceId: string;
  name: string;
  assignedEmail: string;
  employeeName: string;
  type: "Laptop" | "Desktop" | "Mobile";
  os: string;
  activationDate: string;
  plannedSchedule: string; // e.g. "09:00 - 18:00 IST (Mon-Fri)"
  plannedLocation: string; // e.g. "Bengaluru HQ (10.24.0.0/16)"
  lastLoginTime: string;
  lastLoginLocation: string;
  lastLoginIp: string;
  isUnplannedAnomaly: boolean; // Flagged if login time or location is unplanned
  anomalyDetails?: string;
  status: "Active" | "Review" | "Suspended";
  suspendedByAdmin?: string;
  suspendedAt?: string;
  adminSuspensionReason?: string;
}

// Admin Threat Detection & Majority Voting System
export interface AdminThreatIncident {
  id: string;
  threatTitle: string;
  threatType: string;
  severity: "CRITICAL" | "HIGH";
  compromisedAdminEmail: string;
  compromisedAdminName: string;
  detectedAt: string;
  anomalyDescription: string;
  totalAdmins: number; // e.g. 5
  requiredVotesForMajority: number; // 3
  votesToSuspend: string[]; // List of admin emails who voted to suspend
  votesToClear: string[]; // List of admin emails who voted to clear
  status: "voting_active" | "suspended" | "cleared";
  resolvedAt?: string;
}

// Automated Employee Warning & Suspension Engine Types
export interface AutomationDetail {
  employeeName: string;
  employeeEmail: string;
  actionTaken: "warning_sent" | "account_suspended" | "already_contained";
  slotNumber?: number;
  reason: string;
}

export interface AutomationExecutionResult {
  success: boolean;
  warningsSent: number;
  accountsSuspended: number;
  message: string;
  details: AutomationDetail[];
  updatedEmployees: LowScoreEmployee[];
}
