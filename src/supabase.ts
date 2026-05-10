import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qedgabrekmxojcjqgweg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZGdhYnJla214b2pjanFnd2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzkzMjEsImV4cCI6MjA5MTk1NTMyMX0.seBoUbRlPrPKpg2hChd3mU8Ui36I-60RUFMfOHsW6Po";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
