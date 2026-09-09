// The anon key is meant to be shipped inside the app — it's not a secret, Row Level
// Security policies on the Supabase side are what actually gate access (see the SQL
// in the project notes: submissions are insert-only and unreadable, only the
// aggregated community_prices view is public).
module.exports = {
  SUPABASE_URL: 'https://sjjpksqqlieughjoyboq.supabase.co',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqanBrc3FxbGlldWdoam95Ym9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjQ1NjQsImV4cCI6MjEwMzkwMDU2NH0.w0zfkN58i_pl1zb_bzLyyFdd62DqSd0F0lx7G5JBDa4',
};
