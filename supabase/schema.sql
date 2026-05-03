-- =============================================
-- FitFlow SaaS - Supabase Database Schema
-- =============================================
-- Execute este SQL no Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'expired')),
  profile JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de treinos
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  days_of_week INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de exercícios
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  weight NUMERIC DEFAULT 0,
  reps INTEGER DEFAULT 10,
  sets INTEGER DEFAULT 3,
  rest_time INTEGER DEFAULT 60,
  video_url TEXT
);

-- 4. Tabela de execuções de treino (logs)
CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  data JSONB,
  duration INTEGER DEFAULT 0
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

-- Users: cada usuário só pode acessar seus próprios dados
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Workouts: CRUD restrito ao dono
CREATE POLICY "Users can select own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Exercises: acesso via ownership do workout pai
CREATE POLICY "Users can select own exercises" ON exercises
  FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own exercises" ON exercises
  FOR INSERT WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own exercises" ON exercises
  FOR UPDATE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own exercises" ON exercises
  FOR DELETE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

-- Executions: CRUD restrito ao dono
CREATE POLICY "Users can select own executions" ON executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own executions" ON executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Indexes para performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_executions_user_id ON executions(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_workout_id ON executions(workout_id);
CREATE INDEX IF NOT EXISTS idx_executions_date ON executions(date DESC);

-- =============================================
-- Habilitar Realtime para a tabela users
-- (para escutar mudanças no subscription_status)
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE users;
