/**
 * LLM Client Implementations
 * Supports OpenAI-compatible APIs and Groq
 */

import { Message, LLMClient } from './chat';

export class OpenAIClient implements LLMClient {
  constructor(
    private apiUrl: string,
    private apiKey: string,
    private model: string = 'gpt-4'
  ) {}

  async chat(messages: Message[], tools: any[]): Promise<Message> {
    const formattedTools = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          name: m.name,
          tool_calls: m.tool_calls,
          tool_call_id: m.tool_call_id,
        })),
        tools: formattedTools.length > 0 ? formattedTools : undefined,
        tool_choice: formattedTools.length > 0 ? 'auto' : undefined,
      }),
    });

    if (!response.ok) {
      let errorMessage = '';
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || JSON.stringify(errorData);
        } catch {
          errorMessage = await response.text();
        }
      } else {
        errorMessage = await response.text();
      }
      
      // Extract plain text from HTML if present
      if (errorMessage.includes('<')) {
        errorMessage = errorMessage.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
      
      throw new Error(`LLM API error: ${response.status} - ${errorMessage}`);
    }

    const data: any = await response.json();
    const choice = data.choices[0];
    const message = choice.message;

    return {
      role: 'assistant',
      content: message.content || '',
      tool_calls: message.tool_calls,
    };
  }
}

/**
 * Groq API Client
 * Uses Groq's fast inference API compatible with OpenAI format
 */
export class GroqClient implements LLMClient {
  private readonly apiUrl = 'https://api.groq.com/openai/v1';

  constructor(
    private apiKey: string,
    private model: string = 'mixtral-8x7b-32768'
  ) {}

  async chat(messages: Message[], tools: any[]): Promise<Message> {
    const formattedTools = tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));

    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          name: m.name,
          tool_calls: m.tool_calls,
          tool_call_id: m.tool_call_id,
        })),
        tools: formattedTools.length > 0 ? formattedTools : undefined,
        tool_choice: formattedTools.length > 0 ? 'auto' : undefined,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      let errorMessage = '';
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || JSON.stringify(errorData);
        } catch {
          errorMessage = await response.text();
        }
      } else {
        errorMessage = await response.text();
      }
      
      // Extract plain text from HTML if present
      if (errorMessage.includes('<')) {
        errorMessage = errorMessage.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
      
      throw new Error(`Groq API error: ${response.status} - ${errorMessage}`);
    }

    const data: any = await response.json();
    const choice = data.choices[0];
    const message = choice.message;

    return {
      role: 'assistant',
      content: message.content || '',
      tool_calls: message.tool_calls,
    };
  }
}
