const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Checking user harshitmah99@gmail.com...");
  
  // Find the user ID from auth.users (if accessible) or just profiles
  const { data: profiles, error: err1 } = await supabase
    .from('profiles')
    .select('*');
    
  if (err1) {
    console.error("Error fetching profiles:", err1.message);
    return;
  }
  
  console.log("Profiles found:", profiles);
  
  // If the user isn't in profiles, maybe they are in auth.users?
  const { data: { users }, error: err2 } = await supabase.auth.admin.listUsers();
  
  if (err2) {
    console.error("Error listing users:", err2.message);
    return;
  }
  
  const targetUser = users.find(u => u.email === 'harshitmah99@gmail.com');
  if (!targetUser) {
    console.log("User harshitmah99@gmail.com NOT FOUND in auth.users!");
    return;
  }
  
  console.log("Found user in auth.users:", targetUser.id);
  
  // Check if profile exists
  const profile = profiles.find(p => p.id === targetUser.id);
  if (profile) {
    console.log("Profile role is currently:", profile.role);
    if (profile.role !== 'admin') {
       console.log("Updating role to admin...");
       const { error: err3 } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', targetUser.id);
       if (err3) console.error("Error updating:", err3.message);
       else console.log("SUCCESSFULLY UPDATED TO ADMIN!");
    } else {
       console.log("User is ALREADY admin!");
    }
  } else {
    console.log("Profile does not exist. Creating profile with admin role...");
    const { error: err4 } = await supabase.from('profiles').insert({
      id: targetUser.id,
      email: targetUser.email,
      full_name: 'Admin User',
      role: 'admin',
      created_at: new Date().toISOString()
    });
    if (err4) console.error("Error creating profile:", err4.message);
    else console.log("SUCCESSFULLY CREATED ADMIN PROFILE!");
  }
}

run();
