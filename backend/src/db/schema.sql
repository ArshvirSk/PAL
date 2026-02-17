-- P.A.L. Database Schema
-- PostgreSQL Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  batch INTEGER NOT NULL,
  hostel_block VARCHAR(50),
  room_number VARCHAR(20),
  current_phase VARCHAR(50) NOT NULL DEFAULT 'documents',
  overall_progress DECIMAL(5,2) DEFAULT 0,
  enrollment_date DATE NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_admission ON users(admission_number);
CREATE INDEX idx_users_phase ON users(current_phase);
CREATE INDEX idx_users_branch ON users(branch);
CREATE INDEX idx_users_role ON users(role);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'processing',
  original_file_url TEXT NOT NULL,
  processed_file_url TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by UUID,
  extracted_data JSONB,
  validation_results JSONB,
  confidence DECIMAL(5,4),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);

-- Task definitions table
CREATE TABLE IF NOT EXISTS task_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  is_critical BOOLEAN DEFAULT false,
  weight DECIMAL(3,2) DEFAULT 1.0,
  dependencies JSONB DEFAULT '[]',
  required_documents JSONB DEFAULT '[]',
  estimated_duration INTEGER,
  instructions TEXT,
  help_resources JSONB,
  applicable_for JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_definitions_phase ON task_definitions(phase);

-- User tasks table
CREATE TABLE IF NOT EXISTS user_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_definition_id UUID REFERENCES task_definitions(id),
  status VARCHAR(50) NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  deadline TIMESTAMP,
  attempts INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_tasks_user ON user_tasks(user_id);
CREATE INDEX idx_user_tasks_status ON user_tasks(status);
CREATE INDEX idx_user_tasks_deadline ON user_tasks(deadline);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW(),
  context JSONB
);

CREATE INDEX idx_conversations_user ON conversations(user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  channel VARCHAR(50),
  language VARCHAR(10),
  sentiment_score DECIMAL(3,2),
  confidence DECIMAL(5,4),
  sources JSONB
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Interests table
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  tags JSONB NOT NULL,
  proficiency_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interests_user ON interests(user_id);
CREATE INDEX idx_interests_category ON interests(category);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_score DECIMAL(5,4) NOT NULL,
  common_interests JSONB,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  user1_response VARCHAR(20),
  user2_response VARCHAR(20),
  user1_responded_at TIMESTAMP,
  user2_responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  severity_level VARCHAR(20) NOT NULL,
  triggered_at TIMESTAMP DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID,
  context JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolution TEXT
);

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_mentor ON alerts(mentor_id);
CREATE INDEX idx_alerts_severity ON alerts(severity_level);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  template VARCHAR(100) NOT NULL,
  variables JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- Knowledge base documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  branch VARCHAR(100),
  phase VARCHAR(50),
  file_url TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_knowledge_docs_type ON knowledge_documents(document_type);
CREATE INDEX idx_knowledge_docs_branch ON knowledge_documents(branch);
CREATE INDEX idx_knowledge_docs_active ON knowledge_documents(is_active);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_definitions_updated_at BEFORE UPDATE ON task_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tasks_updated_at BEFORE UPDATE ON user_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
