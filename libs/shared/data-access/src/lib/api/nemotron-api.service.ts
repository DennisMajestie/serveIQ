import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_CONFIG } from './api.config';
import { ENVIRONMENT_CONFIG, EnvironmentConfig } from './environment.token';

// Nemotron API Types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  reasoning_budget?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable({ providedIn: 'root' })
export class NemotronApiService extends BaseApiService {
  constructor(
    http: HttpClient,
    @Inject(ENVIRONMENT_CONFIG) env: EnvironmentConfig
  ) {
    super(http, env);
  }

  // Create a completion
  createCompletion(request: CompletionRequest): Observable<CompletionResponse> {
    return this.post<CompletionResponse>(
      API_CONFIG.endpoints.nemotron.completions,
      {
        model: request.model || 'nvidia/nemotron-3-ultra-550b-a55b',
        messages: request.messages,
        temperature: request.temperature ?? 0.6,
        top_p: request.top_p ?? 0.95,
        max_tokens: request.max_tokens ?? 16384,
        reasoning_budget: request.reasoning_budget ?? 16384,
        stream: request.stream ?? false,
        chat_template_kwargs: { enable_thinking: true },
      }
    );
  }

  // Convenience method to ask a simple question
  askQuestion(prompt: string, systemPrompt?: string): Observable<CompletionResponse> {
    const messages: ChatMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    return this.createCompletion({ messages });
  }
}
