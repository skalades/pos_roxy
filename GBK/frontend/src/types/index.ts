export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'rt' | 'rw' | 'bendahara' | 'warga';
  status: 'pending' | 'active' | 'rejected';
  nik?: string;
  phone?: string;
  house_id?: number | null;
  avatar?: string | null;
  house?: House;
  family_members?: FamilyMember[];
}

export interface House {
  id: number;
  block: string;
  number: string;
  full_address?: string;
  status: 'occupied_owner' | 'rented' | 'vacant';
  notes?: string;
  residents_count?: number;
}

export interface FamilyMember {
  id: number;
  user_id: number;
  name: string;
  relation: string;
  birth_date?: string;
  gender: 'L' | 'P';
}

export interface Invoice {
  id: number;
  house_id: number;
  month: number;
  year: number;
  kebersihan_amount: string;
  air_amount: string;
  total_amount: string;
  status: 'unpaid' | 'pending' | 'paid_transfer' | 'paid_manual';
  payment_method: 'transfer' | 'cash' | 'none';
  verified_by?: number;
  verified_at?: string;
  house?: House;
  payment_proof?: PaymentProof;
}

export interface PaymentProof {
  id: number;
  invoice_id: number;
  uploaded_by: number;
  file_path: string;
  notes?: string;
  uploaded_at: string;
}

export interface CashLedger {
  id: number;
  type: 'income' | 'expense';
  amount: string;
  description: string;
  payment_method: 'transfer' | 'cash';
  reference_id?: number;
  proof_path?: string;
  recorded_by?: number;
  recorded_at: string;
  recorder?: User;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  category: 'agenda' | 'berita_duka' | 'informasi_umum';
  author_id?: number;
  published_at?: string;
  created_at: string;
  author?: User;
}

export interface Complaint {
  id: number;
  user_id: number;
  title: string;
  description: string;
  location: string;
  photo_path?: string | null;
  status: 'new' | 'reviewing' | 'in_progress' | 'resolved';
  updated_by?: number | null;
  created_at: string;
  user?: User;
  updater?: User;
}

export interface VoteResultOption {
  option: string;
  votes: number;
  percentage: number;
}

export interface Vote {
  id: number;
  title: string;
  description: string;
  options: string[];
  deadline: string;
  is_active: boolean;
  created_by: string;
  has_voted: boolean;
  voted_option: string | null;
  total_votes: number;
  results: VoteResultOption[];
}
