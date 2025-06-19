export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string;
          id: string;
          related_id: string | null;
          timestamp: string;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          related_id?: string | null;
          timestamp?: string;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          related_id?: string | null;
          timestamp?: string;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          created_at: string;
          date: string;
          description: string | null;
          id: string;
          priority: string;
          related_id: string | null;
          related_type: string | null;
          resolved: boolean;
          title: string;
          type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date?: string;
          description?: string | null;
          id?: string;
          priority: string;
          related_id?: string | null;
          related_type?: string | null;
          resolved?: boolean;
          title: string;
          type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          description?: string | null;
          id?: string;
          priority?: string;
          related_id?: string | null;
          related_type?: string | null;
          resolved?: boolean;
          title?: string;
          type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      client_bookings: {
        Row: {
          client_id: string | null;
          client_user_id: string | null;
          confirmed_cost: number | null;
          created_at: string | null;
          dropoff_location: string;
          estimated_cost: number | null;
          id: string;
          passengers: number | null;
          pickup_date: string;
          pickup_location: string;
          pickup_time: string | null;
          return_date: string | null;
          return_time: string | null;
          service_type: string;
          special_requests: string | null;
          status: string | null;
          trip_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          client_user_id?: string | null;
          confirmed_cost?: number | null;
          created_at?: string | null;
          dropoff_location: string;
          estimated_cost?: number | null;
          id?: string;
          passengers?: number | null;
          pickup_date: string;
          pickup_location: string;
          pickup_time?: string | null;
          return_date?: string | null;
          return_time?: string | null;
          service_type: string;
          special_requests?: string | null;
          status?: string | null;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          client_user_id?: string | null;
          confirmed_cost?: number | null;
          created_at?: string | null;
          dropoff_location?: string;
          estimated_cost?: number | null;
          id?: string;
          passengers?: number | null;
          pickup_date?: string;
          pickup_location?: string;
          pickup_time?: string | null;
          return_date?: string | null;
          return_time?: string | null;
          service_type?: string;
          special_requests?: string | null;
          status?: string | null;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_bookings_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_bookings_client_user_id_fkey";
            columns: ["client_user_id"];
            isOneToOne: false;
            referencedRelation: "client_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_bookings_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          }
        ];
      };
      client_contacts: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          is_primary: boolean | null;
          name: string;
          phone: string | null;
          position: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean | null;
          name: string;
          phone?: string | null;
          position?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean | null;
          name?: string;
          phone?: string | null;
          position?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      client_members: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          document_name: string | null;
          document_url: string | null;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          document_name?: string | null;
          document_url?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          document_name?: string | null;
          document_url?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_members_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      client_users: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          email: string;
          id: string;
          is_active: boolean | null;
          last_login: string | null;
          name: string;
          password_hash: string;
          role: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          is_active?: boolean | null;
          last_login?: string | null;
          name: string;
          password_hash: string;
          role?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          is_active?: boolean | null;
          last_login?: string | null;
          name?: string;
          password_hash?: string;
          role?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      clients: {
        Row: {
          address: string | null;
          contact: string | null;
          created_at: string | null;
          description: string | null;
          documents: Json | null;
          email: string | null;
          id: string;
          is_archived: boolean | null;
          name: string;
          phone: string | null;
          profile_image_url: string | null;
          type: Database["public"]["Enums"]["client_type"];
          updated_at: string | null;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          contact?: string | null;
          created_at?: string | null;
          description?: string | null;
          documents?: Json | null;
          email?: string | null;
          id?: string;
          is_archived?: boolean | null;
          name: string;
          phone?: string | null;
          profile_image_url?: string | null;
          type: Database["public"]["Enums"]["client_type"];
          updated_at?: string | null;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          contact?: string | null;
          created_at?: string | null;
          description?: string | null;
          documents?: Json | null;
          email?: string | null;
          id?: string;
          is_archived?: boolean | null;
          name?: string;
          phone?: string | null;
          profile_image_url?: string | null;
          type?: Database["public"]["Enums"]["client_type"];
          updated_at?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          client_name: string;
          contract_file: string | null;
          created_at: string;
          end_date: string;
          id: string;
          name: string;
          start_date: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          client_name: string;
          contract_file?: string | null;
          created_at?: string;
          end_date: string;
          id?: string;
          name: string;
          start_date: string;
          status: string;
          updated_at?: string;
        };
        Update: {
          client_name?: string;
          contract_file?: string | null;
          created_at?: string;
          end_date?: string;
          id?: string;
          name?: string;
          start_date?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      drivers: {
        Row: {
          avatar_url: string | null;
          contact: string | null;
          created_at: string | null;
          document_url: string | null;
          id: string;
          license_expiry: string | null;
          license_number: string;
          license_type: string | null;
          name: string;
          status: Database["public"]["Enums"]["driver_status"] | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          contact?: string | null;
          created_at?: string | null;
          document_url?: string | null;
          id?: string;
          license_expiry?: string | null;
          license_number: string;
          license_type?: string | null;
          name: string;
          status?: Database["public"]["Enums"]["driver_status"] | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          contact?: string | null;
          created_at?: string | null;
          document_url?: string | null;
          id?: string;
          license_expiry?: string | null;
          license_number?: string;
          license_type?: string | null;
          name?: string;
          status?: Database["public"]["Enums"]["driver_status"] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      fuel_logs: {
        Row: {
          cost: number;
          created_at: string | null;
          current_mileage: number | null;
          date: string;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          id: string;
          mileage: number;
          notes: string | null;
          previous_mileage: number | null;
          tank_id: string | null;
          updated_at: string | null;
          vehicle_id: string;
          volume: number;
        };
        Insert: {
          cost: number;
          created_at?: string | null;
          current_mileage?: number | null;
          date: string;
          fuel_type: Database["public"]["Enums"]["fuel_type"];
          id?: string;
          mileage: number;
          notes?: string | null;
          previous_mileage?: number | null;
          tank_id?: string | null;
          updated_at?: string | null;
          vehicle_id: string;
          volume: number;
        };
        Update: {
          cost?: number;
          created_at?: string | null;
          current_mileage?: number | null;
          date?: string;
          fuel_type?: Database["public"]["Enums"]["fuel_type"];
          id?: string;
          mileage?: number;
          notes?: string | null;
          previous_mileage?: number | null;
          tank_id?: string | null;
          updated_at?: string | null;
          vehicle_id?: string;
          volume?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fuel_logs_tank_id_fkey";
            columns: ["tank_id"];
            isOneToOne: false;
            referencedRelation: "fuel_tanks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };
      fuel_tanks: {
        Row: {
          capacity: number;
          created_at: string | null;
          fuel_type: string;
          id: string;
          name: string;
        };
        Insert: {
          capacity: number;
          created_at?: string | null;
          fuel_type: string;
          id?: string;
          name: string;
        };
        Update: {
          capacity?: number;
          created_at?: string | null;
          fuel_type?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          client_id: string | null;
          created_at: string | null;
          date: string;
          discount_percentage: number | null;
          due_date: string;
          id: string;
          items: Json;
          notes: string | null;
          paid_amount: number;
          payment_date: string | null;
          payment_method: string | null;
          quotation_id: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
          total_amount: number;
          updated_at: string | null;
          vat_percentage: number | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string | null;
          date: string;
          discount_percentage?: number | null;
          due_date: string;
          id?: string;
          items?: Json;
          notes?: string | null;
          paid_amount?: number;
          payment_date?: string | null;
          payment_method?: string | null;
          quotation_id?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          total_amount?: number;
          updated_at?: string | null;
          vat_percentage?: number | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string | null;
          date?: string;
          discount_percentage?: number | null;
          due_date?: string;
          id?: string;
          items?: Json;
          notes?: string | null;
          paid_amount?: number;
          payment_date?: string | null;
          payment_method?: string | null;
          quotation_id?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
          total_amount?: number;
          updated_at?: string | null;
          vat_percentage?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_quotation_id_fkey";
            columns: ["quotation_id"];
            isOneToOne: false;
            referencedRelation: "quotations";
            referencedColumns: ["id"];
          }
        ];
      };
      invitation_letters: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          ref_number: string;
          letter_date: string;
          company_name: string;
          company_address: string;
          company_email: string;
          company_phone: string;
          visitor_name: string;
          visitor_nationality: string;
          visitor_organization: string;
          visitor_passport: string;
          passport_expiry: string;
          purpose_of_visit: string;
          duration_of_stay: string;
          date_of_visit: string;
          file_name: string;
          pdf_url: string | null;
          generated_by: string | null;
          form_data: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          ref_number: string;
          letter_date: string;
          company_name?: string;
          company_address?: string;
          company_email?: string;
          company_phone?: string;
          visitor_name: string;
          visitor_nationality: string;
          visitor_organization: string;
          visitor_passport: string;
          passport_expiry: string;
          purpose_of_visit: string;
          duration_of_stay: string;
          date_of_visit: string;
          file_name: string;
          pdf_url?: string | null;
          generated_by?: string | null;
          form_data: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          ref_number?: string;
          letter_date?: string;
          company_name?: string;
          company_address?: string;
          company_email?: string;
          company_phone?: string;
          visitor_name?: string;
          visitor_nationality?: string;
          visitor_organization?: string;
          visitor_passport?: string;
          passport_expiry?: string;
          purpose_of_visit?: string;
          duration_of_stay?: string;
          date_of_visit?: string;
          file_name?: string;
          pdf_url?: string | null;
          generated_by?: string | null;
          form_data?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "invitation_letters_generated_by_fkey";
            columns: ["generated_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      maintenance: {
        Row: {
          cost: number;
          created_at: string | null;
          date: string;
          description: string;
          id: string;
          next_scheduled: string | null;
          notes: string | null;
          service_provider: string | null;
          status: Database["public"]["Enums"]["maintenance_status"] | null;
          updated_at: string | null;
          vehicle_id: string;
        };
        Insert: {
          cost: number;
          created_at?: string | null;
          date: string;
          description: string;
          id?: string;
          next_scheduled?: string | null;
          notes?: string | null;
          service_provider?: string | null;
          status?: Database["public"]["Enums"]["maintenance_status"] | null;
          updated_at?: string | null;
          vehicle_id: string;
        };
        Update: {
          cost?: number;
          created_at?: string | null;
          date?: string;
          description?: string;
          id?: string;
          next_scheduled?: string | null;
          notes?: string | null;
          service_provider?: string | null;
          status?: Database["public"]["Enums"]["maintenance_status"] | null;
          updated_at?: string | null;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };
      quotations: {
        Row: {
          client_id: string;
          created_at: string | null;
          date: string;
          discount_percentage: number | null;
          id: string;
          items: Json;
          notes: string | null;
          status: Database["public"]["Enums"]["quotation_status"];
          total_amount: number;
          updated_at: string | null;
          valid_until: string;
          vat_percentage: number | null;
        };
        Insert: {
          client_id: string;
          created_at?: string | null;
          date: string;
          discount_percentage?: number | null;
          id?: string;
          items?: Json;
          notes?: string | null;
          status?: Database["public"]["Enums"]["quotation_status"];
          total_amount?: number;
          updated_at?: string | null;
          valid_until: string;
          vat_percentage?: number | null;
        };
        Update: {
          client_id?: string;
          created_at?: string | null;
          date?: string;
          discount_percentage?: number | null;
          id?: string;
          items?: Json;
          notes?: string | null;
          status?: Database["public"]["Enums"]["quotation_status"];
          total_amount?: number;
          updated_at?: string | null;
          valid_until?: string;
          vat_percentage?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      spare_parts: {
        Row: {
          category: string;
          compatibility: string[] | null;
          created_at: string;
          id: string;
          last_ordered: string | null;
          last_used_date: string | null;
          location: string;
          maintenance_id: string | null;
          manufacturer: string;
          min_stock_level: number;
          name: string;
          part_image: string | null;
          part_number: string;
          purchase_date: string | null;
          quantity: number;
          quantity_used: number | null;
          status: string;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          compatibility?: string[] | null;
          created_at?: string;
          id?: string;
          last_ordered?: string | null;
          last_used_date?: string | null;
          location: string;
          maintenance_id?: string | null;
          manufacturer: string;
          min_stock_level?: number;
          name: string;
          part_image?: string | null;
          part_number: string;
          purchase_date?: string | null;
          quantity?: number;
          quantity_used?: number | null;
          status: string;
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          compatibility?: string[] | null;
          created_at?: string;
          id?: string;
          last_ordered?: string | null;
          last_used_date?: string | null;
          location?: string;
          maintenance_id?: string | null;
          manufacturer?: string;
          min_stock_level?: number;
          name?: string;
          part_image?: string | null;
          part_number?: string;
          purchase_date?: string | null;
          quantity?: number;
          quantity_used?: number | null;
          status?: string;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spare_parts_maintenance_id_fkey";
            columns: ["maintenance_id"];
            isOneToOne: false;
            referencedRelation: "maintenance";
            referencedColumns: ["id"];
          }
        ];
      };
      tank_fills: {
        Row: {
          amount: number;
          cost_per_liter: number | null;
          created_at: string | null;
          fill_date: string;
          id: string;
          notes: string | null;
          supplier: string | null;
          tank_id: string | null;
          total_cost: number | null;
        };
        Insert: {
          amount: number;
          cost_per_liter?: number | null;
          created_at?: string | null;
          fill_date: string;
          id?: string;
          notes?: string | null;
          supplier?: string | null;
          tank_id?: string | null;
          total_cost?: number | null;
        };
        Update: {
          amount?: number;
          cost_per_liter?: number | null;
          created_at?: string | null;
          fill_date?: string;
          id?: string;
          notes?: string | null;
          supplier?: string | null;
          tank_id?: string | null;
          total_cost?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "tank_fills_tank_id_fkey";
            columns: ["tank_id"];
            isOneToOne: false;
            referencedRelation: "fuel_tanks";
            referencedColumns: ["id"];
          }
        ];
      };
      trip_assignments: {
        Row: {
          assigned_at: string;
          created_at: string | null;
          driver_id: string;
          driver_rating: number | null;
          id: string;
          notes: string | null;
          status: string;
          trip_id: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_at?: string;
          created_at?: string | null;
          driver_id: string;
          driver_rating?: number | null;
          id?: string;
          notes?: string | null;
          status: string;
          trip_id: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_at?: string;
          created_at?: string | null;
          driver_id?: string;
          driver_rating?: number | null;
          id?: string;
          notes?: string | null;
          status?: string;
          trip_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trip_assignments_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_assignments_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          }
        ];
      };
      trip_feedback: {
        Row: {
          client_user_id: string | null;
          comments: string | null;
          created_at: string | null;
          driver_rating: number | null;
          id: string;
          punctuality_rating: number | null;
          rating: number | null;
          trip_id: string | null;
          updated_at: string | null;
          vehicle_rating: number | null;
          would_recommend: boolean | null;
        };
        Insert: {
          client_user_id?: string | null;
          comments?: string | null;
          created_at?: string | null;
          driver_rating?: number | null;
          id?: string;
          punctuality_rating?: number | null;
          rating?: number | null;
          trip_id?: string | null;
          updated_at?: string | null;
          vehicle_rating?: number | null;
          would_recommend?: boolean | null;
        };
        Update: {
          client_user_id?: string | null;
          comments?: string | null;
          created_at?: string | null;
          driver_rating?: number | null;
          id?: string;
          punctuality_rating?: number | null;
          rating?: number | null;
          trip_id?: string | null;
          updated_at?: string | null;
          vehicle_rating?: number | null;
          would_recommend?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "trip_feedback_client_user_id_fkey";
            columns: ["client_user_id"];
            isOneToOne: false;
            referencedRelation: "client_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_feedback_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          }
        ];
      };
      trip_messages: {
        Row: {
          attachment_url: string | null;
          created_at: string | null;
          id: string;
          is_read: boolean;
          message: string;
          sender_name: string;
          sender_type: string;
          timestamp: string;
          trip_id: string;
          updated_at: string | null;
        };
        Insert: {
          attachment_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean;
          message: string;
          sender_name: string;
          sender_type: string;
          timestamp?: string;
          trip_id: string;
          updated_at?: string | null;
        };
        Update: {
          attachment_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_read?: boolean;
          message?: string;
          sender_name?: string;
          sender_type?: string;
          timestamp?: string;
          trip_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trip_messages_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          }
        ];
      };
      trip_tracking: {
        Row: {
          created_at: string | null;
          estimated_arrival: string | null;
          id: string;
          location_address: string | null;
          location_lat: number | null;
          location_lng: number | null;
          notes: string | null;
          status: string;
          trip_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          estimated_arrival?: string | null;
          id?: string;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          notes?: string | null;
          status: string;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          estimated_arrival?: string | null;
          id?: string;
          location_address?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          notes?: string | null;
          status?: string;
          trip_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trip_tracking_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          }
        ];
      };
      trips: {
        Row: {
          airline: string | null;
          amount: number;
          client_id: string | null;
          created_at: string | null;
          date: string;
          driver_id: string | null;
          dropoff_location: string | null;
          flight_number: string | null;
          id: string;
          invitation_documents: Json | null;
          invoice_id: string | null;
          is_recurring: boolean | null;
          log_sheet_url: string | null;
          notes: string | null;
          passengers: string[] | null;
          passport_documents: Json | null;
          pickup_location: string | null;
          return_time: string | null;
          service_type: Database["public"]["Enums"]["service_type"] | null;
          status: string | null;
          terminal: string | null;
          time: string | null;
          updated_at: string | null;
          vehicle_id: string | null;
          vehicle_type: string | null;
        };
        Insert: {
          airline?: string | null;
          amount?: number;
          client_id?: string | null;
          created_at?: string | null;
          date: string;
          driver_id?: string | null;
          dropoff_location?: string | null;
          flight_number?: string | null;
          id?: string;
          invitation_documents?: Json | null;
          invoice_id?: string | null;
          is_recurring?: boolean | null;
          log_sheet_url?: string | null;
          notes?: string | null;
          passengers?: string[] | null;
          passport_documents?: Json | null;
          pickup_location?: string | null;
          return_time?: string | null;
          service_type?: Database["public"]["Enums"]["service_type"] | null;
          status?: string | null;
          terminal?: string | null;
          time?: string | null;
          updated_at?: string | null;
          vehicle_id?: string | null;
          vehicle_type?: string | null;
        };
        Update: {
          airline?: string | null;
          amount?: number;
          client_id?: string | null;
          created_at?: string | null;
          date?: string;
          driver_id?: string | null;
          dropoff_location?: string | null;
          flight_number?: string | null;
          id?: string;
          invitation_documents?: Json | null;
          invoice_id?: string | null;
          is_recurring?: boolean | null;
          log_sheet_url?: string | null;
          notes?: string | null;
          passengers?: string[] | null;
          passport_documents?: Json | null;
          pickup_location?: string | null;
          return_time?: string | null;
          service_type?: Database["public"]["Enums"]["service_type"] | null;
          status?: string | null;
          terminal?: string | null;
          time?: string | null;
          updated_at?: string | null;
          vehicle_id?: string | null;
          vehicle_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trips_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trips_driver_id_fkey";
            columns: ["driver_id"];
            isOneToOne: false;
            referencedRelation: "drivers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trips_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };
      vehicle_images: {
        Row: {
          created_at: string | null;
          id: string;
          image_url: string;
          updated_at: string | null;
          vehicle_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_url: string;
          updated_at?: string | null;
          vehicle_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_url?: string;
          updated_at?: string | null;
          vehicle_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicle_images_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          }
        ];
      };
      vehicles: {
        Row: {
          color: string | null;
          created_at: string | null;
          id: string;
          insurance_expiry: string | null;
          make: string;
          model: string;
          notes: string | null;
          registration: string;
          status: Database["public"]["Enums"]["vehicle_status"] | null;
          type: Database["public"]["Enums"]["vehicle_type"];
          updated_at: string | null;
          vin: string | null;
          year: number | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          insurance_expiry?: string | null;
          make: string;
          model: string;
          notes?: string | null;
          registration: string;
          status?: Database["public"]["Enums"]["vehicle_status"] | null;
          type: Database["public"]["Enums"]["vehicle_type"];
          updated_at?: string | null;
          vin?: string | null;
          year?: number | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          id?: string;
          insurance_expiry?: string | null;
          make?: string;
          model?: string;
          notes?: string | null;
          registration?: string;
          status?: Database["public"]["Enums"]["vehicle_status"] | null;
          type?: Database["public"]["Enums"]["vehicle_type"];
          updated_at?: string | null;
          vin?: string | null;
          year?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_table_to_publication: {
        Args: { table_name: string };
        Returns: undefined;
      };
      check_replica_identity: {
        Args: { table_name: string };
        Returns: boolean;
      };
      create_client_members_table: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      enable_realtime_for_table: {
        Args: { table_name: string };
        Returns: boolean;
      };
      modify_invoices_client_id_nullable: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      modify_trips_client_id_nullable: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      set_replica_identity_full: {
        Args: { table_name: string };
        Returns: undefined;
      };
      update_part_notes: {
        Args: { part_id: string; notes_value: string };
        Returns: undefined;
      };
    };
    Enums: {
      client_type: "organization" | "individual";
      driver_status: "active" | "inactive" | "on_leave";
      fuel_type: "petrol" | "diesel";
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled";
      quotation_status: "draft" | "sent" | "approved" | "rejected" | "expired";
      service_type:
        | "airport_pickup"
        | "airport_dropoff"
        | "full_day"
        | "one_way_transfer"
        | "round_trip"
        | "security_escort";
      trip_status: "scheduled" | "in_progress" | "completed" | "cancelled";
      trip_type:
        | "airport_pickup"
        | "airport_dropoff"
        | "hourly"
        | "full_day"
        | "multi_day"
        | "other"
        | "one_way_transfer"
        | "round_trip"
        | "security_escort";
      vehicle_status: "active" | "in_service" | "inactive";
      vehicle_type: "armoured" | "soft_skin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {
      client_type: ["organization", "individual"],
      driver_status: ["active", "inactive", "on_leave"],
      fuel_type: ["petrol", "diesel"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      quotation_status: ["draft", "sent", "approved", "rejected", "expired"],
      service_type: [
        "airport_pickup",
        "airport_dropoff",
        "full_day",
        "one_way_transfer",
        "round_trip",
        "security_escort",
      ],
      trip_status: ["scheduled", "in_progress", "completed", "cancelled"],
      trip_type: [
        "airport_pickup",
        "airport_dropoff",
        "hourly",
        "full_day",
        "multi_day",
        "other",
        "one_way_transfer",
        "round_trip",
        "security_escort",
      ],
      vehicle_status: ["active", "in_service", "inactive"],
      vehicle_type: ["armoured", "soft_skin"],
    },
  },
} as const;
