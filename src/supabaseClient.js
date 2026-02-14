import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bvzgzijdhyrrqhppjbln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emd6aWpkaHlycnFocHBqYmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgxMTQsImV4cCI6MjA4NjQwNDExNH0.xAZFkTnoGmaFJ-KFuBben8Wm8SDJjpasQfoW3jLG72c'

export const supabase = createClient(supabaseUrl, supabaseKey)