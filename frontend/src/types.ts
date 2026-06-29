export type Lang = "en" | "ta";

export type Domain = "welfare" | "agriculture";

export interface Scheme {
  id: string;
  name_en: string;
  name_ta: string;
  department: string;
  category: string;
  category_ta: string;
  summary_en: string;
  summary_ta: string;
  benefit_en: string;
  benefit_ta: string;
  benefit_amount: number;
  eligibility_en: string[];
  eligibility_ta: string[];
  documents_required_en: string[];
  how_to_apply_en: string;
  how_to_apply_ta: string;
  apply_to: string;
  disability_types: string[];
  min_disability_percent: number;
  purposes: string[];
  age_min: number;
  age_max: number;
  source_url: string;
  source_name: string;
}

export interface Category {
  en: string;
  ta: string;
}

export interface EligibilityMatch {
  scheme_id: string;
  name_en: string;
  name_ta: string;
  category: string;
  benefit_en: string;
  score: number;
  reasons: string[];
}

export interface ChatSource {
  id: string;
  name_en: string;
  name_ta: string;
  domain?: Domain;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

export interface EligibilityForm {
  disability_type: string;
  disability_percent: number;
  age: number;
  purpose: string;
}
