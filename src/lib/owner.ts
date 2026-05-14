// This app is single-tenant — all data belongs to one owner, no auth layer.
// The user_id columns in Supabase are kept for schema stability but always
// hold this fixed id. See migration 20260514120000_single_tenant.sql.
export const OWNER_ID = "00000000-0000-0000-0000-000000000001";
