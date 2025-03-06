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
          created_at: string | null
          id: string
          related_id: string | null
          timestamp: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          related_id?: string | null
          timestamp?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          related_id?: string | null
          timestamp?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          priority: string
          related_id: string | null
          related_type: string | null
          resolved: boolean | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          priority: string
          related_id?: string | null
          related_type?: string | null
          resolved?: boolean | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          priority?: string
          related_id?: string | null
          related_type?: string | null
          resolved?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
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
          updated_at?: string | null
          vehicle_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          date: string
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
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
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
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
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
          id: string
          items: Json
          notes: string | null
          status: Database["public"]["Enums"]["quotation_status"]
          total_amount: number
          updated_at: string | null
          valid_until: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date: string
          id?: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          total_amount?: number
          updated_at?: string | null
          valid_until: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date?: string
          id?: string
          items?: Json
          notes?: string | null
          status?: Database["public"]["Enums"]["quotation_status"]
          total_amount?: number
          updated_at?: string | null
          valid_until?: string
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
          location: string
          manufacturer: string
          min_stock_level: number
          name: string
          part_image: string | null
          part_number: string
          quantity: number
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
          location: string
          manufacturer: string
          min_stock_level?: number
          name: string
          part_image?: string | null
          part_number: string
          quantity?: number
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
          location?: string
          manufacturer?: string
          min_stock_level?: number
          name?: string
          part_image?: string | null
          part_number?: string
          quantity?: number
          status?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "trip_assignments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
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
        Relationships: [
          {
            foreignKeyName: "trip_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          airline: string | null
          amount: number
          client_id: string
          created_at: string | null
          date: string
          driver_id: string
          dropoff_location: string | null
          flight_number: string | null
          id: string
          invoice_id: string | null
          is_recurring: boolean | null
          notes: string | null
          passengers: string[] | null
          pickup_location: string | null
          return_time: string | null
          service_type: Database["public"]["Enums"]["service_type"] | null
          status: string | null
          terminal: string | null
          time: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          airline?: string | null
          amount?: number
          client_id: string
          created_at?: string | null
          date: string
          driver_id: string
          dropoff_location?: string | null
          flight_number?: string | null
          id?: string
          invoice_id?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          passengers?: string[] | null
          pickup_location?: string | null
          return_time?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: string | null
          terminal?: string | null
          time?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          airline?: string | null
          amount?: number
          client_id?: string
          created_at?: string | null
          date?: string
          driver_id?: string
          dropoff_location?: string | null
          flight_number?: string | null
          id?: string
          invoice_id?: string | null
          is_recurring?: boolean | null
          notes?: string | null
          passengers?: string[] | null
          pickup_location?: string | null
          return_time?: string | null
          service_type?: Database["public"]["Enums"]["service_type"] | null
          status?: string | null
          terminal?: string | null
          time?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
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
      vehicles: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          insurance_expiry: string | null
          make: string
          model: string
          notes: string | null
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
          id?: string
          insurance_expiry?: string | null
          make: string
          model: string
          notes?: string | null
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
          id?: string
          insurance_expiry?: string | null
          make?: string
          model?: string
          notes?: string | null
          registration?: string
          status?: Database["public"]["Enums"]["vehicle_status"] | null
          type?: Database["public"]["Enums"]["vehicle_type"]
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_client_members_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_part_notes: {
        Args: {
          part_id: string
          notes_value: string
        }
        Returns: undefined
      }
    }
    Enums: {
      client_type: "organization" | "individual"
      driver_status: "active" | "inactive" | "on_leave"
      fuel_type: "petrol" | "diesel"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      quotation_status: "draft" | "sent" | "approved" | "rejected" | "expired"
      service_type:
        | "airport_pickup"
        | "airport_dropoff"
        | "full_day"
        | "one_way_transfer"
        | "round_trip"
        | "security_escort"
      trip_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      trip_type:
        | "airport_pickup"
        | "airport_dropoff"
        | "hourly"
        | "full_day"
        | "multi_day"
        | "other"
        | "one_way_transfer"
        | "round_trip"
        | "security_escort"
      vehicle_status: "active" | "in_service" | "inactive"
      vehicle_type: "armoured" | "soft_skin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
