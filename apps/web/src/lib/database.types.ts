// ============================================================
// Manual DB type definitions — ExamSeat Monitor V1
// Keep in sync with supabase/migrations/001_initial_schema.sql
//
// NOTE: Every table must include `Relationships` for supabase-js
// to correctly infer row types (required by GenericTable constraint).
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          email?: string
          display_name?: string | null
        }
        Relationships: []
      }

      monitoring_rules: {
        Row: {
          id: string
          user_id: string
          platform_id: string
          exam_type: string
          city: string | null
          date_preference: string | null
          channels: string[]
          priority: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform_id: string
          exam_type: string
          city?: string | null
          date_preference?: string | null
          channels?: string[]
          priority?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          platform_id?: string
          exam_type?: string
          city?: string | null
          date_preference?: string | null
          channels?: string[]
          priority?: number
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'monitoring_rules_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }

      seat_observations: {
        Row: {
          id: string
          platform_id: string
          center_name: string
          city: string
          province: string | null
          exam_type: string
          session_label: string | null
          session_date: string | null
          availability_status: string
          seats_text: string | null
          source_url: string
          source_hash: string | null
          confidence: number | null
          observed_at: string
        }
        Insert: {
          id?: string
          platform_id: string
          center_name: string
          city: string
          province?: string | null
          exam_type: string
          session_label?: string | null
          session_date?: string | null
          availability_status: string
          seats_text?: string | null
          source_url: string
          source_hash?: string | null
          confidence?: number | null
          observed_at?: string
        }
        Update: {
          seats_text?: string | null
          availability_status?: string
        }
        Relationships: []
      }

      change_events: {
        Row: {
          id: string
          platform_id: string
          exam_type: string
          city: string
          center_name: string
          previous_status: string | null
          new_status: string
          event_type: string
          detected_at: string
          confidence: number | null
          raw_observation_id: string | null
          official_url: string | null
        }
        Insert: {
          id?: string
          platform_id: string
          exam_type: string
          city: string
          center_name: string
          previous_status?: string | null
          new_status: string
          event_type: string
          detected_at?: string
          confidence?: number | null
          raw_observation_id?: string | null
          official_url?: string | null
        }
        Update: {
          official_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'change_events_raw_observation_id_fkey'
            columns: ['raw_observation_id']
            isOneToOne: false
            referencedRelation: 'seat_observations'
            referencedColumns: ['id']
          }
        ]
      }

      notification_deliveries: {
        Row: {
          id: string
          user_id: string
          change_event_id: string
          rule_id: string | null
          channel: string
          status: string
          sent_at: string | null
          is_viewed: boolean
          viewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          change_event_id: string
          rule_id?: string | null
          channel: string
          status?: string
          sent_at?: string | null
          is_viewed?: boolean
          viewed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: string
          sent_at?: string | null
          is_viewed?: boolean
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notification_deliveries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_deliveries_change_event_id_fkey'
            columns: ['change_event_id']
            isOneToOne: false
            referencedRelation: 'change_events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notification_deliveries_rule_id_fkey'
            columns: ['rule_id']
            isOneToOne: false
            referencedRelation: 'monitoring_rules'
            referencedColumns: ['id']
          }
        ]
      }

      platforms: {
        Row: {
          id: string
          display_name: string
          city: string
          province: string
          country: string
          exam_types_supported: string[]
          entry_url: string
          detection_url: string
          registration_url: string | null
          health_status: string
          monitoring_level: string
          detection_mode: string
          autofill_supported: boolean
          polling_interval_s: number
          last_health_check: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          city: string
          province: string
          country?: string
          exam_types_supported?: string[]
          entry_url: string
          detection_url: string
          registration_url?: string | null
          health_status?: string
          monitoring_level?: string
          detection_mode?: string
          autofill_supported?: boolean
          polling_interval_s?: number
          last_health_check?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          health_status?: string
          last_health_check?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }

      user_preferences: {
        Row: {
          user_id: string
          notify_browser: boolean
          notify_email: boolean
          notify_sms: boolean
          cooldown_minutes: number
          timezone: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          notify_browser?: boolean
          notify_email?: boolean
          notify_sms?: boolean
          cooldown_minutes?: number
          timezone?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          notify_browser?: boolean
          notify_email?: boolean
          notify_sms?: boolean
          cooldown_minutes?: number
          timezone?: string
          language?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row types
export type DbProfile = Database['public']['Tables']['profiles']['Row']
export type DbRule = Database['public']['Tables']['monitoring_rules']['Row']
export type DbObservation = Database['public']['Tables']['seat_observations']['Row']
export type DbChangeEvent = Database['public']['Tables']['change_events']['Row']
export type DbNotification = Database['public']['Tables']['notification_deliveries']['Row']
export type DbPlatform = Database['public']['Tables']['platforms']['Row']
export type DbUserPreferences = Database['public']['Tables']['user_preferences']['Row']

// Joined notification type (from .select('*, change_events(*)'))
export interface DbNotificationWithEvent extends DbNotification {
  change_events: DbChangeEvent | null
}
