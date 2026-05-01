import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { properties as seedProperties, tenants as seedTenants, maintenance as seedMaintenance, Property, Tenant, MaintenanceRequest } from "@/data/mock";
import { persistJSON, readJSON } from "@/lib/session";

export interface SentEmail {
  id: string;
  to: string;
  recipientName: string;
  audience: "tenant" | "landlord";
  subject: string;
  loginUrl: string;
  sentAt: string;
}

export interface AgreementVersion {
  version: number;
  text: string;
  editedAt: string;
  editedBy: string;
  status: "draft" | "sent" | "signed";
}

export interface TenantAgreement {
  tenantId: string;
  versions: AgreementVersion[];
}

export interface NotificationLogEntry {
  id: string;
  type: "escalation" | "info" | "system";
  title: string;
  body: string;
  createdAt: string;
  meta?: Record<string, string | number>;
}

interface Store {
  properties: Property[];
  tenants: Tenant[];
  maintenance: MaintenanceRequest[];
  sentEmails: SentEmail[];
  agreements: Record<string, TenantAgreement>;
  notificationLog: NotificationLogEntry[];
  addProperty: (p: Property) => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addTenant: (t: Tenant) => void;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  addMaintenance: (m: MaintenanceRequest) => void;
  updateMaintenance: (id: string, patch: Partial<MaintenanceRequest>) => void;
  bulkUpdateMaintenance: (ids: string[], patch: Partial<MaintenanceRequest>) => void;
  sendWelcomeEmail: (input: Omit<SentEmail, "id" | "sentAt" | "subject" | "loginUrl"> & { loginUrl?: string }) => SentEmail;
  saveAgreementVersion: (tenantId: string, text: string, status?: AgreementVersion["status"]) => AgreementVersion;
  markAgreementSent: (tenantId: string, version: number) => void;
  logNotification: (entry: Omit<NotificationLogEntry, "id" | "createdAt">) => NotificationLogEntry;
}

const Ctx = createContext<Store | null>(null);

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(seedProperties);
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>(seedMaintenance);
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [agreements, setAgreements] = useState<Record<string, TenantAgreement>>(() =>
    readJSON<Record<string, TenantAgreement>>("metro-agreements", {})
  );
  const [notificationLog, setNotificationLog] = useState<NotificationLogEntry[]>(() =>
    readJSON<NotificationLogEntry[]>("metro-notifications-log", [])
  );

  useEffect(() => persistJSON("metro-agreements", agreements), [agreements]);
  useEffect(() => persistJSON("metro-notifications-log", notificationLog), [notificationLog]);

  const sendWelcomeEmail: Store["sendWelcomeEmail"] = (input) => {
    const portal = input.audience === "tenant" ? "/tenant" : "/landlord";
    const email: SentEmail = {
      id: `E${Date.now()}`,
      to: input.to,
      recipientName: input.recipientName,
      audience: input.audience,
      subject: `Welcome to Metro Manaja — your ${input.audience} portal`,
      loginUrl: input.loginUrl ?? `${typeof window !== "undefined" ? window.location.origin : ""}${portal}`,
      sentAt: new Date().toISOString(),
    };
    setSentEmails((cur) => [email, ...cur]);
    return email;
  };

  const saveAgreementVersion: Store["saveAgreementVersion"] = (tenantId, text, status = "draft") => {
    const existing = agreements[tenantId]?.versions ?? [];
    const next: AgreementVersion = {
      version: existing.length + 1,
      text,
      editedAt: new Date().toISOString(),
      editedBy: "Adesuwa Edun",
      status,
    };
    setAgreements((cur) => ({
      ...cur,
      [tenantId]: { tenantId, versions: [...existing, next] },
    }));
    return next;
  };

  const markAgreementSent: Store["markAgreementSent"] = (tenantId, version) => {
    setAgreements((cur) => {
      const a = cur[tenantId];
      if (!a) return cur;
      return {
        ...cur,
        [tenantId]: {
          ...a,
          versions: a.versions.map((v) => (v.version === version ? { ...v, status: "sent" } : v)),
        },
      };
    });
  };

  const logNotification: Store["logNotification"] = (entry) => {
    const created: NotificationLogEntry = {
      ...entry,
      id: `LOG${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setNotificationLog((cur) => [created, ...cur]);
    return created;
  };

  return (
    <Ctx.Provider
      value={{
        properties,
        tenants,
        maintenance,
        sentEmails,
        agreements,
        notificationLog,
        sendWelcomeEmail,
        saveAgreementVersion,
        markAgreementSent,
        logNotification,
        addProperty: (p) => setProperties((cur) => [p, ...cur]),
        updateProperty: (id, patch) =>
          setProperties((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p))),
        deleteProperty: (id) => {
          setProperties((cur) => cur.filter((p) => p.id !== id));
          setTenants((cur) => cur.filter((t) => t.propertyId !== id));
          setMaintenance((cur) => cur.filter((m) => m.propertyId !== id));
        },
        addTenant: (t) => setTenants((cur) => [t, ...cur]),
        updateTenant: (id, patch) =>
          setTenants((cur) => cur.map((t) => (t.id === id ? { ...t, ...patch } : t))),
        addMaintenance: (m) => setMaintenance((cur) => [m, ...cur]),
        updateMaintenance: (id, patch) =>
          setMaintenance((cur) => cur.map((m) => (m.id === id ? { ...m, ...patch } : m))),
        bulkUpdateMaintenance: (ids, patch) =>
          setMaintenance((cur) => cur.map((m) => (ids.includes(m.id) ? { ...m, ...patch } : m))),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("MockStoreProvider missing");
  return c;
};
