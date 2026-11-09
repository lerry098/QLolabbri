export const statuses = [
  "Diajukan",
  "Dalam Peninjauan",
  "Membutuhkan Perbaikan",
  "Disetujui",
  "Selesai",
] as const;
export type Status = (typeof statuses)[number];
export type RegistrationKind = "corporate" | "giro";
export interface User {
  id: string;
  corporateId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}
export interface StoredUser extends User {
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}
export interface TrackingEvent {
  id: string;
  status: Status;
  description: string;
  createdAt: string;
}
export interface Application {
  id: string;
  ownerId: string;
  kind: RegistrationKind;
  referenceNumber: string;
  companyName: string;
  businessType: string;
  contactEmail: string;
  contactName: string;
  phone: string;
  address?: string;
  city: string;
  province?: string;
  productType?: string;
  status: Status;
  createdAt: string;
  updatedAt: string;
  events: TrackingEvent[];
}
export interface News {
  id: string;
  title: string;
  summary: string;
  image: string;
  category: string;
  publicationDate: string;
  content: string[];
  slug: string;
}
export interface Dashboard {
  applications: Application[];
  user: User;
  notifications: { id: string; message: string; createdAt: string }[];
}
