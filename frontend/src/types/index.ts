export interface Maker {
  id: number;
  email: string;
  email_verified: boolean;
  date_joined: string;
}

export interface Framework {
  id: number;
  name: string;
  slug: string;
  description: string;
  normalization_min: number;
  normalization_max: number;
  traits: Trait[];
}

export interface Trait {
  id: number;
  name: string;
  code: string;
  description: string;
  order: number;
  score_bands: ScoreBand[];
}

export interface ScoreBand {
  id: number;
  name: "low" | "mid" | "high";
  min_score: number;
  max_score: number;
  label: string;
  interpretive_text: string;
}

export interface Assessment {
  id: number;
  title: string;
  description: string;
  framework: number;
  framework_name: string;
  framework_slug: string;
  status: "draft" | "published";
  result_email_enabled: boolean;
  link_expiry_days: number;
  time_limit_minutes: number | null;
  framework_locked: boolean;
  question_count: number;
  total_invited: number;
  completion_rate: number | null;
  created_at: string;
  updated_at: string;
  versions?: AssessmentVersion[];
}

export interface AssessmentVersion {
  id: number;
  version_number: number;
  created_at: string;
  question_count: number;
}

export interface Question {
  id: number;
  prompt: string;
  order: number;
  ai_generated: boolean;
  options: AnswerOption[];
}

export interface AnswerOption {
  id: number;
  text: string;
  trait: number;
  trait_code: string;
  trait_name: string;
  order: number;
}

// Write shape: the API derives trait_code/trait_name and re-derives order from position.
export interface AnswerOptionInput {
  id?: number;
  text: string;
  trait: number;
  order: number;
}

export interface QuestionInput {
  prompt: string;
  order: number;
  options: AnswerOptionInput[];
}

export interface Invitation {
  id: number;
  participant_email: string;
  status: "invited" | "in_progress" | "completed" | "expired";
  expires_at: string;
  issued_at: string;
}

export interface InvitationBatch {
  id: number;
  version_number: number;
  created_at: string;
  sent_count: number;
  invitations: Invitation[];
}

export interface TraitScoreResult {
  trait_id: number;
  trait_name: string;
  trait_code: string;
  raw_score: number;
  normalized_score: number;
  band_name: string | null;
  band_label: string | null;
  interpretive_text: string | null;
}

export interface ParticipantResult {
  participant_email: string;
  status: string;
  completed_at?: string;
  result?: {
    id: number;
    processed_at: string;
    trait_scores: TraitScoreResult[];
  };
}

export interface CohortAnalytics {
  total: number;
  completed: number;
  in_progress: number;
  invited: number;
  expired: number;
  completion_rate: number | null;
  trait_analytics: {
    trait_id: number;
    trait_name: string;
    trait_code: string;
    average_score: number | null;
    band_distribution: Record<string, number>;
    scores: number[];
  }[];
}

export interface AIGenerationJob {
  id: number;
  prompt: string;
  question_count: number;
  status: "pending" | "processing" | "done" | "failed";
  error_message: string;
  created_at: string;
  staged_questions: StagedQuestion[];
}

export interface StagedQuestion {
  id: number;
  prompt: string;
  order: number;
  options_data: { text: string; trait_code: string }[];
  accepted: boolean;
  rejected: boolean;
}
