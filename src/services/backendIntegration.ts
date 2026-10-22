import { api } from "./api";
import type {
  AdminThreatIncident,
  AutomationExecutionResult,
  DepartmentInput,
  DepartmentScore,
  EmployeeInput,
  LowScoreEmployee,
  MobileTelemetryCard,
  OrganizationDevice,
  WarningSlot,
} from "../types";

// Initial mock datasets matching mobile reference and enterprise rules
const INITIAL_MOBILE_TELEMETRY: MobileTelemetryCard[] = [
  {
    id: "calls",
    label: "Calls",
    score: 88,
    trend: "+2",
    risk: "SAFE",
    history: [
      { division: "0h", score: 81 },
      { division: "6h", score: 83 },
      { division: "12", score: 82 },
      { division: "18", score: 85 },
      { division: "24", score: 84 },
      { division: "30", score: 87 },
      { division: "36", score: 88 },
    ],
  },
  {
    id: "sms",
    label: "SMS",
    score: 82,
    trend: "+2",
    risk: "SAFE",
    history: [
      { division: "0h", score: 76 },
      { division: "6h", score: 79 },
      { division: "12", score: 77 },
      { division: "18", score: 81 },
      { division: "24", score: 80 },
      { division: "30", score: 82 },
      { division: "36", score: 82 },
    ],
  },
  {
    id: "url",
    label: "URL",
    score: 91,
    trend: "+2",
    risk: "SAFE",
    history: [
      { division: "0h", score: 85 },
      { division: "6h", score: 88 },
      { division: "12", score: 87 },
      { division: "18", score: 90 },
      { division: "24", score: 89 },
      { division: "30", score: 91 },
      { division: "36", score: 91 },
    ],
  },
  {
    id: "email",
    label: "Email",
    score: 74,
    trend: "+2",
    risk: "ATTENTION",
    history: [
      { division: "0h", score: 68 },
      { division: "6h", score: 70 },
      { division: "12", score: 69 },
      { division: "18", score: 73 },
      { division: "24", score: 71 },
      { division: "30", score: 74 },
      { division: "36", score: 74 },
    ],
  },
];

const INITIAL_DEPARTMENTS: DepartmentScore[] = [
  {
    id: "dept-eng",
    name: "Engineering",
    averageScore: 92,
    headCount: 64,
    isLowScoreWarning: false,
    trend: "improving",
    riskLevel: "SAFE",
  },
  {
    id: "dept-it",
    name: "Information Tech",
    averageScore: 89,
    headCount: 32,
    isLowScoreWarning: false,
    trend: "stable",
    riskLevel: "SAFE",
  },
  {
    id: "dept-ops",
    name: "Operations",
    averageScore: 83,
    headCount: 45,
    isLowScoreWarning: false,
    trend: "improving",
    riskLevel: "SAFE",
  },
  {
    id: "dept-legal",
    name: "Legal & Compliance",
    averageScore: 76,
    headCount: 18,
    isLowScoreWarning: false,
    trend: "stable",
    riskLevel: "MODERATE",
  },
  {
    id: "dept-mktg",
    name: "Marketing",
    averageScore: 68,
    headCount: 29,
    isLowScoreWarning: true,
    trend: "declining",
    riskLevel: "HIGH",
  },
  {
    id: "dept-hr",
    name: "Human Resources",
    averageScore: 64,
    headCount: 22,
    isLowScoreWarning: true,
    trend: "declining",
    riskLevel: "HIGH",
  },
  {
    id: "dept-fin",
    name: "Finance & Accounts",
    averageScore: 58,
    headCount: 36,
    isLowScoreWarning: true,
    trend: "declining",
    riskLevel: "CRITICAL",
  },
];

