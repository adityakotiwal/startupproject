import { Database } from './supabase'

// Auth Types
export type User = Database['public']['Tables']['profiles']['Row'] & {
  name?: string // For compatibility
  email?: string // For compatibility
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; requiresVerification?: boolean }>
  signOut: () => Promise<void>
}

// Gym Types
export type Gym = Database['public']['Tables']['gyms']['Row']
export type GymInsert = Database['public']['Tables']['gyms']['Insert']
export type GymUpdate = Database['public']['Tables']['gyms']['Update']

// Member Types
export type Member = Database['public']['Tables']['members']['Row']
export type MemberInsert = Database['public']['Tables']['members']['Insert']
export type MemberUpdate = Database['public']['Tables']['members']['Update']

export interface MemberWithPlan extends Member {
  membership_plans?: MembershipPlan
}

// Staff Types
export type Staff = Database['public']['Tables']['staff']['Row']
export type StaffInsert = Database['public']['Tables']['staff']['Insert']
export type StaffUpdate = Database['public']['Tables']['staff']['Update']

// Membership Plan Types
export type MembershipPlan = Database['public']['Tables']['membership_plans']['Row']
export type MembershipPlanInsert = Database['public']['Tables']['membership_plans']['Insert']
export type MembershipPlanUpdate = Database['public']['Tables']['membership_plans']['Update']

// Payment Types
export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

// Expense Types
export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

// Course Types
export type Course = Database['public']['Tables']['courses']['Row']
export type CourseInsert = Database['public']['Tables']['courses']['Insert']
export type CourseUpdate = Database['public']['Tables']['courses']['Update']

// Email Template Types
export type EmailTemplate = Database['public']['Tables']['email_templates']['Row']
export type EmailTemplateInsert = Database['public']['Tables']['email_templates']['Insert']
export type EmailTemplateUpdate = Database['public']['Tables']['email_templates']['Update']

// Enums
export type MemberStatus = 'active' | 'overdue' | 'quit'
export type StaffRole = 'owner' | 'manager' | 'trainer' | 'receptionist'
export type PaymentMode = 'cash' | 'card' | 'upi' | 'bank_transfer'
export type ExpenseCategory = 'equipment' | 'maintenance' | 'utilities' | 'rent' | 'salary' | 'marketing' | 'other'