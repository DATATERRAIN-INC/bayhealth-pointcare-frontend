export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  address: string;
  dob: string;
  doctor: string;
  service_name: string;
  country_code: string;
  phone_number: string;
  is_blocked: boolean;
}

export interface PatientTryAttemptApi {
  id?: number | string;
  datetime?: string | null;
  call_type?: string | null;
  status?: string | null;
  retell_call_id?: string | null;
}

export interface PatientApiRecord {
  id: number | string;
  name?: string;
  full_name?: string;
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
  call_status?: string;
  call_id?: number | string | null;
  last_call_id?: number | string;
  latest_call_id?: number | string;
  call_number?: number | string;
  channel?: string;
  call_channel?: string;
  last_call_channel?: string;
  retell_call_id?: string | null;
  duration_seconds?: number | null;
  /** Legacy numeric try count, or `{ count, attempts }` payload. */
  patient_tries?:
    | number
    | null
    | {
        count?: number | null;
        attempts?: PatientTryAttemptApi[] | null;
      };
  tries?: number | null;
  has_transcript?: boolean;
  last_call?: {
    id?: number | string;
    call_id?: number | string;
    channel?: string;
    retell_call_id?: string;
    has_transcript?: boolean;
    duration_seconds?: number | null;
    [key: string]: unknown;
  } | null;
  blocked?: boolean;
  is_active?: boolean;
  upload_file_key?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