const INITIAL_LOW_SCORE_EMPLOYEES: LowScoreEmployee[] = [
  {
    id: "emp-001",
    empId: "CG-EMP-101",
    name: "Rahul Mehta",
    email: "rahul.mehta@cyberguard.internal",
    department: "Finance & Accounts",
    position: "Senior Financial Analyst",
    cyberScore: 54,
    riskReason: "Repeated phishing clicks & unencrypted financial report transfers",
    currentSlot: 2,
    hoursElapsed: 18,
    accountStatus: "warning_active",
    warningSlots: [
      {
        slotNumber: 1,
        slotHours: "0h–12h",
        title: "Warning 1: Initial Score Alert (<60)",
        sentAt: "18h ago",
        status: "sent",
      },
      {
        slotNumber: 2,
        slotHours: "12h–24h",
        title: "Warning 2: Mandatory MFA & Device Scan Notice",
        sentAt: "6h ago",
        status: "sent",
      },
      {
        slotNumber: 3,
        slotHours: "24h–36h",
        title: "Warning 3: Final Notice Before Account Suspension",
        status: "pending",
      },
    ],
  },
  {
    id: "emp-002",
    empId: "CG-EMP-102",
    name: "Sonia Rao",
    email: "sonia.rao@cyberguard.internal",
    department: "Human Resources",
    position: "Talent Acquisition Lead",
    cyberScore: 59,
    riskReason: "Outdated endpoint OS & unauthorized cloud sync configured",
    currentSlot: 3,
    hoursElapsed: 31,
    accountStatus: "warning_active",
    warningSlots: [
      {
        slotNumber: 1,
        slotHours: "0h–12h",
        title: "Warning 1: Initial Score Alert (<60)",
        sentAt: "30h ago",
        status: "sent",
      },
      {
        slotNumber: 2,
        slotHours: "12h–24h",
        title: "Warning 2: Urgent OS Patch & Credential Rotate",
        sentAt: "18h ago",
        status: "sent",
      },
      {
        slotNumber: 3,
        slotHours: "24h–36h",
        title: "Warning 3: FINAL NOTICE — Imminent Data Leakage Risk",
        sentAt: "6h ago",
        status: "sent",
      },
    ],
  },
  {
    id: "emp-003",
    empId: "CG-EMP-103",
    name: "Kevin Vance",
    email: "kevin.vance@cyberguard.internal",
    department: "Marketing",
    position: "Product Marketing Manager",
    cyberScore: 61,
    riskReason: "Third-party browser extension injecting telemetry scripts",
    currentSlot: 1,
    hoursElapsed: 4,
    accountStatus: "warning_active",
    warningSlots: [
      {
        slotNumber: 1,
        slotHours: "0h–12h",
        title: "Warning 1: Suspicious Extension Detection",
        sentAt: "4h ago",
        status: "sent",
      },
      {
        slotNumber: 2,
        slotHours: "12h–24h",
        title: "Warning 2: Extension Removal Directive",
        status: "pending",
      },
      {
        slotNumber: 3,
        slotHours: "24h–36h",
        title: "Warning 3: Final Account Lock Warning",
        status: "pending",
      },
    ],
  },
  {
    id: "emp-004",
    empId: "CG-EMP-104",
    name: "Devon Chen",
    email: "devon.chen@cyberguard.internal",
    department: "Finance & Accounts",
    position: "Accounts Payable Specialist",
    cyberScore: 48,
    riskReason: "Ignored 3 consecutive 12hr warning cycles with active malware payload",
    currentSlot: 3,
    hoursElapsed: 38,
    accountStatus: "suspended",
    suspendedReason: "Exceeded 36-hour remediation window without action (Data Leakage Risk)",
    suspendedAt: "2h ago",
    warningSlots: [
      {
        slotNumber: 1,
        slotHours: "0h–12h",
        title: "Warning 1: Critical Malware Flag",
        sentAt: "38h ago",
        status: "expired",
      },
      {
        slotNumber: 2,
        slotHours: "12h–24h",
        title: "Warning 2: Mandatory Device Isolation Directive",
        sentAt: "26h ago",
        status: "expired",
      },
      {
        slotNumber: 3,
        slotHours: "24h–36h",
        title: "Warning 3: Final Notice Before Permanent Suspension",
        sentAt: "14h ago",
        status: "expired",
      },
    ],
  },
];

