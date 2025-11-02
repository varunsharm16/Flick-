// app/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://czlqbffgfhkdpgwburpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bHFiZmZnZmhrZHBnd2J1cnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzEwNjQsImV4cCI6MjA3NzY0NzA2NH0.b8cXC2i65NZEfEIB4lywiq7MZ4PEb99GxIJ-W1uHvzo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
