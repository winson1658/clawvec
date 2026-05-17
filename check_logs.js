const { createClient } = require('@supabase/supabase-js');

// Read from env or hardcode
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ngxrzgtfzerwvcoetayi.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!key) {
  console.log('ERROR: No service role key');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase
    .from('contribution_logs')
    .select('type,score,created_at,description')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.log('ERROR:', error.message);
  } else {
    console.log('Recent contribution_logs:');
    console.log(JSON.stringify(data, null, 2));

    // Count by type
    const { data: typeCounts, error: tcError } = await supabase
      .from('contribution_logs')
      .select('type');

    if (!tcError && typeCounts) {
      const counts = {};
      typeCounts.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
      console.log('\nType counts:');
      console.log(JSON.stringify(counts, null, 2));
    }
  }
})();
