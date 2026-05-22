require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function makeAdmin(email) {
  if (!email) {
    console.error("Please provide an email address.")
    console.log("Usage: node make_admin.js <user_email>")
    process.exit(1)
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('email', email)
    .select()

  if (error) {
    console.error("Error updating profile:", error.message)
    return
  }

  if (data && data.length > 0) {
    console.log(`Success! '${email}' is now an Admin.`)
  } else {
    console.log(`Could not find profile for '${email}'. Have they signed up yet?`)
  }
}

makeAdmin(process.argv[2])
