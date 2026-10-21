import {createClient} from '@supabase/supabase-js';
const url=process.env.EXPO_PUBLIC_SUPABASE_URL,key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabaseEnabled=Boolean(url&&key&&!url.includes('YOUR_PROJECT')&&!key.includes('YOUR_PUBLISHABLE'));
export const supabase=supabaseEnabled?createClient(url!,key!):null;
