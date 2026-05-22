import type Database from 'better-sqlite3';
import type { UIMessage } from 'ai';
import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { loadSettings } from './provider-settings';

const SYSTEM_PROMPT =
  'You are an executive resume writer helping a professional build their CV. Guide the user section by section — start with Contact, then Executive Summary, Experience, Education, Skills, and Projects. Ask one question at a time. Be encouraging and professional. After each section, suggest when to click "Done — extract this section".';

/**
 * Handle a streaming chat request.
 * Loads the user's AI provider settings, constructs an OpenAI-compatible client,
 * and returns a streaming Response via the AI SDK's streamText.
 *
 * @param messages - The conversation messages from the client (UIMessage format).
 * @param db - Optional Database instance for testability. Falls back to default.
 * @returns A Response object (streaming on success, error JSON on failure).
 */
export async function handleChatRequest(
  messages: UIMessage[],
  db?: Database.Database,
): Promise<Response> {
  try {
    const { DatabaseManager } = await import('./db');
    const database = db ?? DatabaseManager.getInstance();

    const settings = loadSettings(database);

    if (!settings.apiKey) {
      return Response.json(
        { error: 'AI provider not configured', code: 'PROVIDER_NOT_CONFIGURED' },
        { status: 400 },
      );
    }

    const openai = createOpenAI({
      apiKey: settings.apiKey,
      baseURL: settings.baseUrl,
    });

    const modelMessages = convertToModelMessages(messages);

    const result = streamText({
      model: openai(settings.modelId),
      messages: modelMessages,
      system: SYSTEM_PROMPT,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof Error && error.message) {
      return Response.json(
        { error: 'AI provider is currently unavailable', code: 'PROVIDER_UNAVAILABLE' },
        { status: 502 },
      );
    }
    return Response.json(
      { error: 'AI provider is currently unavailable', code: 'PROVIDER_UNAVAILABLE' },
      { status: 502 },
    );
  }
}
