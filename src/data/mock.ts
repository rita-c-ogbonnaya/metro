export type PropertyType =
  | "Bungalow"
  | "Flat"
  | "Terrace Duplex"
  | "Semi-detached Duplex"
  | "Fully Detached Duplex"
  | "Semi-detached Duplex with BQ"
  | "Fully Detached Duplex with BQ";

export type OccupancyStatus = "Occupied" | "Vacant" | "Shortlet";
export type RentStatus = "Paid" | "Due Soon" | "Overdue" | "Active" | "Expiring Soon";

export interface Property {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  annualRent: number;
  status: OccupancyStatus;
  tenantId: string | null;
  landlordId: string;
  registeredOn: string;
  // Optional extended fields captured by the multi-step add-property flow.
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  houseNumber?: string;
  busStop?: string;
  state?: string;
  country?: string;
  paymentFrequency?: "Yearly" | "Monthly" | "Quarterly" | "Shortlet";
  features?: string[];
  interiorImage?: string;
  exteriorImage?: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  type: "Yearly" | "Shortlet";
  startDate: string;
  endDate: string;
  rentDue: string;
  rentStatus: "Active" | "Overdue" | "Expiring Soon" | "Due Soon";
  occupation: string;
  dob: string;
  avatar?: string;
  // Optional fields captured by the multi-step Add Tenant flow.
  firstName?: string;
  lastName?: string;
  emergencyContact?: string;
  unit?: string;
  rentAmount?: number;
  paymentFrequency?: "Yearly" | "Monthly" | "Quarterly" | "Shortlet";
  paymentMethod?: "Bank transfer" | "Cash" | "Card" | "Cheque";
  paymentStatus?: "Paid" | "Not paid" | "Pending";
  initialPaymentDate?: string;
  leaseAgreementName?: string;
  idDocumentName?: string;
  agreementText?: string;
}

export interface Landlord {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  category: "Plumbing" | "Electrical" | "Structural" | "General" | "Renovation";
  description: string;
  date: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  assignedTo: string;
}

export interface Transaction {
  id: string;
  date: string;
  propertyId: string;
  description: string;
  type: "Revenue" | "Expense";
  amount: number;
}

