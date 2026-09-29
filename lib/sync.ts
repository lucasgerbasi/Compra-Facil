import {supabase,supabaseEnabled} from './supabase';import type {AppData} from './types';
export async function syncToSupabase(d:AppData){if(!supabaseEnabled||!supabase)return;const p=await supabase.from('products').upsert(d.products);if(p.error)throw p.error;const s=await supabase.from('shopping_items').upsert(d.shopping);if(s.error)throw s.error}
