export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          id: string
          related_id: string | null
          timestamp: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          related_id?: string | null
          timestamp?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          related_id?: string | null
          timestamp?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          priority: string
          related_id: string | null
          related_type: string | null
          resolved: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          priority: string
          related_id?: string | null
          related_type?: string | null
          resolved?: boolean
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          priority?: string
          related_id?: string | null
          related_type?: string | null
          resolved?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_bookings: {
        Row: {
          client_id: string | null
          client_user_id: string | null
          confirmed_cost: number | null
          created_at: string | null
          dropoff_location: string
          estimated_cost: number | null
          id: string
          passengers: number | null
          pickup_date: string
          pickup_location: string
          pickup_time: string | null
          return_date: string | null
          return_time: string | null
          service_type: string
          special_requests: string | null
          status: string | null
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          client_user_id?: string | null
          confirmed_cost?: number | null
          created_at?: string | null
          dropoff_location: string
          estimated_cost?: number | null
          id?: string
          passengers?: number | null
          pickup_date: string
          pickup_location: string
          pickup_time?: string | null
          return_date?: string | null
          return_time?: string | null
          service_type: string
          special_requests?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          client_user_id?: string | null
          confirmed_cost?: number | null
          created_at?: string | null
          dropoff_location?: string
          estimated_cost?: number | null
          id?: string
          passengers?: number | null
          pickup_date?: string
          pickup_location?: string
          pickup_time?: string | null
          return_date?: string | null
          return_time?: string | null
          service_type?: string
          special_requests?: string | null
          status?: string | null
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_bookings_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "client_users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_members: {
        Row: {
          client_id: string | null
          created_at: string | null
          document_name: string | null
          document_url: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          document_name?: string | null
          document_url?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          password_hash: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          password_hash: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          password_hash?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          contact: string | null
          created_at: string | null
          description: string | null
          documents: Json | null
          email: string | null
          id: string
          is_archived: boolean | null
          name: string
          phone: string | null
          profile_image_url: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          is_archived?: boolean | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          type: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact?: string | null
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          email?: string | null
          id?: string
          is_archived?: boolean | null
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          type?: Database["public"]["Enums"]["client_type"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_name: string
          contract_file: string | null
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          client_name: string
          contract_file?: string | null
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          status: string
          updated_at?: string
        }
        Update: {
          client_name?: string
          contract_file?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      drivers: {
        Row: {
          avatar_url: string | null
          contact: string | null
          created_at: string | null
          document_url: string | null
          id: string
          license_expiry: string | null
          license_number: string
          license_type: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["driver_status"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          contact?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          license_expiry?: string | null
          license_number: string
          license_type?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          contact?: string | null
          created_at?: string | null
          document_url?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string
          license_type?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["driver_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fuel_logs: {
        Row: {
          cost: number
          created_at: string | null
          current_mileage: number | null
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id: string
          mileage: number
          notes: string | null
          previous_mileage: number | null
          price_per_liter: number | null
          tank_id: string | null
          updated_at: string | null
          vehicle_id: string
          volume: number
        }
        Insert: {
          cost: number
          created_at?: string | null
          current_mileage?: number | null
          date: string
          fuel_type: Database["public"]["Enums"]["fuel_type"]
          id?: string
          mileage: number
          notes?: string | null
          previous_mileage?: number | null
          price_per_liter?: number | null
          tank_id?: string | null
          updated_at?: string | null
          vehicle_id: string
          volume: number
        }
        Update: {
          cost?: number
          created_at?: string | null
          current_mileage?: number | null
          date?: string
          fuel_type?: Database["public"]["Enums"]["fuel_type"]
          id?: string
          mileage?: number
          notes?: string | null
          previous_mileage?: number | null
          price_per_liter?: number | null
          tank_id?: string | null
          updated_at?: string | null
          vehicle_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_tanks: {
        Row: {
          capacity: number
          created_at: string | null
          fuel_type: string
          id: string
          name: string
        }
        Insert: {
          capacity: number
          created_at?: string | null
          fuel_type: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string | null
          fuel_type?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      invitation_letters: {
        Row: {
          company_address: string
          company_email: string
          company_name: string
          company_phone: string
          created_at: string
          date_of_visit: string
          duration_of_stay: string
          file_name: string
          form_data: Json
          generated_by: string | null
          id: string
          letter_date: string
          passport_expiry: string
          pdf_url: string | null
          purpose_of_visit: string
          ref_number: string
          updated_at: string
          visitor_name: string
          visitor_nationality: string
          visitor_organization: string
          visitor_passport: string
        }
        Insert: {
          company_address?: string
          company_email?: string
          company_name?: string
          company_phone?: string
          created_at?: string
          date_of_visit: string
          duration_of_stay: string
          file_name: string
          form_data: Json
          generated_by?: string | null
          id?: string
          letter_date: string
          passport_expiry: string
          pdf_url?: string | null
          purpose_of_visit: string
          ref_number: string
          updated_at?: string
          visitor_name: string
          visitor_nationality: string
          visitor_organization: string
          visitor_passport: string
        }
        Update: {
          company_address?: string
          company_email?: string
          company_name?: string
          company_phone?: string
          created_at?: string
          date_of_visit?: string
          duration_of_stay?: string
          file_name?: string
          form_data?: Json
          generated_by?: string | null
          id?: string
          letter_date?: string
          passport_expiry?: string
          pdf_url?: string | null
          purpose_of_visit?: string
          ref_number?: string
          updated_at?: string
          visitor_name?: string
          visitor_nationality?: string
          visitor_organization?: string
          visitor_passport?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string | null
          date: string
          discount_percentage: number | null
          due_date: string
          id: string
          items: Json
          notes: string | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          quotation_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          total_amount: number
          updated_at: string | null
          vat_percentage: number | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date: string
          discount_percentage?: number | null
          due_date: string
          id?: string
          items?: Json
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          quotation_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
          updated_at?: string | null
          vat_percentage?: number | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date?: string
          discount_percentage?: number | null
          due_date?: string
          id?: string
          items?: Json
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          quotation_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          total_amount?: number
          updated_at?: string | null
          vat_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          cost: number
          created_at: string | null
          date: string
          description: string
          id: string
          next_scheduled: string | null
          notes: string | null
          service_provider: string | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          date: string
          description: string
          id?: string
          next_scheduled?: string | null
          notes?: string | null
          service_provider?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          next_scheduled?: string | null
          notes?: string | null
          service_provider?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
          discount_percentage: number | null
          id: string
          items: Json
          notes: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          total_amount: number
          updated_at: string | null
          valid_until: string
          vat_percentage: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          discount_percentage?: number | null
          id?: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          total_amount?: number
          updated_at?: string | null
          valid_until: string
          vat_percentage?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          discount_percentage?: number | null
          id?: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          total_amount?: number
          updated_at?: string | null
          valid_until?: string
          vat_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          category: string
          compatibility: string[] | null
          created_at: string
          id: string
          last_ordered: string | null
          last_used_date: string | null
          location: string
          maintenance_id: string | null
          manufacturer: string
          min_stock_level: number
          name: string
          part_image: string | null
          part_number: string
          purchase_date: string | null
          quantity: number
          quantity_used: number | null
          status: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category: string
          compatibility?: string[] | null
          created_at?: string
          id?: string
          last_ordered?: string | null
          last_used_date?: string | null
          location: string
          maintenance_id?: string | null
          manufacturer: string
          min_stock_level?: number
          name: string
          part_image?: string | null
          part_number: string
          purchase_date?: string | null
          quantity?: number
          quantity_used?: number | null
          status: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          compatibility?: string[] | null
          created_at?: string
          id?: string
          last_ordered?: string | null
          last_used_date?: string | null
          location?: string
          maintenance_id?: string | null
          manufacturer?: string
          min_stock_level?: number
          name?: string
          part_image?: string | null
          part_number?: string
          purchase_date?: string | null
          quantity?: number
          quantity_used?: number | null
          status?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "maintenance"
            referencedColumns: ["id"]
          },
        ]
      }
      tank_fills: {
        Row: {
          amount: number
          cost_per_liter: number | null
          created_at: string | null
          fill_date: string
          id: string
          notes: string | null
          supplier: string | null
          tank_id: string | null
          total_cost: number | null
        }
        Insert: {
          amount: number
          cost_per_liter?: number | null
          created_at?: string | null
          fill_date: string
          id?: string
          notes?: string | null
          supplier?: string | null
          tank_id?: string | null
          total_cost?: number | null
        }
        Update: {
          amount?: number
          cost_per_liter?: number | null
          created_at?: string | null
          fill_date?: string
          id?: string
          notes?: string | null
          supplier?: string | null
          tank_id?: string | null
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tank_fills_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "fuel_tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_assignments: {
        Row: {
          assigned_at: string
          created_at: string | null
          driver_id: string
          driver_rating: number | null
          id: string
          notes: string | null
          status: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string
          created_at?: string | null
          driver_id: string
          driver_rating?: number | null
          id?: string
          notes?: string | null
          status: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string
          created_at?: string | null
          driver_id?: string
          driver_rating?: number | null
          id?: string
          notes?: string | null
          status?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_feedback: {
        Row: {
          client_user_id: string | null
          comments: string | null
          created_at: string | null
          driver_rating: number | null
          id: string
          punctuality_rating: number | null
          rating: number | null
          trip_id: string | null
          updated_at: string | null
          vehicle_rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          client_user_id?: string | null
          comments?: string | null
          created_at?: string | null
          driver_rating?: number | null
          id?: string
          punctuality_rating?: number | null
          rating?: number | null
          trip_id?: string | null
          updated_at?: string | null
          vehicle_rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          client_user_id?: string | null
          comments?: string | null
          created_at?: string | null
          driver_rating?: number | null
          id?: string
          punctuality_rating?: number | null
          rating?: number | null
          trip_id?: string | null
          updated_at?: string | null
          vehicle_rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_feedback_client_user_id_fkey"
            columns: ["client_user_id"]
            isOneToOne: false
            referencedRelation: "client_users"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_messages: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          id: string
          is_read: boolean
          message: string
          sender_name: string
          sender_type: string
          timestamp: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          sender_name: string
          sender_type: string
          timestamp?: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          sender_name?: string
          sender_type?: string
          timestamp?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_tracking: {
        Row: {
          created_at: string | null
          estimated_arrival: string | null
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          status: string
          trip_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estimated_arrival?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          status: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estimated_arrival?: string | null
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          actual_dropoff_time: string | null
          actual_pickup_time: string | null
          airline: string | null
          amount: number
          client_id: string
          created_at: string | null
          date: string
          driver_id: string | null
          dropoff_location: string | null
          escort_assigned_at: string | null
          escort_count: number | null
          escort_status: string | null
          escort_vehicle_ids: Json | null
          flight_number: string | null
          has_security_escort: boolean | null
          id: string
          invitation_documents: Json | null
          invoice_id: string | null
          is_recurring: boolean | null
          log_sheet_url: string | null
          notes: string | null
          passengers: string[] | null
          passport_documents: Json | null
          pickup_location: string | null
          return_time: string | null
          service_type: Database["public"]["Enums"]["trip_type"]
          special_instructions: string | null
          status: Database["public"]["Enums"]["trip_status"] | null
          terminal: string | null
          time: string | null
          updated_at: string | null
          vehicle_id: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Insert: {
          actual_dropoff_time?: string | null
          actual_pickup_time?: string | null
          airline?: string | null
          amount?: number
          client_id: string
          created_at?: string | null
          date: string
          driver_id?: string | null
          dropoff_location?: string | null
          escort_assigned_at?: string | null
          escort_count?: number | null
          escort_status?: string | null
          escort_vehicle_ids?: Json | null
          flight_number?: string | null
          has_security_escort?: boolean | null
          id?: string
          invitation_documents?: Json | null
          invoice_id?: string | null
          is_recurring?: boolean | null
          log_sheet_url?: string | null
          notes?: string | null
          passengers?: string[] | null
          passport_documents?: Json | null
          pickup_location?: string | null
          return_time?: string | null
          service_type: Database["public"]["Enums"]["trip_type"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          terminal?: string | null
          time?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Update: {
          actual_dropoff_time?: string | null
          actual_pickup_time?: string | null
          airline?: string | null
          amount?: number
          client_id?: string
          created_at?: string | null
          date?: string
          driver_id?: string | null
          dropoff_location?: string | null
          escort_assigned_at?: string | null
          escort_count?: number | null
          escort_status?: string | null
          escort_vehicle_ids?: Json | null
          flight_number?: string | null
          has_security_escort?: boolean | null
          id?: string
          invitation_documents?: Json | null
          invoice_id?: string | null
          is_recurring?: boolean | null
          log_sheet_url?: string | null
          notes?: string | null
          passengers?: string[] | null
          passport_documents?: Json | null
          pickup_location?: string | null
          return_time?: string | null
          service_type?: Database["public"]["Enums"]["trip_type"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["trip_status"] | null
          terminal?: string | null
          time?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_trips_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trips_driver_id"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_trips_vehicle_id"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_incident_reports: {
        Row: {
          actual_repair_cost: number | null
          created_at: string | null
          damage_details: string | null
          description: string
          driver_id: string | null
          estimated_damage_cost: number | null
          follow_up_date: string | null
          follow_up_required: boolean
          id: string
          incident_date: string
          incident_time: string | null
          incident_type: Database["public"]["Enums"]["incident_type"]
          injuries_reported: boolean
          insurance_claim_number: string | null
          location: string
          notes: string | null
          photos_attached: boolean
          police_report_number: string | null
          reported_by: string
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          third_party_details: string | null
          third_party_involved: boolean
          updated_at: string | null
          vehicle_id: string
          witness_details: string | null
        }
        Insert: {
          actual_repair_cost?: number | null
          created_at?: string | null
          damage_details?: string | null
          description: string
          driver_id?: string | null
          estimated_damage_cost?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean
          id?: string
          incident_date: string
          incident_time?: string | null
          incident_type?: Database["public"]["Enums"]["incident_type"]
          injuries_reported?: boolean
          insurance_claim_number?: string | null
          location: string
          notes?: string | null
          photos_attached?: boolean
          police_report_number?: string | null
          reported_by: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          third_party_details?: string | null
          third_party_involved?: boolean
          updated_at?: string | null
          vehicle_id: string
          witness_details?: string | null
        }
        Update: {
          actual_repair_cost?: number | null
          created_at?: string | null
          damage_details?: string | null
          description?: string
          driver_id?: string | null
          estimated_damage_cost?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean
          id?: string
          incident_date?: string
          incident_time?: string | null
          incident_type?: Database["public"]["Enums"]["incident_type"]
          injuries_reported?: boolean
          insurance_claim_number?: string | null
          location?: string
          notes?: string | null
          photos_attached?: boolean
          police_report_number?: string | null
          reported_by?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          third_party_details?: string | null
          third_party_involved?: boolean
          updated_at?: string | null
          vehicle_id?: string
          witness_details?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_incident_reports_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_incident_reports_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_inspections: {
        Row: {
          brake_fluid: Database["public"]["Enums"]["fluid_level"] | null
          brakes_working: boolean | null
          coolant: Database["public"]["Enums"]["fluid_level"] | null
          corrective_actions: string | null
          created_at: string | null
          defects_noted: string | null
          documents_present: boolean | null
          engine_oil: Database["public"]["Enums"]["fluid_level"] | null
          exterior_clean: boolean | null
          fire_extinguisher: boolean | null
          first_aid_kit: boolean | null
          fuel_level: number | null
          horn_working: boolean | null
          id: string
          inspection_date: string
          inspector_name: string
          interior_clean: boolean | null
          jack_spare_tire: boolean | null
          lights_working: boolean | null
          mileage: number | null
          mirrors_clean: boolean | null
          notes: string | null
          overall_status:
            | Database["public"]["Enums"]["inspection_status"]
            | null
          post_trip: boolean | null
          pre_trip: boolean | null
          seatbelts_working: boolean | null
          steering_working: boolean | null
          tires_condition:
            | Database["public"]["Enums"]["condition_status"]
            | null
          updated_at: string | null
          vehicle_id: string
          warning_triangle: boolean | null
          wipers_working: boolean | null
        }
        Insert: {
          brake_fluid?: Database["public"]["Enums"]["fluid_level"] | null
          brakes_working?: boolean | null
          coolant?: Database["public"]["Enums"]["fluid_level"] | null
          corrective_actions?: string | null
          created_at?: string | null
          defects_noted?: string | null
          documents_present?: boolean | null
          engine_oil?: Database["public"]["Enums"]["fluid_level"] | null
          exterior_clean?: boolean | null
          fire_extinguisher?: boolean | null
          first_aid_kit?: boolean | null
          fuel_level?: number | null
          horn_working?: boolean | null
          id?: string
          inspection_date: string
          inspector_name: string
          interior_clean?: boolean | null
          jack_spare_tire?: boolean | null
          lights_working?: boolean | null
          mileage?: number | null
          mirrors_clean?: boolean | null
          notes?: string | null
          overall_status?:
            | Database["public"]["Enums"]["inspection_status"]
            | null
          post_trip?: boolean | null
          pre_trip?: boolean | null
          seatbelts_working?: boolean | null
          steering_working?: boolean | null
          tires_condition?:
            | Database["public"]["Enums"]["condition_status"]
            | null
          updated_at?: string | null
          vehicle_id: string
          warning_triangle?: boolean | null
          wipers_working?: boolean | null
        }
        Update: {
          brake_fluid?: Database["public"]["Enums"]["fluid_level"] | null
          brakes_working?: boolean | null
          coolant?: Database["public"]["Enums"]["fluid_level"] | null
          corrective_actions?: string | null
          created_at?: string | null
          defects_noted?: string | null
          documents_present?: boolean | null
          engine_oil?: Database["public"]["Enums"]["fluid_level"] | null
          exterior_clean?: boolean | null
          fire_extinguisher?: boolean | null
          first_aid_kit?: boolean | null
          fuel_level?: number | null
          horn_working?: boolean | null
          id?: string
          inspection_date?: string
          inspector_name?: string
          interior_clean?: boolean | null
          jack_spare_tire?: boolean | null
          lights_working?: boolean | null
          mileage?: number | null
          mirrors_clean?: boolean | null
          notes?: string | null
          overall_status?:
            | Database["public"]["Enums"]["inspection_status"]
            | null
          post_trip?: boolean | null
          pre_trip?: boolean | null
          seatbelts_working?: boolean | null
          steering_working?: boolean | null
          tires_condition?:
            | Database["public"]["Enums"]["condition_status"]
            | null
          updated_at?: string | null
          vehicle_id?: string
          warning_triangle?: boolean | null
          wipers_working?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_leases: {
        Row: {
          assigned_driver_id: string | null
          contract_id: string | null
          contract_number: string
          created_at: string | null
          daily_rate: number | null
          driver_included: boolean | null
          early_termination_fee: number | null
          excess_mileage_rate: number | null
          fuel_included: boolean | null
          id: string
          insurance_required: boolean | null
          lease_end_date: string
          lease_start_date: string
          lease_status: Database["public"]["Enums"]["lease_status"] | null
          lessee_address: string
          lessee_email: string
          lessee_name: string
          lessee_phone: string
          maintenance_included: boolean | null
          mileage_limit: number
          monthly_rate: number
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          security_deposit: number | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          assigned_driver_id?: string | null
          contract_id?: string | null
          contract_number: string
          created_at?: string | null
          daily_rate?: number | null
          driver_included?: boolean | null
          early_termination_fee?: number | null
          excess_mileage_rate?: number | null
          fuel_included?: boolean | null
          id?: string
          insurance_required?: boolean | null
          lease_end_date: string
          lease_start_date: string
          lease_status?: Database["public"]["Enums"]["lease_status"] | null
          lessee_address: string
          lessee_email: string
          lessee_name: string
          lessee_phone: string
          maintenance_included?: boolean | null
          mileage_limit: number
          monthly_rate: number
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          security_deposit?: number | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          assigned_driver_id?: string | null
          contract_id?: string | null
          contract_number?: string
          created_at?: string | null
          daily_rate?: number | null
          driver_included?: boolean | null
          early_termination_fee?: number | null
          excess_mileage_rate?: number | null
          fuel_included?: boolean | null
          id?: string
          insurance_required?: boolean | null
          lease_end_date?: string
          lease_start_date?: string
          lease_status?: Database["public"]["Enums"]["lease_status"] | null
          lessee_address?: string
          lessee_email?: string
          lessee_name?: string
          lessee_phone?: string
          maintenance_included?: boolean | null
          mileage_limit?: number
          monthly_rate?: number
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          security_deposit?: number | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_vehicle_leases_contract_id"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_leases_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_leases_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          escort_assigned_at: string | null
          escort_trip_id: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          id: string
          insurance_expiry: string | null
          is_escort_assigned: boolean | null
          make: string
          model: string
          notes: string | null
          original_status: Database["public"]["Enums"]["vehicle_status"] | null
          registration: string
          status: Database["public"]["Enums"]["vehicle_status"] | null
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          escort_assigned_at?: string | null
          escort_trip_id?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_expiry?: string | null
          is_escort_assigned?: boolean | null
          make: string
          model: string
          notes?: string | null
          original_status?: Database["public"]["Enums"]["vehicle_status"] | null
          registration: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          type: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          escort_assigned_at?: string | null
          escort_trip_id?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_expiry?: string | null
          is_escort_assigned?: boolean | null
          make?: string
          model?: string
          notes?: string | null
          original_status?: Database["public"]["Enums"]["vehicle_status"] | null
          registration?: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_escort_trip_id_fkey"
            columns: ["escort_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_table_to_publication: {
        Args: { table_name: string }
        Returns: undefined
      }
      check_replica_identity: {
        Args: { table_name: string }
        Returns: boolean
      }
      create_client_members_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enable_realtime_for_table: {
        Args: { table_name: string }
        Returns: boolean
      }
      modify_invoices_client_id_nullable: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      modify_trips_client_id_nullable: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_replica_identity_full: {
        Args: { table_name: string }
        Returns: undefined
      }
      update_part_notes: {
        Args: { part_id: string; notes_value: string }
        Returns: undefined
      }
    }
    Enums: {
      client_type: "organization" | "individual"
      condition_status: "good" | "fair" | "poor"
      driver_status: "active" | "inactive" | "on_leave"
      fluid_level: "good" | "low" | "needs_change" | "needs_refill"
      fuel_type: "petrol" | "diesel" | "hybrid" | "electric"
      incident_severity: "minor" | "moderate" | "severe" | "critical"
      incident_status: "reported" | "investigating" | "resolved" | "closed"
      incident_type:
        | "accident"
        | "theft"
        | "vandalism"
        | "breakdown"
        | "traffic_violation"
        | "other"
      inspection_status: "pass" | "fail" | "conditional"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      lease_status: "active" | "pending" | "expired" | "terminated" | "upcoming"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      payment_status: "current" | "overdue" | "partial" | "paid_ahead"
      quotation_status: "draft" | "sent" | "approved" | "rejected" | "expired"
      service_type:
        | "airport_pickup"
        | "airport_dropoff"
        | "full_day"
        | "one_way_transfer"
        | "round_trip"
        | "security_escort"
        | "convoy"
      trip_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      trip_type:
        | "airport_pickup"
        | "airport_dropoff"
        | "one_way_transfer"
        | "round_trip"
        | "full_day"
        | "half_day"
      vehicle_status:
        | "active"
        | "in_service"
        | "inactive"
        | "assigned"
        | "available"
      vehicle_type: "armoured" | "soft_skin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      client_type: ["organization", "individual"],
      condition_status: ["good", "fair", "poor"],
      driver_status: ["active", "inactive", "on_leave"],
      fluid_level: ["good", "low", "needs_change", "needs_refill"],
      fuel_type: ["petrol", "diesel", "hybrid", "electric"],
      incident_severity: ["minor", "moderate", "severe", "critical"],
      incident_status: ["reported", "investigating", "resolved", "closed"],
      incident_type: [
        "accident",
        "theft",
        "vandalism",
        "breakdown",
        "traffic_violation",
        "other",
      ],
      inspection_status: ["pass", "fail", "conditional"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      lease_status: ["active", "pending", "expired", "terminated", "upcoming"],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      payment_status: ["current", "overdue", "partial", "paid_ahead"],
      quotation_status: ["draft", "sent", "approved", "rejected", "expired"],
      service_type: [
        "airport_pickup",
        "airport_dropoff",
        "full_day",
        "one_way_transfer",
        "round_trip",
        "security_escort",
        "convoy",
      ],
      trip_status: ["scheduled", "in_progress", "completed", "cancelled"],
      trip_type: [
        "airport_pickup",
        "airport_dropoff",
        "one_way_transfer",
        "round_trip",
        "full_day",
        "half_day",
      ],
      vehicle_status: [
        "active",
        "in_service",
        "inactive",
        "assigned",
        "available",
      ],
      vehicle_type: ["armoured", "soft_skin"],
    },
  },
} as const