export interface AppNotification {
  id: string;
  type: "Rent Due" | "Maintenance" | "Birthday" | "Document" | "System";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export const landlords: Landlord[] = [
  { id: "L1", name: "Adebayo Ogunlesi", email: "adebayo@example.com", phone: "+2348012345678" },
  { id: "L2", name: "Folake Adeyemi", email: "folake@example.com", phone: "+2348023456789" },
  { id: "L3", name: "Chinedu Okeke", email: "chinedu@example.com", phone: "+2348034567890" },
  { id: "L4", name: "Aisha Bello", email: "aisha@example.com", phone: "+2348045678901" },
];

export const properties: Property[] = [
  { id: "P1", name: "Lekki Phase 1 Duplex", address: "12 Admiralty Way, Lekki Phase 1, Lagos", type: "Fully Detached Duplex", bedrooms: 5, bathrooms: 6, annualRent: 18_000_000, status: "Occupied", tenantId: "T1", landlordId: "L1", registeredOn: "2023-03-12" },
  { id: "P2", name: "Ikoyi Banana Island Duplex", address: "7 Ocean Parade, Banana Island, Ikoyi", type: "Fully Detached Duplex with BQ", bedrooms: 6, bathrooms: 7, annualRent: 35_000_000, status: "Occupied", tenantId: "T2", landlordId: "L1", registeredOn: "2022-11-05" },
  { id: "P3", name: "Victoria Island Duplex", address: "22 Adeola Odeku Street, Victoria Island", type: "Semi-detached Duplex with BQ", bedrooms: 4, bathrooms: 5, annualRent: 22_000_000, status: "Occupied", tenantId: "T3", landlordId: "L2", registeredOn: "2023-06-18" },
  { id: "P4", name: "Surulere 3-Bed Flat", address: "15 Adeniran Ogunsanya, Surulere", type: "Flat", bedrooms: 3, bathrooms: 3, annualRent: 4_500_000, status: "Occupied", tenantId: "T4", landlordId: "L2", registeredOn: "2023-01-22" },
  { id: "P5", name: "Yaba Modern Flat", address: "8 Herbert Macaulay Way, Yaba", type: "Flat", bedrooms: 2, bathrooms: 2, annualRent: 3_200_000, status: "Vacant", tenantId: null, landlordId: "L3", registeredOn: "2024-02-10" },
  { id: "P6", name: "Ikeja GRA Bungalow", address: "5 Mobolaji Bank Anthony Way, Ikeja GRA", type: "Bungalow", bedrooms: 4, bathrooms: 4, annualRent: 7_000_000, status: "Occupied", tenantId: "T5", landlordId: "L3", registeredOn: "2022-09-30" },
  { id: "P7", name: "Eko Atlantic Shortlet", address: "Eko Pearl Towers, Eko Atlantic, Lagos", type: "Flat", bedrooms: 2, bathrooms: 2, annualRent: 24_000_000, status: "Shortlet", tenantId: "T6", landlordId: "L4", registeredOn: "2024-04-01" },
  { id: "P8", name: "Ajah Terrace Duplex", address: "10 Crown Estate, Ajah", type: "Terrace Duplex", bedrooms: 4, bathrooms: 4, annualRent: 6_500_000, status: "Occupied", tenantId: "T7", landlordId: "L4", registeredOn: "2023-08-14" },
];

export const tenants: Tenant[] = [
  { id: "T1", name: "Tunde Bakare", email: "tunde@example.com", phone: "+2348101111111", propertyId: "P1", type: "Yearly", startDate: "2024-05-01", endDate: "2025-05-01", rentDue: "2025-05-01", rentStatus: "Expiring Soon", occupation: "Investment Banker", dob: "1985-04-30" },
  { id: "T2", name: "Ngozi Eze", email: "ngozi@example.com", phone: "+2348102222222", propertyId: "P2", type: "Yearly", startDate: "2024-01-15", endDate: "2026-01-15", rentDue: "2026-01-15", rentStatus: "Active", occupation: "Tech CEO", dob: "1980-11-12" },
  { id: "T3", name: "Emeka Obi", email: "emeka@example.com", phone: "+2348103333333", propertyId: "P3", type: "Yearly", startDate: "2024-07-01", endDate: "2025-07-01", rentDue: "2025-07-01", rentStatus: "Due Soon", occupation: "Lawyer", dob: "1988-04-28" },
  { id: "T4", name: "Bisi Adekunle", email: "bisi@example.com", phone: "+2348104444444", propertyId: "P4", type: "Yearly", startDate: "2024-03-10", endDate: "2025-03-10", rentDue: "2025-03-10", rentStatus: "Overdue", occupation: "Doctor", dob: "1990-07-22" },
  { id: "T5", name: "Yusuf Ibrahim", email: "yusuf@example.com", phone: "+2348105555555", propertyId: "P6", type: "Yearly", startDate: "2024-09-01", endDate: "2025-09-01", rentDue: "2025-09-01", rentStatus: "Active", occupation: "Engineer", dob: "1992-01-15" },
  { id: "T6", name: "Sarah Okafor", email: "sarah@example.com", phone: "+2348106666666", propertyId: "P7", type: "Shortlet", startDate: "2025-04-15", endDate: "2025-05-15", rentDue: "2025-05-15", rentStatus: "Active", occupation: "Entrepreneur", dob: "1995-06-10" },
  { id: "T7", name: "Kelechi Okonkwo", email: "kelechi@example.com", phone: "+2348107777777", propertyId: "P8", type: "Yearly", startDate: "2024-11-01", endDate: "2025-11-01", rentDue: "2025-11-01", rentStatus: "Active", occupation: "Architect", dob: "1987-09-03" },
  { id: "T8", name: "Funmi Ogundipe", email: "funmi@example.com", phone: "+2348108888888", propertyId: "P7", type: "Shortlet", startDate: "2025-03-01", endDate: "2025-04-15", rentDue: "2025-04-15", rentStatus: "Active", occupation: "Consultant", dob: "1991-12-20" },
];

export const maintenance: MaintenanceRequest[] = [
  { id: "M1", propertyId: "P1", tenantId: "T1", category: "Plumbing", description: "Leaking pipe in master bathroom", date: "2025-04-20", priority: "High", status: "In Progress", assignedTo: "Plumber Co." },
  { id: "M2", propertyId: "P3", tenantId: "T3", category: "Electrical", description: "Generator not starting after switch-over", date: "2025-04-22", priority: "Critical", status: "Open", assignedTo: "Unassigned" },
  { id: "M3", propertyId: "P4", tenantId: "T4", category: "General", description: "Broken window latch in living room", date: "2025-04-15", priority: "Low", status: "Resolved", assignedTo: "Handyman Ltd." },
  { id: "M4", propertyId: "P2", tenantId: "T2", category: "Structural", description: "Hairline crack in stairwell wall", date: "2025-04-18", priority: "Medium", status: "Open", assignedTo: "Builder Pro" },
  { id: "M5", propertyId: "P6", tenantId: "T5", category: "Plumbing", description: "Kitchen sink slow drain", date: "2025-04-10", priority: "Low", status: "Resolved", assignedTo: "Plumber Co." },
  { id: "M6", propertyId: "P8", tenantId: "T7", category: "Renovation", description: "Repaint guest bedroom", date: "2025-04-25", priority: "Medium", status: "In Progress", assignedTo: "Painter Crew" },
];

export const transactions: Transaction[] = [
  { id: "X1", date: "2024-11-01", propertyId: "P1", description: "Annual rent — Tunde Bakare", type: "Revenue", amount: 18_000_000 },
  { id: "X2", date: "2024-11-15", propertyId: "P1", description: "Plumbing repair", type: "Expense", amount: 250_000 },
  { id: "X3", date: "2024-12-05", propertyId: "P3", description: "Service charge collection", type: "Revenue", amount: 600_000 },
  { id: "X4", date: "2024-12-20", propertyId: "P5", description: "Renovation — repaint", type: "Expense", amount: 1_200_000 },
  { id: "X5", date: "2025-01-10", propertyId: "P2", description: "Annual rent — Ngozi Eze", type: "Revenue", amount: 35_000_000 },
  { id: "X6", date: "2025-01-25", propertyId: "P6", description: "Generator service", type: "Expense", amount: 180_000 },
  { id: "X7", date: "2025-02-08", propertyId: "P4", description: "Rent receipt — Bisi Adekunle", type: "Revenue", amount: 4_500_000 },
  { id: "X8", date: "2025-02-22", propertyId: "P7", description: "Shortlet booking", type: "Revenue", amount: 2_000_000 },
  { id: "X9", date: "2025-03-05", propertyId: "P8", description: "Roof inspection", type: "Expense", amount: 95_000 },
  { id: "X10", date: "2025-03-18", propertyId: "P7", description: "Shortlet booking", type: "Revenue", amount: 2_400_000 },
  { id: "X11", date: "2025-04-02", propertyId: "P3", description: "Legal — notice draft", type: "Expense", amount: 150_000 },
  { id: "X12", date: "2025-04-19", propertyId: "P7", description: "Shortlet booking — Sarah", type: "Revenue", amount: 2_200_000 },
];

export const notifications: AppNotification[] = [
  { id: "N1", type: "Rent Due", title: "Rent overdue", body: "Bisi Adekunle at Surulere 3-Bed Flat is 47 days overdue.", timestamp: "2025-04-26T09:12:00Z", read: false },
  { id: "N2", type: "Maintenance", title: "Critical request", body: "Generator outage at Victoria Island Duplex.", timestamp: "2025-04-22T14:33:00Z", read: false },
  { id: "N3", type: "Rent Due", title: "Rent due in 7 days", body: "Sarah Okafor — Eko Atlantic Shortlet.", timestamp: "2025-04-20T11:20:00Z", read: false },
  { id: "N4", type: "Birthday", title: "Birthday today", body: "🎂 Tunde Bakare turns 40 today.", timestamp: "2025-04-30T07:00:00Z", read: false },
  { id: "N5", type: "Document", title: "Tenancy signed", body: "Kelechi Okonkwo signed his renewal agreement.", timestamp: "2025-04-19T16:08:00Z", read: true },
  { id: "N6", type: "Rent Due", title: "Rent due in 3 months", body: "Emeka Obi — VI Duplex renewal upcoming.", timestamp: "2025-04-10T10:00:00Z", read: true },
  { id: "N7", type: "System", title: "Welcome to Metro Manager", body: "Your dashboard is ready.", timestamp: "2025-04-01T08:00:00Z", read: true },
];

export const monthlyFinancials = [
  { month: "Nov", revenue: 18_600_000, expenses: 250_000 },
  { month: "Dec", revenue: 600_000, expenses: 1_200_000 },
  { month: "Jan", revenue: 35_000_000, expenses: 180_000 },
  { month: "Feb", revenue: 6_500_000, expenses: 0 },
  { month: "Mar", revenue: 2_400_000, expenses: 95_000 },
  { month: "Apr", revenue: 2_200_000, expenses: 150_000 },
];

export const rentDueTimeline = properties
  .filter((p) => p.tenantId)
  .slice(0, 6)
  .map((p) => {
    const t = tenants.find((x) => x.id === p.tenantId)!;
    const buckets = { overdue: 0, days7: 0, months3: 0, months6: 0 };
    if (t.rentStatus === "Overdue") buckets.overdue = p.annualRent;
    else if (t.rentStatus === "Due Soon" || t.rentStatus === "Expiring Soon") buckets.days7 = p.annualRent;
    else buckets.months6 = p.annualRent;
    return { name: p.name.split(" ")[0], ...buckets };
  });