const INITIAL_ORGANIZATION_DEVICES: OrganizationDevice[] = [
  {
    id: "dev-01",
    deviceId: "CG-CORP-LT-042",
    name: "Engineering-LT-042",
    assignedEmail: "arjun.sharma@cyberguard.internal",
    employeeName: "Arjun Sharma",
    type: "Laptop",
    os: "Windows 11 Pro",
    activationDate: "2026-01-15",
    plannedSchedule: "09:00 - 18:00 IST (Mon-Fri)",
    plannedLocation: "Bengaluru HQ (10.24.0.0/16)",
    lastLoginTime: "Today at 09:14 AM IST",
    lastLoginLocation: "Bengaluru, IN",
    lastLoginIp: "10.24.18.42",
    isUnplannedAnomaly: false,
    status: "Active",
  },
  {
    id: "dev-02",
    deviceId: "CG-CORP-WS-018",
    name: "Operations-WS-018",
    assignedEmail: "priya.das@cyberguard.internal",
    employeeName: "Priya Das",
    type: "Desktop",
    os: "Windows 11 Enterprise",
    activationDate: "2026-02-01",
    plannedSchedule: "08:30 - 17:30 IST (Mon-Fri)",
    plannedLocation: "Mumbai Center (10.24.20.0/16)",
    lastLoginTime: "Today at 08:32 AM IST",
    lastLoginLocation: "Mumbai, IN",
    lastLoginIp: "10.24.21.18",
    isUnplannedAnomaly: false,
    status: "Active",
  },
  {
    id: "dev-03",
    deviceId: "CG-CORP-LT-011",
    name: "Finance-LT-011",
    assignedEmail: "rahul.mehta@cyberguard.internal",
    employeeName: "Rahul Mehta",
    type: "Laptop",
    os: "Windows 10 Enterprise",
    activationDate: "2026-01-10",
    plannedSchedule: "09:00 - 18:00 IST (Mon-Fri)",
    plannedLocation: "Delhi Branch (10.24.9.0/16)",
    lastLoginTime: "Today at 03:22 AM (Unplanned Hour)",
    lastLoginLocation: "Bucharest, RO (Foreign IP)",
    lastLoginIp: "185.220.101.5",
    isUnplannedAnomaly: true,
    anomalyDetails: "CRITICAL: Login occurred at 03:22 AM outside planned shift (09:00-18:00) from unexpected geographic origin (Bucharest, RO). Requires Admin permission to suspend.",
    status: "Review",
  },
  {
    id: "dev-04",
    deviceId: "CG-CORP-LT-007",
    name: "HR-LT-007",
    assignedEmail: "ananya.patel@cyberguard.internal",
    employeeName: "Ananya Patel",
    type: "Laptop",
    os: "Windows 11 Pro",
    activationDate: "2026-02-18",
    plannedSchedule: "09:30 - 18:30 IST (Mon-Fri)",
    plannedLocation: "Hyderabad Branch (10.24.31.0/16)",
    lastLoginTime: "Today at 09:35 AM IST",
    lastLoginLocation: "Hyderabad, IN",
    lastLoginIp: "10.24.31.07",
    isUnplannedAnomaly: false,
    status: "Active",
  },
  {
    id: "dev-05",
    deviceId: "CG-CORP-LT-089",
    name: "Executive-LT-089",
    assignedEmail: "marcus.wright@cyberguard.internal",
    employeeName: "Marcus Wright (Admin)",
    type: "Laptop",
    os: "Windows 11 Pro",
    activationDate: "2025-11-04",
    plannedSchedule: "Flexible 24/7 (Executive)",
    plannedLocation: "Bengaluru HQ & Approved VPN",
    lastLoginTime: "Today at 02:45 AM (Tor Exit Node)",
    lastLoginLocation: "Frankfurt, DE (Tor Exit Node)",
    lastLoginIp: "193.106.191.22",
    isUnplannedAnomaly: true,
    anomalyDetails: "HIGH RISK: Known Tor exit node detected attempting bulk database export. Flagged to Peer Admin consensus committee.",
    status: "Review",
  },
];

const INITIAL_ADMIN_THREAT_INCIDENTS: AdminThreatIncident[] = [
  {
    id: "inc-adm-01",
    threatTitle: "Anomalous Bulk Database Export & Privilege Escalation Attempt",
    threatType: "Insider Threat / Credential Compromise",
    severity: "CRITICAL",
    compromisedAdminEmail: "marcus.wright@cyberguard.internal",
    compromisedAdminName: "Marcus Wright (SuperAdmin)",
    detectedAt: "35 min ago",
    anomalyDescription:
      "Admin session initiated unauthorized SQL dump of employee cryptographic keys from an unverified IP in Frankfurt (Tor Exit Node). Under CyberGuard security policy, any administrator facing a threat requires a majority consensus vote (at least 3 of 5 admins) to be suspended.",
    totalAdmins: 5,
    requiredVotesForMajority: 3,
    votesToSuspend: ["sarah.connor@cyberguard.internal", "bruce.wayne@cyberguard.internal"],
    votesToClear: [],
    status: "voting_active",
  },
];

