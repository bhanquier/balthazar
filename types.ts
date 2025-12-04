export interface SearchResponse {
  path: string;
  score_dist: number;
  score_cos?: number;
  score_kw?: number;
  hybrid_score?: number;
  preview: string;
}

export interface QuestionRequest {
  question: string;
  top_k: number;
  use_rerank: boolean;
}

export interface QuestionResponse {
  success: boolean;
  answer: string;
  sources: string[];
  documents_found: number;
  question: string;
}

export interface QAStatus {
  ready: boolean;
  ollama_available: boolean;
  llama3_ready: boolean;
}

export interface IndexStatus {
  embed: boolean;
  paths: boolean;
  previews: boolean;
  bm25: boolean;
  faiss: boolean;
}

export interface IndexResponse {
  indexed_files: number;
}