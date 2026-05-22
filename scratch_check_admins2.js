require('dotenv').config({path:'.env.local'});
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('profiles').select('*').eq('role', 'admin').then(console.log);
