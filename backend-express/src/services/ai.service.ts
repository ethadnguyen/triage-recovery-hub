import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import {
  AITriageResponse,
  AITriageResponseSchema,
  TokenUsage,
} from '../models/index.js';

const SYSTEM_PROMPT = `You are a customer support expert. Analyze the complaint and respond with a JSON object.

REQUIRED JSON FORMAT:
{
  "category": "BILLING" | "TECHNICAL" | "FEATURE_REQUEST" | "GENERAL",
  "sentimentScore": <number 1-10>,
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "draftReply": "<professional response to customer>",
  "analysisSummary": "<brief internal summary>"
}

RULES:
- category: BILLING (payment/refund), TECHNICAL (bugs/errors), FEATURE_REQUEST (new features), GENERAL (other)
- sentimentScore: 1-3 (angry), 4-6 (neutral), 7-10 (satisfied)
- urgency: HIGH (outage/legal threats), MEDIUM (work affected), LOW (questions/suggestions)
- draftReply: Professional, empathetic response with solutions
- analysisSummary: Brief summary for support staff`;

// OpenAI pricing per 1K tokens
const PRICING_PER_1K_TOKENS: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};

export interface IAIService {
  triageTicket(subject: string, content: string): Promise<{ result: AITriageResponse; usage: TokenUsage }>;
}

export class AIService implements IAIService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = config.openai.apiKey;
    logger.info(`[AIService] Initializing... API key present: ${!!apiKey}, length: ${apiKey?.length || 0}`);

    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      logger.info(`[AIService] OpenAI client initialized with model: ${config.openai.model}`);
    } else {
      logger.warn('[AIService] No OpenAI API key found - AI triage will fail without it');
    }
  }

  async triageTicket(
    subject: string,
    content: string
  ): Promise<{ result: AITriageResponse; usage: TokenUsage }> {
    logger.info(`[AIService] Starting triage for: ${subject.substring(0, 50)}...`);

    if (!this.openai) {
      logger.error('[AIService] No OpenAI API key configured - cannot process ticket');
      throw new Error('AI service unavailable: No OpenAI API key configured');
    }

    const userMessage = `Subject: ${subject}\n\nComplaint Content:\n${content}`;

    const response = await this.openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const responseContent = response.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    logger.info(`[AIService] Raw response: ${responseContent.substring(0, 200)}...`);

    let parsed = JSON.parse(responseContent);

    if (Array.isArray(parsed)) {
      logger.warn('[AIService] OpenAI returned array, extracting first element');
      if (parsed.length === 0) {
        throw new Error('OpenAI returned empty array');
      }
      parsed = parsed[0];
    }

    const result = AITriageResponseSchema.parse(parsed);

    const promptTokens = response.usage?.prompt_tokens || 0;
    const completionTokens = response.usage?.completion_tokens || 0;

    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      model: config.openai.model,
      estimatedCostUsd: this.calculateCost(
        config.openai.model,
        promptTokens,
        completionTokens
      ),
    };

    logger.info(`[AIService] Triage completed. Tokens: ${usage.totalTokens}, Cost: $${usage.estimatedCostUsd?.toFixed(6)}`);

    return { result, usage };
  }

  private calculateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing = PRICING_PER_1K_TOKENS[model] || PRICING_PER_1K_TOKENS['gpt-4o-mini'];
    const inputCost = (promptTokens / 1000) * pricing.input;
    const outputCost = (completionTokens / 1000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
  }
}
