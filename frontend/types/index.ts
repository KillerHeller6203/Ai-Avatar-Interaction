export type SectionStatus = "good" | "needs_improvement" | "critical";

export interface ResumeSection {
  name: string;
  status: SectionStatus;
  strengths: string[];
  improvements: string[];
  rewritten_example?: string;
}

export interface AnalysisResult {
  ats_score: number;
  ats_score_explanation: string;
  overall_summary: string;
  sections: ResumeSection[];
  quick_wins: string[];
  keywords_missing: string[];
  ats_improvements: string[];
  extracted_text?: string;
}
