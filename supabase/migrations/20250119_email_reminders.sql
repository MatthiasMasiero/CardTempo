-- Migration: Email Reminder System
-- Created: 2025-01-19

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Credit Cards table (users can save their cards)
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(100) NOT NULL,
  credit_limit DECIMAL(10, 2) NOT NULL,
  current_balance DECIMAL(10, 2) NOT NULL,
  statement_date INTEGER NOT NULL CHECK (statement_date >= 1 AND statement_date <= 31),
  due_date INTEGER NOT NULL CHECK (due_date >= 1 AND due_date <= 31),
  apr DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment Reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_purpose VARCHAR(50) NOT NULL CHECK (payment_purpose IN ('optimization', 'balance')),
  reminder_date DATE NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reminder Preferences table
CREATE TABLE IF NOT EXISTS reminder_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  days_before_payment INTEGER DEFAULT 2 CHECK (days_before_payment >= 1 AND days_before_payment <= 14),
  send_tips_emails BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Calculation History (for analytics)
CREATE TABLE IF NOT EXISTS calculation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  num_cards INTEGER NOT NULL,
  total_credit_limit DECIMAL(12, 2) NOT NULL,
  total_balance DECIMAL(12, 2) NOT NULL,
  current_utilization DECIMAL(5, 2) NOT NULL,
  optimized_utilization DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_cards_user ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON payment_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON payment_reminders(email_sent, reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_card ON payment_reminders(card_id);
CREATE INDEX IF NOT EXISTS idx_calculation_history_user ON calculation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calculation_history_created ON calculation_history(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;

-- Credit Cards Policies
CREATE POLICY "Users can view their own cards"
  ON credit_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON credit_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON credit_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON credit_cards FOR DELETE
  USING (auth.uid() = user_id);

-- Payment Reminders Policies
CREATE POLICY "Users can view their own reminders"
  ON payment_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
  ON payment_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON payment_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON payment_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Reminder Preferences Policies
CREATE POLICY "Users can view their own preferences"
  ON reminder_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON reminder_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON reminder_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Calculation History Policies
CREATE POLICY "Users can view their own calculation history"
  ON calculation_history FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own calculation history"
  ON calculation_history FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reminder_preferences_updated_at
  BEFORE UPDATE ON reminder_preferences
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
