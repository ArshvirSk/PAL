// Core type definitions for P.A.L. platform

export type Phase = 'documents' | 'fees' | 'hostel' | 'academics';

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export type TrafficLightStatus = 'green' | 'yellow' | 'red';

export type DocumentType = 
  | 'marksheet_10th'
  | 'marksheet_12th'
  | 'id_proof'
  | 'photo'
  | 'fee_receipt'
  | 'medical_certificate';

export type UserRole = 'student' | 'admin' | 'mentor';

export type NotificationChannel = 'whatsapp' | 'sms' | 'email' | 'push' | 'in_app';

export type NotificationCategory = 
  | 'deadline_reminder'
  | 'phase_completion'
  | 'document_status'
  | 'social_match'
  | 'admin_announcement'
  | 'mentor_message';

export type InterestCategory = 
  | 'sports'
  | 'music'
  | 'coding'
  | 'gaming'
  | 'arts'
  | 'reading'
  | 'volunteering';

export type MatchResponse = 'accept' | 'decline' | 'maybe_later';

export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'connected';

export type AlertType = 'sentiment' | 'inactivity' | 'deadline' | 'custom';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'fear' | 'confusion' | 'frustration';

export type DistressType = 'anxiety' | 'depression' | 'overwhelm' | 'isolation' | 'academic_stress';
