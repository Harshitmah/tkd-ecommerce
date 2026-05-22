const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error fetching users:", usersError.message);
  } else {
    const user = usersData.users.find(u => u.email === 'harshitmah99@gmail.com');
    if (user) {
      console.log("Found user:", user.id, user.email);
      // Upsert into profiles
      const { data, error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: 'Harshit',
        role: 'admin'
      }).select();
      if (error) {
        console.error("Error upserting profile:", error.message);
      } else {
        console.log("Upserted profile:", data);
      }
    } else {
      console.log("User harshitmah99@gmail.com not found in auth.users");
      console.log("All auth users:", usersData.users.map(u => u.email));
    }
  }
}

run();
