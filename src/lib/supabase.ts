import { createClient } from '@supabase/supabase-js';

// These will need to be set in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (for when Supabase is connected)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          last_login: string;
          target_utilization: number;
          reminder_days_before: number;
          email_notifications: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          last_login?: string;
          target_utilization?: number;
          reminder_days_before?: number;
          email_notifications?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          last_login?: string;
          target_utilization?: number;
          reminder_days_before?: number;
          email_notifications?: boolean;
        };
      };
      credit_cards: {
        Row: {
          id: string;
          user_id: string;
          nickname: string;
          credit_limit: number;
          current_balance: number;
          statement_date: number;
          due_date: number;
          apr: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nickname: string;
          credit_limit: number;
          current_balance: number;
          statement_date: number;
          due_date: number;
          apr?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nickname?: string;
          credit_limit?: number;
          current_balance?: number;
          statement_date?: number;
          due_date?: number;
          apr?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_reminders: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          reminder_date: string;
          amount: number;
          purpose: 'optimization' | 'balance';
          status: 'pending' | 'sent' | 'dismissed';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          reminder_date: string;
          amount: number;
          purpose: 'optimization' | 'balance';
          status?: 'pending' | 'sent' | 'dismissed';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          reminder_date?: string;
          amount?: number;
          purpose?: 'optimization' | 'balance';
          status?: 'pending' | 'sent' | 'dismissed';
          created_at?: string;
        };
      };
    };
  };
}

// SQL for creating tables in Supabase:
/*
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone default timezone('utc'::text, now()) not null,
  target_utilization decimal(5,4) default 0.05 not null,
  reminder_days_before integer default 3 not null,
  email_notifications boolean default true not null
);

-- Credit cards table
create table public.credit_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  nickname text not null,
  credit_limit decimal(12,2) not null,
  current_balance decimal(12,2) not null,
  statement_date integer not null check (statement_date >= 1 and statement_date <= 31),
  due_date integer not null check (due_date >= 1 and due_date <= 31),
  apr decimal(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Payment reminders table
create table public.payment_reminders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  card_id uuid references public.credit_cards on delete cascade not null,
  reminder_date timestamp with time zone not null,
  amount decimal(12,2) not null,
  purpose text not null check (purpose in ('optimization', 'balance')),
  status text default 'pending' not null check (status in ('pending', 'sent', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) policies
alter table public.users enable row level security;
alter table public.credit_cards enable row level security;
alter table public.payment_reminders enable row level security;

-- Users can only access their own data
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Credit cards policies
create policy "Users can view own cards" on public.credit_cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards" on public.credit_cards for insert with check (auth.uid() = user_id);
create policy "Users can update own cards" on public.credit_cards for update using (auth.uid() = user_id);
create policy "Users can delete own cards" on public.credit_cards for delete using (auth.uid() = user_id);

-- Payment reminders policies
create policy "Users can view own reminders" on public.payment_reminders for select using (auth.uid() = user_id);
create policy "Users can insert own reminders" on public.payment_reminders for insert with check (auth.uid() = user_id);
create policy "Users can update own reminders" on public.payment_reminders for update using (auth.uid() = user_id);
create policy "Users can delete own reminders" on public.payment_reminders for delete using (auth.uid() = user_id);

-- Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
*/
