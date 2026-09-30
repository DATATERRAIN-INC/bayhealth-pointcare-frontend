export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  address: string;
  dob: string;
  doctor: string;
  country_code: string;
  phone_number: string;
  live_agent_country_code: string;
  live_agent_number: string;
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
  live_agent_country_code?: string;
  live_agent_number?: string;
  source?: string;
  is_blocked?: boolean;
  blocked?: boolean;
  is_active?: boolean;
  upload_file_key?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
