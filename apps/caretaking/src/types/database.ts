export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          preferred_name: string | null;
          legal_name: string | null;
          relationship_label: string | null;
          avatar_url: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          preferred_name?: string | null;
          legal_name?: string | null;
          relationship_label?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      spaces: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["spaces"]["Insert"]>;
      };
      roles: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["roles"]["Insert"]>;
      };
      space_memberships: {
        Row: {
          id: string;
          space_id: string;
          user_id: string;
          role_id: string;
          status: "active" | "inactive";
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          user_id: string;
          role_id: string;
          status?: "active" | "inactive";
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["space_memberships"]["Insert"]>;
      };
      space_invites: {
        Row: {
          id: string;
          space_id: string;
          email: string;
          role_id: string;
          invited_by: string;
          token_hash: string;
          status: "pending" | "accepted" | "revoked" | "expired";
          expires_at: string;
          accepted_by: string | null;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          email: string;
          role_id: string;
          invited_by: string;
          token_hash: string;
          status?: "pending" | "accepted" | "revoked" | "expired";
          expires_at: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["space_invites"]["Insert"]>;
      };
      invite_deliveries: {
        Row: {
          id: string;
          invite_id: string;
          channel: "email";
          provider: string | null;
          provider_message_id: string | null;
          status: "queued" | "sent" | "delivered" | "failed";
          attempted_at: string;
          delivered_at: string | null;
          error_code: string | null;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          invite_id: string;
          channel: "email";
          provider?: string | null;
          provider_message_id?: string | null;
          status: "queued" | "sent" | "delivered" | "failed";
          attempted_at?: string;
          delivered_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["invite_deliveries"]["Insert"]>;
      };
      subjects: {
        Row: {
          id: string;
          space_id: string;
          name: string;
          kind: string | null;
          is_primary: boolean;
          status: "active" | "inactive";
          metadata: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          name: string;
          kind?: string | null;
          is_primary?: boolean;
          status?: "active" | "inactive";
          metadata?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subjects"]["Insert"]>;
      };
      event_types: {
        Row: {
          id: string;
          space_id: string;
          key: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          is_active: boolean;
          schema: Json;
          default_notify: boolean;
          default_reminder_template: Json | null;
          sort_order: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          key: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          is_active?: boolean;
          schema?: Json;
          default_notify?: boolean;
          default_reminder_template?: Json | null;
          sort_order?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_types"]["Insert"]>;
      };
      events: {
        Row: {
          id: string;
          space_id: string;
          subject_id: string | null;
          event_type_id: string;
          actor_user_id: string;
          occurred_at: string;
          logged_at: string;
          summary: string | null;
          details: Json;
          source: "manual" | "reminder" | "system" | "import";
          status: "active" | "deleted";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          subject_id?: string | null;
          event_type_id: string;
          actor_user_id: string;
          occurred_at: string;
          logged_at?: string;
          summary?: string | null;
          details?: Json;
          source?: "manual" | "reminder" | "system" | "import";
          status?: "active" | "deleted";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
      reminders: {
        Row: {
          id: string;
          space_id: string;
          subject_id: string | null;
          event_type_id: string | null;
          created_by: string;
          assigned_to: string | null;
          title: string;
          notes: string | null;
          due_at: string;
          status: "scheduled" | "sent" | "completed" | "canceled" | "expired";
          schedule_kind: "one_time" | "daily" | "weekly";
          payload: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          completed_event_id: string | null;
        };
        Insert: {
          id?: string;
          space_id: string;
          subject_id?: string | null;
          event_type_id?: string | null;
          created_by: string;
          assigned_to?: string | null;
          title: string;
          notes?: string | null;
          due_at: string;
          status?: "scheduled" | "sent" | "completed" | "canceled" | "expired";
          schedule_kind?: "one_time" | "daily" | "weekly";
          payload?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          completed_event_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          space_id: string;
          recipient_user_id: string;
          type: "event_created" | "reminder_due" | "reminder_completed" | "invite_received" | "system";
          event_id: string | null;
          reminder_id: string | null;
          invite_id: string | null;
          title: string;
          body: string | null;
          status: "pending" | "sent" | "failed" | "read";
          read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          space_id: string;
          recipient_user_id: string;
          type: "event_created" | "reminder_due" | "reminder_completed" | "invite_received" | "system";
          event_id?: string | null;
          reminder_id?: string | null;
          invite_id?: string | null;
          title: string;
          body?: string | null;
          status?: "pending" | "sent" | "failed" | "read";
          read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      notification_deliveries: {
        Row: {
          id: string;
          notification_id: string;
          channel: "in_app" | "push" | "email";
          provider: string | null;
          provider_message_id: string | null;
          status: "queued" | "sent" | "delivered" | "failed";
          attempted_at: string;
          delivered_at: string | null;
          error_code: string | null;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          notification_id: string;
          channel: "in_app" | "push" | "email";
          provider?: string | null;
          provider_message_id?: string | null;
          status: "queued" | "sent" | "delivered" | "failed";
          attempted_at?: string;
          delivered_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["notification_deliveries"]["Insert"]>;
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          space_id: string | null;
          channel: "in_app" | "push" | "email";
          enabled: boolean;
          event_created_enabled: boolean;
          reminder_due_enabled: boolean;
          action_log_email_level: "all" | "important_only" | "off";
          reminder_completion_email_enabled: boolean;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          space_id?: string | null;
          channel: "in_app" | "push" | "email";
          enabled?: boolean;
          event_created_enabled?: boolean;
          reminder_due_enabled?: boolean;
          action_log_email_level?: "all" | "important_only" | "off";
          reminder_completion_email_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notification_preferences"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          space_id: string | null;
          actor_user_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          changes: Json;
          context: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          space_id?: string | null;
          actor_user_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          changes?: Json;
          context?: Json;
          created_at?: string;
        };
        Update: never;
      };
    };
    Functions: {
      is_space_member: {
        Args: { target_space_id: string };
        Returns: boolean;
      };
      space_role: {
        Args: { target_space_id: string };
        Returns: string | null;
      };
      is_space_admin: {
        Args: { target_space_id: string };
        Returns: boolean;
      };
      create_space_mvp: {
        Args: { p_name: string; p_subject_name?: string | null };
        Returns: string;
      };
      create_invite_mvp: {
        Args: {
          p_space_id: string;
          p_email: string;
          p_role_key: string;
          p_token_hash: string;
          p_expires_at: string;
        };
        Returns: { invite_id: string; email: string; expires_at: string }[];
      };
      record_invite_delivery_mvp: {
        Args: {
          p_invite_id: string;
          p_provider?: string | null;
          p_provider_message_id?: string | null;
          p_status: string;
          p_error_code?: string | null;
          p_error_message?: string | null;
          p_metadata?: Json;
        };
        Returns: string;
      };
      accept_invite_mvp: {
        Args: { p_token: string };
        Returns: string;
      };
      create_event_mvp: {
        Args: {
          p_space_id: string;
          p_subject_id?: string | null;
          p_event_type_id?: string | null;
          p_occurred_at?: string;
          p_summary?: string | null;
          p_details?: Json;
        };
        Returns: string;
      };
      create_reminder_mvp: {
        Args: {
          p_space_id: string;
          p_subject_id?: string | null;
          p_event_type_id?: string | null;
          p_title?: string | null;
          p_notes?: string | null;
          p_due_at?: string | null;
          p_assigned_to?: string | null;
          p_payload?: Json;
          p_schedule_kind?: "one_time" | "daily" | "weekly";
        };
        Returns: string;
      };
      process_due_reminders_mvp: {
        Args: { p_limit?: number | null };
        Returns: number;
      };
        mark_notification_read_mvp: {
          Args: { p_notification_id: string };
          Returns: boolean;
        };
        complete_reminder_mvp: {
          Args: { p_reminder_id: string };
          Returns: boolean;
        };
      };
  };
};
