// ── Shared TypeScript types for the Nana frontend ──

export interface User {
  id: number;
  phone_number: string;
  email: string | null;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export type ReportType = 'LOST' | 'FOUND';
export type PetType   = 'DOG' | 'CAT' | 'BIRD' | 'OTHER';
export type Gender    = 'MALE' | 'FEMALE' | 'UNKNOWN';

export interface PetImage {
  id: number;
  image: string;
  is_main: boolean;
  uploaded_at: string;
}

export interface Sighting {
  id: number;
  report: string;
  user: number | null;
  user_phone: string | null;
  seen_at: string;
  location_description: string;
  latitude: string | null;
  longitude: string | null;
  image: string | null;
  created_at: string;
}

export interface PetReportList {
  id: string;
  title: string;
  report_type: ReportType;
  pet_type: PetType;
  city: string;
  district: string;
  event_date: string;
  reward: number;
  is_resolved: boolean;
  latitude: string | null;
  longitude: string | null;
  main_image: string | null;
  created_at: string;
}

export interface PetReportDetail extends PetReportList {
  user: number;
  user_phone: string;
  name: string;
  breed: string;
  color: string;
  gender: Gender;
  age: string;
  has_collar: boolean;
  microchip_id: string;
  special_features: string;
  address_description: string;
  latitude: string | null;
  longitude: string | null;
  contact_phone: string;
  images: PetImage[];
  sightings: Sighting[];
  updated_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const PET_TYPE_LABELS: Record<PetType, string> = {
  DOG: '🐕 سگ',
  CAT: '🐈 گربه',
  BIRD: '🐦 پرنده',
  OTHER: '🐾 سایر',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  LOST: 'گمشده',
  FOUND: 'پیدا شده',
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'نر',
  FEMALE: 'ماده',
  UNKNOWN: 'نامشخص',
};
