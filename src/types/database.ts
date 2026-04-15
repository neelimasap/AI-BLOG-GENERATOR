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
      generated_posts: {
        Row: {
          id: string
          topic: string
          tone: string
          audience: string
          outline: string | null
          content: string | null
          seo_meta: Json | null
          image_url: string | null
          sources: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          topic: string
          tone: string
          audience: string
          outline?: string | null
          content?: string | null
          seo_meta?: Json | null
          image_url?: string | null
          sources?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          topic?: string
          tone?: string
          audience?: string
          outline?: string | null
          content?: string | null
          seo_meta?: Json | null
          image_url?: string | null
          sources?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      // Include existing tables from previous schema
      projects: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          topic: string
          audience: string
          tone: string
          target_word_count: number
          status: string
          research_summary: string | null
          outline: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          topic: string
          audience: string
          tone: string
          target_word_count: number
          status: string
          research_summary?: string | null
          outline?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          topic?: string
          audience?: string
          tone?: string
          target_word_count?: number
          status?: string
          research_summary?: string | null
          outline?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      drafts: {
        Row: {
          id: string
          project_id: string
          created_at: string
          updated_at: string
          version: number
          content: string
          word_count: number
          is_final: boolean
        }
        Insert: {
          id?: string
          project_id: string
          created_at?: string
          updated_at?: string
          version?: number
          content: string
          word_count: number
          is_final?: boolean
        }
        Update: {
          id?: string
          project_id?: string
          created_at?: string
          updated_at?: string
          version?: number
          content?: string
          word_count?: number
          is_final?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      generated_images: {
        Row: {
          id: string
          project_id: string
          created_at: string
          fal_request_id: string
          prompt: string
          style: string
          url: string
          width: number
          height: number
          is_embedded: boolean
        }
        Insert: {
          id?: string
          project_id: string
          created_at?: string
          fal_request_id: string
          prompt: string
          style: string
          url: string
          width: number
          height: number
          is_embedded?: boolean
        }
        Update: {
          id?: string
          project_id?: string
          created_at?: string
          fal_request_id?: string
          prompt?: string
          style?: string
          url?: string
          width?: number
          height?: number
          is_embedded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "generated_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
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
