export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  address: string;
  dob: string;
  doctor: string;
  country_code: string;
  phone_number: string;
  service_name: string;
}

export interface PatientApiRecord {
  id: number | string;
  name?: string;
  first_name?: string;
  last_name?: string;
  address: string;
  dob: string;
  doctor: string;
  country_code?: string;
  phone_number?: string;
  service_name?: string;
  reason_for_call?: string;
  source?: string;
  is_blocked?: boolean;
  blocked?: boolean;
  is_active?: boolean;
  upload_file_key?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
