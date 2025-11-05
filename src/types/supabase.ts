export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: string
        }
        Insert: {
          id: string
          full_name: string
          role: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
        }
      }
      gyms: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          logo_url: string | null
          address: string | null
          phone: string | null
          email: string | null
          owner_id: string
          settings: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          owner_id: string
          settings?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          owner_id?: string
          settings?: Json | null
        }
      }
      members: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          gym_id: string
          name: string
          email: string | null
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          address: string | null
          photo_url: string | null
          membership_plan_id: string | null
          join_date: string
          status: 'active' | 'overdue' | 'quit'
          custom_fields: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id: string
          name: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          photo_url?: string | null
          membership_plan_id?: string | null
          join_date?: string
          status?: 'active' | 'overdue' | 'quit'
          custom_fields?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          date_of_birth?: string | null
          gender?: string | null
          address?: string | null
          photo_url?: string | null
          membership_plan_id?: string | null
          join_date?: string
          status?: 'active' | 'overdue' | 'quit'
          custom_fields?: Json | null
        }
      }
      staff: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          gym_id: string
          name: string
          email: string | null
          phone: string | null
          role: 'owner' | 'manager' | 'trainer' | 'receptionist'
          salary: number | null
          hire_date: string
          status: 'active' | 'inactive'
          photo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id: string
          name: string
          email?: string | null
          phone?: string | null
          role: 'owner' | 'manager' | 'trainer' | 'receptionist'
          salary?: number | null
          hire_date?: string
          status?: 'active' | 'inactive'
          photo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          role?: 'owner' | 'manager' | 'trainer' | 'receptionist'
          salary?: number | null
          hire_date?: string
          status?: 'active' | 'inactive'
          photo_url?: string | null
        }
      }
      membership_plans: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          gym_id: string
          name: string
          description: string | null
          price: number
          duration_months: number
          features: Json | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id: string
          name: string
          description?: string | null
          price: number
          duration_months: number
          features?: Json | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id?: string
          name?: string
          description?: string | null
          price?: number
          duration_months?: number
          features?: Json | null
          is_active?: boolean
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          gym_id: string
          member_id: string
          amount: number
          payment_mode: 'cash' | 'card' | 'upi' | 'bank_transfer'
          transaction_id: string | null
          notes: string | null
          payment_date: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id: string
          member_id: string
          amount: number
          payment_mode: 'cash' | 'card' | 'upi' | 'bank_transfer'
          transaction_id?: string | null
          notes?: string | null
          payment_date?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id?: string
          member_id?: string
          amount?: number
          payment_mode?: 'cash' | 'card' | 'upi' | 'bank_transfer'
          transaction_id?: string | null
          notes?: string | null
          payment_date?: string
        }
      }
      expenses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          gym_id: string
          amount: number
          category: 'equipment' | 'maintenance' | 'utilities' | 'rent' | 'salary' | 'marketing' | 'other'
          description: string
          date: string
          receipt_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id: string
          amount: number
          category: 'equipment' | 'maintenance' | 'utilities' | 'rent' | 'salary' | 'marketing' | 'other'
          description: string
          date?: string
          receipt_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id?: string
          amount?: number
          category?: 'equipment' | 'maintenance' | 'utilities' | 'rent' | 'salary' | 'marketing' | 'other'
          description?: string
          date?: string
          receipt_url?: string | null
        }
      }
      courses: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          gym_id: string
          name: string
          description: string | null
          instructor_id: string | null
          schedule: Json | null
          price: number | null
          max_participants: number | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id: string
          name: string
          description?: string | null
          instructor_id?: string | null
          schedule?: Json | null
          price?: number | null
          max_participants?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id?: string
          name?: string
          description?: string | null
          instructor_id?: string | null
          schedule?: Json | null
          price?: number | null
          max_participants?: number | null
          is_active?: boolean
        }
      }
      email_templates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          gym_id: string
          name: string
          subject: string
          body: string
          variables: Json | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id: string
          name: string
          subject: string
          body: string
          variables?: Json | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          gym_id?: string
          name?: string
          subject?: string
          body?: string
          variables?: Json | null
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}