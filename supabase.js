// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qcqabftanasoakollreh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWFiZnRhbmFzb2Frb2xscmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzUyMDksImV4cCI6MjA3OTk1MTIwOX0.tgj8av-8s1Omo9v1WCOeLRRdzbDbOo-vjlOVbg8wadE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);