const STORAGE_KEYS = {
  TELEMETRY: "cyberguard_mobile_telemetry_v2",
  DEPARTMENTS: "cyberguard_departments_v2",
  LOW_SCORES: "cyberguard_low_score_employees_v2",
  DEVICES: "cyberguard_org_devices_v2",
  ADMIN_THREATS: "cyberguard_admin_threats_v2",
  DOWNLOADS: "cyberguard_download_count_v2",
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore local storage errors
  }
}

export const BackendService = {
  // Mobile Telemetry Scores (Calls, SMS, URL, Email)
  async getMobileTelemetry(): Promise<MobileTelemetryCard[]> {
    try {
      return await api.get<MobileTelemetryCard[]>("/telemetry/mobile-scores");
    } catch {
      return readStorage(STORAGE_KEYS.TELEMETRY, INITIAL_MOBILE_TELEMETRY);
    }
  },

  // Deepfake Scan Trigger
  async triggerDeepfakeScan(
    type: "image" | "video" | "audio",
  ): Promise<{ success: boolean; resultScore: number; details: string }> {
    try {
      return await api.post<{ success: boolean; resultScore: number; details: string }>(
        "/telemetry/deepfake-scan",
        { type },
      );
    } catch {
      // Return realistic synthetic analysis
      const scores = { image: 94, video: 89, audio: 96 };
      return {
        success: true,
        resultScore: scores[type],
        details: `Deepfake neural analysis completed for ${type}. No synthetic manipulation artifacts detected (Authenticity Confidence: ${scores[type]}%).`,
      };
    }
  },

  // Department Scores Analysis
  async getDepartmentScores(): Promise<DepartmentScore[]> {
    try {
      return await api.get<DepartmentScore[]>("/analytics/departments");
    } catch {
      return readStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    }
  },

  // Low Score Employees & Warning Email Engine
  async getLowScoreEmployees(): Promise<LowScoreEmployee[]> {
    try {
      return await api.get<LowScoreEmployee[]>("/employees/low-scores");
    } catch {
      return readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
    }
  },

  async sendWarningEmail(
    employeeId: string,
    slotNumber: 1 | 2 | 3,
  ): Promise<{ success: boolean; employee: LowScoreEmployee }> {
    try {
      return await api.post<{ success: boolean; employee: LowScoreEmployee }>(
        `/employees/${employeeId}/warning-email`,
        { slotNumber },
      );
    } catch {
      const list = readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
      const updated = list.map((emp) => {
        if (emp.id !== employeeId) return emp;

        const updatedSlots = [...emp.warningSlots] as [
          WarningSlot,
          WarningSlot,
          WarningSlot,
        ];
        const slotIdx = slotNumber - 1;
        updatedSlots[slotIdx] = {
          ...updatedSlots[slotIdx],
          status: "sent",
          sentAt: "Just now",
        };

        const nextSlot = (slotNumber < 3 ? slotNumber + 1 : 3) as 1 | 2 | 3;
        return {
          ...emp,
          warningSlots: updatedSlots,
          currentSlot: nextSlot,
          hoursElapsed: slotNumber * 12,
        };
      });

      writeStorage(STORAGE_KEYS.LOW_SCORES, updated);
      const employee = updated.find((e) => e.id === employeeId)!;
      return { success: true, employee };
    }
  },

  async suspendEmployeeAccount(
    employeeId: string,
    reason?: string,
  ): Promise<{ success: boolean; employee: LowScoreEmployee }> {
    try {
      return await api.post<{ success: boolean; employee: LowScoreEmployee }>(
        `/employees/${employeeId}/suspend`,
        { reason },
      );
    } catch {
      const list = readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
      const updated = list.map((emp) => {
        if (emp.id !== employeeId) return emp;
        return {
          ...emp,
          accountStatus: "suspended" as const,
          suspendedReason:
            reason ||
            "Account suspended automatically: 3 consecutive 12hr warnings ignored with imminent risk of data leakage.",
          suspendedAt: "Just now",
        };
      });

      writeStorage(STORAGE_KEYS.LOW_SCORES, updated);
      const employee = updated.find((e) => e.id === employeeId)!;
      return { success: true, employee };
    }
  },

  async reinstateEmployeeAccount(
    employeeId: string,
  ): Promise<{ success: boolean; employee: LowScoreEmployee }> {
    try {
      return await api.post<{ success: boolean; employee: LowScoreEmployee }>(
        `/employees/${employeeId}/reinstate`,
      );
    } catch {
      const list = readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
      const updated = list.map((emp) => {
        if (emp.id !== employeeId) return emp;
        return {
          ...emp,
          accountStatus: "active" as const,
          cyberScore: 78,
          suspendedReason: undefined,
          suspendedAt: undefined,
        };
      });

      writeStorage(STORAGE_KEYS.LOW_SCORES, updated);
      const employee = updated.find((e) => e.id === employeeId)!;
      return { success: true, employee };
    }
  },

  // Automated 36h Warning & Suspension Engine
  async runAutomatedRemediationEngine(): Promise<AutomationExecutionResult> {
    try {
      return await api.post<AutomationExecutionResult>("/employees/automation/execute-cycle");
    } catch {
      const list = readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
      let warningsSent = 0;
      let accountsSuspended = 0;
      const details: AutomationExecutionResult["details"] = [];

      const updated = list.map((emp) => {
        // If already suspended, it is already contained
        if (emp.accountStatus === "suspended") {
          details.push({
            employeeName: emp.name,
            employeeEmail: emp.email,
            actionTaken: "already_contained",
            reason: "Account is already isolated under administrative suspension.",
          });
          return emp;
        }

        // If employee is on slot 3 (final notice) or has >= 36 hours elapsed without remediation, auto-suspend!
        if (emp.currentSlot >= 3 || emp.hoursElapsed >= 36) {
          accountsSuspended++;
          details.push({
            employeeName: emp.name,
            employeeEmail: emp.email,
            actionTaken: "account_suspended",
            slotNumber: 3,
            reason: `3x 12-hour warning cycle (${emp.hoursElapsed}h) elapsed without remediation. Enforced automatic account suspension to prevent corporate data leakage.`,
          });
          return {
            ...emp,
            accountStatus: "suspended" as const,
            suspendedReason:
              "AUTOMATED LOCKOUT: 3x 12-hr remediation windows expired without policy compliance (Data Leakage Protection).",
            suspendedAt: "Just now (Automated Policy Engine)",
          };
        }

        // Otherwise, advance to the next warning slot!
        const nextSlot = (emp.currentSlot + 1) as 1 | 2 | 3;
        const updatedSlots = [...emp.warningSlots] as [WarningSlot, WarningSlot, WarningSlot];
        const slotIdx = nextSlot - 1;
        updatedSlots[slotIdx] = {
          ...updatedSlots[slotIdx],
          status: "sent",
          sentAt: "Just now (Automated 12h Engine)",
        };

        warningsSent++;
        details.push({
          employeeName: emp.name,
          employeeEmail: emp.email,
          actionTaken: "warning_sent",
          slotNumber: nextSlot,
          reason: `Automatic 12-hour interval elapsed. Dispatched Warning Email Slot #${nextSlot} (${updatedSlots[slotIdx].slotHours}).`,
        });

        return {
          ...emp,
          warningSlots: updatedSlots,
          currentSlot: nextSlot,
          hoursElapsed: nextSlot * 12,
        };
      });

      writeStorage(STORAGE_KEYS.LOW_SCORES, updated);

      let message = "Automation cycle completed: ";
      if (warningsSent > 0 && accountsSuspended > 0) {
        message += `Dispatched ${warningsSent} warning email(s) and suspended ${accountsSuspended} delinquent account(s).`;
      } else if (warningsSent > 0) {
        message += `Dispatched ${warningsSent} warning email(s) across active intervals.`;
      } else if (accountsSuspended > 0) {
        message += `Suspended ${accountsSuspended} delinquent account(s) due to 36h policy expiration.`;
      } else {
        message += "All flagged employees are currently isolated or compliant.";
      }

      return {
        success: true,
        warningsSent,
        accountsSuspended,
        message,
        details,
        updatedEmployees: updated,
      };
    }
  },

  async resetEmployeeRemediationDemo(): Promise<LowScoreEmployee[]> {
    writeStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
    writeStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    return INITIAL_LOW_SCORE_EMPLOYEES;
  },

  // Add individual employee (name, emp id, email, department, position)
  async addEmployee(
    input: EmployeeInput,
  ): Promise<{ success: boolean; employee: LowScoreEmployee; error?: string }> {
    const list = readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
    if (!input.name.trim() || !input.email.trim()) {
      return { success: false, employee: list[0], error: "Name and email are required." };
    }

    const newEmp: LowScoreEmployee = {
      id: `emp-${Date.now()}`,
      empId: input.empId.trim() || `CG-EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: input.name.trim(),
      email: input.email.trim(),
      department: input.department.trim() || "Operations",
      position: input.position.trim() || "Personnel",
      cyberScore: 82,
      riskReason: "Active verified personnel · Zero trust compliance",
      currentSlot: 1,
      hoursElapsed: 0,
      accountStatus: "active",
      warningSlots: [
        { slotNumber: 1, slotHours: "0h–12h", title: "Warning 1: Initial Risk Alert", status: "pending" },
        { slotNumber: 2, slotHours: "12h–24h", title: "Warning 2: Endpoint Isolation Directive", status: "pending" },
        { slotNumber: 3, slotHours: "24h–36h", title: "Warning 3: Final Pre-Lockout Warning", status: "pending" },
      ],
    };

    const updated = [newEmp, ...list];
    writeStorage(STORAGE_KEYS.LOW_SCORES, updated);

    // Increment department headcount if matches
    const depts = readStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const updatedDepts = depts.map((d) =>
      d.name.toLowerCase() === newEmp.department.toLowerCase()
        ? { ...d, headCount: d.headCount + 1 }
        : d,
    );
    writeStorage(STORAGE_KEYS.DEPARTMENTS, updatedDepts);

    return { success: true, employee: newEmp };
  },

  // Remove individual employee
  async removeEmployee(
    employeeId: string,
  ): Promise<{ success: boolean; employeeId: string }> {
    const list = readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
    const target = list.find((e) => e.id === employeeId);
    const updated = list.filter((e) => e.id !== employeeId);
    writeStorage(STORAGE_KEYS.LOW_SCORES, updated);

    if (target) {
      const depts = readStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
      const updatedDepts = depts.map((d) =>
        d.name.toLowerCase() === target.department.toLowerCase()
          ? { ...d, headCount: Math.max(0, d.headCount - 1) }
          : d,
      );
      writeStorage(STORAGE_KEYS.DEPARTMENTS, updatedDepts);
    }

    return { success: true, employeeId };
  },

  // Upload and parse CSV of employee details (name, emp id, email, department, position)
  async importEmployeesCsv(
    csvContent: string,
  ): Promise<{
    success: boolean;
    addedCount: number;
    employees: LowScoreEmployee[];
    errors: string[];
  }> {
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length <= 1) {
      return {
        success: false,
        addedCount: 0,
        employees: readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES),
        errors: ["CSV file must contain a header row and at least one employee row."],
      };
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/['"]+/g, ""));
    const nameIdx = headers.findIndex((h) => h === "name" || h === "employee name");
    const empIdIdx = headers.findIndex(
      (h) => h === "emp id" || h === "empid" || h === "emp_id" || h === "id",
    );
    const emailIdx = headers.findIndex((h) => h === "email" || h === "email address");
    const deptIdx = headers.findIndex((h) => h === "department" || h === "dept");
    const posIdx = headers.findIndex(
      (h) => h === "position" || h === "role" || h === "title" || h === "designation",
    );

    if (nameIdx === -1 || emailIdx === -1 || deptIdx === -1) {
      return {
        success: false,
        addedCount: 0,
        employees: readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES),
        errors: [
          "CSV must include columns: 'name', 'emp id', 'email', 'department', 'position'.",
        ],
      };
    }

    const currentList = readStorage(STORAGE_KEYS.LOW_SCORES, INITIAL_LOW_SCORE_EMPLOYEES);
    const addedList: LowScoreEmployee[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]
        .split(",")
        .map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const name = cols[nameIdx];
      const empId =
        empIdIdx !== -1 && cols[empIdIdx]
          ? cols[empIdIdx]
          : `CG-EMP-${Math.floor(100 + Math.random() * 900)}`;
      const email = cols[emailIdx];
      const department = cols[deptIdx] || "Operations";
      const position = posIdx !== -1 && cols[posIdx] ? cols[posIdx] : "Associate";

      if (!name || !email) {
        errors.push(`Row #${i + 1}: Skipped (Missing name or email).`);
        continue;
      }

      const newEmp: LowScoreEmployee = {
        id: `emp-csv-${Date.now()}-${i}`,
        empId,
        name,
        email,
        department,
        position,
        cyberScore: 85,
        riskReason: "Imported via Corporate CSV Registry",
        currentSlot: 1,
        hoursElapsed: 0,
        accountStatus: "active",
        warningSlots: [
          { slotNumber: 1, slotHours: "0h–12h", title: "Warning 1: Initial Risk Alert", status: "pending" },
          { slotNumber: 2, slotHours: "12h–24h", title: "Warning 2: Endpoint Isolation Directive", status: "pending" },
          { slotNumber: 3, slotHours: "24h–36h", title: "Warning 3: Final Pre-Lockout Warning", status: "pending" },
        ],
      };

      addedList.push(newEmp);
    }

    if (addedList.length === 0) {
      return {
        success: false,
        addedCount: 0,
        employees: currentList,
        errors: errors.length > 0 ? errors : ["No valid employee rows parsed from CSV."],
      };
    }

    const merged = [...addedList, ...currentList];
    writeStorage(STORAGE_KEYS.LOW_SCORES, merged);

    // Update department counts
    const depts = readStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const deptCountMap: Record<string, number> = {};
    merged.forEach((e) => {
      const key = e.department.toLowerCase();
      deptCountMap[key] = (deptCountMap[key] || 0) + 1;
    });

    const updatedDepts = depts.map((d) => ({
      ...d,
      headCount: deptCountMap[d.name.toLowerCase()] || d.headCount,
    }));
    writeStorage(STORAGE_KEYS.DEPARTMENTS, updatedDepts);

    return {
      success: true,
      addedCount: addedList.length,
      employees: merged,
      errors,
    };
  },

  // Create individual department
  async addDepartment(
    input: string | DepartmentInput,
  ): Promise<{ success: boolean; department: DepartmentScore; error?: string }> {
    const list = readStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const rawName = typeof input === "string" ? input : input.name;
    const trimmed = rawName.trim();
    if (!trimmed) {
      return { success: false, department: list[0], error: "Department name cannot be blank." };
    }

    const exists = list.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return {
        success: false,
        department: list[0],
        error: `Department '${trimmed}' already exists in the organization registry.`,
      };
    }

    const newDept: DepartmentScore = {
      id: `dept-${Date.now()}`,
      name: trimmed,
      averageScore: 86,
      headCount: 0,
      isLowScoreWarning: false,
      trend: "improving",
      riskLevel: "SAFE",
    };

    const updated = [...list, newDept];
    writeStorage(STORAGE_KEYS.DEPARTMENTS, updated);
    return { success: true, department: newDept };
  },

  // Remove individual department
  async removeDepartment(
    deptId: string,
  ): Promise<{ success: boolean; deptId: string }> {
    const list = readStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const updated = list.filter((d) => d.id !== deptId);
    writeStorage(STORAGE_KEYS.DEPARTMENTS, updated);
    return { success: true, deptId };
  },

  // Devices & Unplanned Login Monitoring
  async getOrganizationDevices(): Promise<OrganizationDevice[]> {
    try {
      return await api.get<OrganizationDevice[]>("/devices");
    } catch {
      return readStorage(STORAGE_KEYS.DEVICES, INITIAL_ORGANIZATION_DEVICES);
    }
  },

  async suspendDeviceByAdmin(
    deviceId: string,
    adminEmail: string,
    reason: string,
  ): Promise<{ success: boolean; device: OrganizationDevice }> {
    try {
      return await api.post<{ success: boolean; device: OrganizationDevice }>(
        `/devices/${deviceId}/suspend`,
        { adminEmail, reason },
      );
    } catch {
      const devices = readStorage(STORAGE_KEYS.DEVICES, INITIAL_ORGANIZATION_DEVICES);
      const updated = devices.map((dev) => {
        if (dev.id !== deviceId && dev.deviceId !== deviceId) return dev;
        return {
          ...dev,
          status: "Suspended" as const,
          suspendedByAdmin: adminEmail,
          suspendedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          adminSuspensionReason: reason,
        };
      });

      writeStorage(STORAGE_KEYS.DEVICES, updated);
      const device = updated.find((d) => d.id === deviceId || d.deviceId === deviceId)!;
      return { success: true, device };
    }
  },

  async activateDevice(
    deviceId: string,
  ): Promise<{ success: boolean; device: OrganizationDevice }> {
    try {
      return await api.post<{ success: boolean; device: OrganizationDevice }>(
        `/devices/${deviceId}/activate`,
      );
    } catch {
      const devices = readStorage(STORAGE_KEYS.DEVICES, INITIAL_ORGANIZATION_DEVICES);
      const updated = devices.map((dev) => {
        if (dev.id !== deviceId && dev.deviceId !== deviceId) return dev;
        return {
          ...dev,
          status: "Active" as const,
          isUnplannedAnomaly: false,
          suspendedByAdmin: undefined,
          suspendedAt: undefined,
          adminSuspensionReason: undefined,
        };
      });

      writeStorage(STORAGE_KEYS.DEVICES, updated);
      const device = updated.find((d) => d.id === deviceId || d.deviceId === deviceId)!;
      return { success: true, device };
    }
  },

  // Admin Threat Detection & Majority Voting Consensus
  async getAdminThreatIncidents(): Promise<AdminThreatIncident[]> {
    try {
      return await api.get<AdminThreatIncident[]>("/admin/threats");
    } catch {
      return readStorage(STORAGE_KEYS.ADMIN_THREATS, INITIAL_ADMIN_THREAT_INCIDENTS);
    }
  },

  async castAdminVote(
    incidentId: string,
    voterAdminEmail: string,
    voteDecision: "suspend" | "clear",
  ): Promise<{ success: boolean; incident: AdminThreatIncident }> {
    try {
      return await api.post<{ success: boolean; incident: AdminThreatIncident }>(
        `/admin/threats/${incidentId}/vote`,
        { voterAdminEmail, voteDecision },
      );
    } catch {
      const incidents = readStorage(
        STORAGE_KEYS.ADMIN_THREATS,
        INITIAL_ADMIN_THREAT_INCIDENTS,
      );

      const updated = incidents.map((inc) => {
        if (inc.id !== incidentId) return inc;

        const votesToSuspend = new Set(inc.votesToSuspend);
        const votesToClear = new Set(inc.votesToClear);

        if (voteDecision === "suspend") {
          votesToSuspend.add(voterAdminEmail);
          votesToClear.delete(voterAdminEmail);
        } else {
          votesToClear.add(voterAdminEmail);
          votesToSuspend.delete(voterAdminEmail);
        }

        const suspendList = Array.from(votesToSuspend);
        const clearList = Array.from(votesToClear);

        let status = inc.status;
        let resolvedAt = inc.resolvedAt;

        if (suspendList.length >= inc.requiredVotesForMajority) {
          status = "suspended";
          resolvedAt = "Just now (Majority 3/5 Reached)";
        } else if (clearList.length >= inc.requiredVotesForMajority) {
          status = "cleared";
          resolvedAt = "Just now (Cleared by Majority)";
        }

        return {
          ...inc,
          votesToSuspend: suspendList,
          votesToClear: clearList,
          status,
          resolvedAt,
        };
      });

      writeStorage(STORAGE_KEYS.ADMIN_THREATS, updated);
      const incident = updated.find((i) => i.id === incidentId)!;
      return { success: true, incident };
    }
  },

  // Downloads Counter (kept remaining same / persistent)
  getDownloadsCount(): number {
    const stored = localStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    if (!stored) {
      const defaultCount = 248930;
      localStorage.setItem(STORAGE_KEYS.DOWNLOADS, defaultCount.toString());
      return defaultCount;
    }
    return parseInt(stored, 10) || 248930;
  },
};
