// ============================================================
// CONFIG — Travel Expense Tracker
// ============================================================
// Fill in your own project's values below.
// Supabase Dashboard → Project Settings → API → Project URL / anon public key

const SUPABASE_URL = "https://qiiosykytwerfjbehuex.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpaW9zeWt5dHdlcmZqYmVodWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTUzMDYsImV4cCI6MjA5Nzc5MTMwNn0.ByGSGBhV2wLdPKA6GqReBEfcARunpIIlSOy10B7nlCk";

// Edge Function endpoint for receipt OCR.
// After running `supabase functions deploy scan-receipt`, the URL is:
//   https://YOUR-PROJECT-ID.functions.supabase.co/scan-receipt
const SCAN_RECEIPT_ENDPOINT = `${SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co")}/scan-receipt`;

// Storage bucket name for receipt photos (created via SQL or dashboard)
const RECEIPT_BUCKET = "receipts";
