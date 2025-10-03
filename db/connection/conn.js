import { createClient } from '@supabase/supabase-js'
import "dotenv/config"
const supabaseUrl = process.env.PROJECT_URL
const supabaseKey = process.env.API_KEY_SUPABASE
export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase
