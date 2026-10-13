export type Role = "SEEKER" | "TUTOR" | "ADMIN";
export type TeachingMode = "HOME" | "CENTER" | "ONLINE";
export type FeeUnit = "HOUR" | "MONTH";
export type InquiryStatus = "NEW" | "CONTACTED" | "CLOSED";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
}

export interface City {
  id: number;
  name: string;
}

export interface Locality {
  id: number;
  name: string;
  cityId: number;
}

export interface Subject {
  id: number;
  name: string;
}

export interface Level {
  id: number;
  name: string;
  sortOrder: number;
}

export interface TutorListItem {
  id: string;
  headline: string;
  experienceYears: number;
  feeMin: number | null;
  feeMax: number | null;
  feeUnit: FeeUnit;
  modes: TeachingMode[];
  isVerified: boolean;
  user: { name: string };
  city: { id: number; name: string };
  locality: { id: number; name: string };
  subjects: { id: number; name: string }[];
  levels: { id: number; name: string }[];
}

export interface TutorDetail extends TutorListItem {
  bio: string;
  contactPhone: string | null;
  contactVisible: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating: number | null;
  reviewCount: number;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { name: string };
}

export interface Inquiry {
  id: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  tutorProfile?: {
    id: string;
    headline: string;
    user: { name: string };
    city: { name: string };
  };
  fromUser?: { name: string; phone: string | null; email: string };
}

export interface Requirement {
  id: string;
  description: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  isActive: boolean;
  createdAt: string;
  locality: { id: number; name: string; city: { id: number; name: string } };
  subject: { id: number; name: string };
  level: { id: number; name: string };
  user?: { name: string; phone?: string | null; email?: string };
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  averageRating?: number | null;
  contactVisible?: boolean;
}