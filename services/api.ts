import { API_BASE_URL } from '../constants';
import { 
  QuestionRequest, 
  QuestionResponse, 
  SearchResponse, 
  QAStatus, 
  IndexStatus,
  IndexResponse 
} from '../types';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: 'Unknown Error' }));
      throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
    }

    return response.json();
  }

  // QA Endpoints
  async askQuestion(payload: QuestionRequest): Promise<QuestionResponse> {
    return this.request<QuestionResponse>('/qa', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getQAStatus(): Promise<QAStatus> {
    return this.request<QAStatus>('/qa/status');
  }

  // Search Endpoints
  async hybridSearch(query: string, topK: number = 5, rerank: boolean = false): Promise<SearchResponse[]> {
    const params = new URLSearchParams({
      query,
      top_k: topK.toString(),
      rerank: rerank.toString(),
    });
    return this.request<SearchResponse[]>(`/hybrid?${params.toString()}`);
  }

  async semanticSearch(query: string, topK: number = 5): Promise<SearchResponse[]> {
    const params = new URLSearchParams({
      query,
      top_k: topK.toString(),
    });
    return this.request<SearchResponse[]>(`/search?${params.toString()}`);
  }

  // Indexing Endpoints
  async triggerIndex(force: boolean = true): Promise<IndexResponse> {
    return this.request<IndexResponse>(`/index?force=${force}`, {
      method: 'POST',
    });
  }

  async getIndexStatus(): Promise<IndexStatus> {
    return this.request<IndexStatus>('/index_status');
  }
}

export const api = new ApiService();