// src/app/dashboard/DashboardData.tsx

export interface DashboardStudent {
  student_id: number;
  student_name: string;
  total_score: number;
  total_correct_answers: number;
  total_wrong_answers: number;
  total_time_spent: number;
  current_streak: number;
  best_streak: number;
  branch?: {
    branch_name: string;
  } | null;
  level?: {
    level_name: string;
    color?: string | null;
    icon?: string | null;
  } | null;
}

export interface PerformanceItem {
  analysis_id: number;
  rule_id: number;
  total_attempts: number | null;
  correct_attempts: number | null;
  average_time: number | null;
  weakness_score: number | null;
  improvement_rate: number | null;
  mastery_level: string | null;
  rule?: {
    rule_name: string;
    description?: string | null;
    icon?: string | null;
  } | null;
}

export interface SheetResultItem {
  result_id: number;
  created_at: string | Date;
  status: string | null;
  total_correct: number | null;
  total_wrong: number | null;
  total_time_spent: number | null;
  score: number | null;
  accuracy: number | null;
  speed_rate: number | null;
  sheet?: {
    sheet_name: string;
    time_limit: number;
    difficulty_level: number | null;
  } | null;
}

export interface ChallengeResultItem {
  challenge_result_id: number;
  created_at: string | Date;
  score: number | null;
  correct_answers: number | null;
  wrong_answers: number | null;
  total_time: number | null;
  challenge?: {
    challenge_type?: string | null;
    status?: string | null;
    created_at: string | Date;
    sheet?: {
      sheet_name: string;
    } | null;
    challenger?: {
      student_name: string;
    } | null;
    challenged?: {
      student_name: string;
    } | null;
  } | null;
}

export interface SuggestionItem {
  suggestion_id: number;
  confidence_score: number | null;
  priority: number | null;
  reason?: string | null;
  suggestedRule?: {
    rule_name: string;
  } | null;
  suggestedLevel?: {
    level_name: string;
  } | null;
}

export interface DashboardDataPayload {
  student: DashboardStudent;
  analytics: PerformanceItem[];
  recentResults: SheetResultItem[];
  challenges: ChallengeResultItem[];
  suggestions: SuggestionItem[];
  error?: string;
}
