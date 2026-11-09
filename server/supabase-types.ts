import type { Application, Status } from "../shared/models";
import type { Json } from "./supabase-json";

type Table<Row, Insert = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

type UserRow = {
  id: string;
  corporate_id: string;
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
};

type RegistrationRow = {
  id: string;
  owner_id: string;
  reference_number: string;
  company_name: string;
  business_type: string;
  contact_email: string;
  product_type: string | null;
  status: Status;
  details: Json;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      users: Table<UserRow>;
      applications: Table<{
        id: string;
        owner_id: string;
        kind: Application["kind"];
        reference_number: string;
      }>;
      corporate_registrations: Table<RegistrationRow>;
      giro_registrations: Table<RegistrationRow>;
      tracking_events: Table<{
        id: string;
        application_id: string;
        status: Status;
        description: string;
        created_at: string;
      }>;
      news: Table<{
        id: string;
        title: string;
        slug: string;
        summary: string;
        image_url: string;
        category: string;
        content: Json;
        published_at: string;
      }>;
      recovery_requests: Table<{
        id: string;
        user_id: string | null;
        created_at: string;
        resolved_at: string | null;
      }>;
      sessions: Table<{
        sid: string;
        sess: Json;
        expire: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      create_application: {
        Args: { p_record: Json };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
