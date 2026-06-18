import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG, ChatMessage } from '@serveiq/shared/data-access';

@Injectable({
  providedIn: 'root'
})
export class NemotronService {
  constructor(private http: HttpClient) {}

  async askNemotron(
    prompt: string,
    onChunk: (text: string, reasoning?: string) => void,
    systemPrompt?: string
  ): Promise<void> {
    try {
      const messages: ChatMessage[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      // Make a streaming request
      const response = await fetch(`${API_CONFIG.nemotronBaseUrl}${API_CONFIG.endpoints.nemotron.completions}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b',
          messages,
          temperature: 0.6,
          top_p: 0.95,
          max_tokens: 16384,
          reasoning_budget: 16384,
          chat_template_kwargs: { enable_thinking: true },
          stream: true
        }),
      });

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      // Read the stream
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = value.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '[DONE]') continue;
            try {
              const chunk = JSON.parse(data);
              const reasoning = chunk.choices?.[0]?.delta?.reasoning_content;
              const content = chunk.choices?.[0]?.delta?.content || '';
              onChunk(content, reasoning);
            } catch {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in Nemotron integration:', error);
      throw error;
    }
  }
}