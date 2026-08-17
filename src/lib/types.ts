export interface CategoryResult {
  key: string;
  label: string;
  score: number;
  issues: string[];
}

export interface AnalysisResult {
  url: string;
  overallScore: number;
  categories: CategoryResult[];
  recommendations: string[];
}