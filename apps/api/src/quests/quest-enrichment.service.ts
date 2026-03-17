import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type QuestEnrichmentInput = {
  title: string;
  description: string;
  vibeTag: string;
  cost: string;
  costAmountCents: number;
  currency: string;
  location: {
    placeName: string;
    category?: string | null;
  };
};

type QuestEnrichmentResult = {
  category: string;
  audienceType: string;
  energyLevel: 'low' | 'medium' | 'high';
  indoorOutdoor: 'indoor' | 'outdoor' | 'both';
  tags: string[];
};

@Injectable()
export class QuestEnrichmentService {
  private readonly logger = new Logger(QuestEnrichmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async enrichQuest(templateId: string, input: QuestEnrichmentInput) {
    try {
      const enrichment = await this.generateEnrichment(input);
      if (!enrichment) return;

      await this.prisma.questTemplate.update({
        where: { id: templateId },
        data: {
          enrichedCategory: enrichment.category,
          audienceType: enrichment.audienceType,
          energyLevel: enrichment.energyLevel,
          indoorOutdoor: enrichment.indoorOutdoor,
          enrichmentTags: enrichment.tags,
        } as any,
      });
    } catch (error) {
      this.logger.warn(`Quest enrichment failed for ${templateId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async generateEnrichment(input: QuestEnrichmentInput): Promise<QuestEnrichmentResult | null> {
    const prompt = this.buildPrompt(input);

    if (process.env.ANTHROPIC_API_KEY) {
      return this.callAnthropic(prompt);
    }

    if (process.env.OPENAI_API_KEY) {
      return this.callOpenAI(prompt);
    }

    this.logger.warn('Quest enrichment skipped: no ANTHROPIC_API_KEY or OPENAI_API_KEY configured.');
    return null;
  }

  private buildPrompt(input: QuestEnrichmentInput) {
    return [
      'You are enriching a real-world social event for recommendations.',
      'Return strict JSON only with this shape:',
      '{"category":"string","audienceType":"string","energyLevel":"low|medium|high","indoorOutdoor":"indoor|outdoor|both","tags":["3-5 lowercase keywords"]}',
      'Infer practical metadata from the event details.',
      `Title: ${input.title}`,
      `Description: ${input.description}`,
      `Vibe: ${input.vibeTag}`,
      `Cost: ${input.cost} ${input.costAmountCents > 0 ? `${Math.round(input.costAmountCents / 100)} ${input.currency}` : ''}`.trim(),
      `Location: ${input.location.placeName}`,
      `Location category: ${input.location.category || 'unknown'}`,
    ].join('\n');
  }

  private async callAnthropic(prompt: string): Promise<QuestEnrichmentResult> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest',
        max_tokens: 300,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };
    const text = payload.content?.find((item) => item.type === 'text')?.text;
    return this.normalizeEnrichment(this.extractJson(text || ''));
  }

  private async callOpenAI(prompt: string): Promise<QuestEnrichmentResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = payload.choices?.[0]?.message?.content;
    return this.normalizeEnrichment(this.extractJson(text || ''));
  }

  private extractJson(text: string) {
    const trimmed = text.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('Enrichment provider returned non-JSON content.');
    }
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  }

  private normalizeEnrichment(payload: Record<string, unknown>): QuestEnrichmentResult {
    const category = typeof payload.category === 'string' ? payload.category.trim().toLowerCase() : 'social';
    const audienceType = typeof payload.audienceType === 'string' ? payload.audienceType.trim().toLowerCase() : 'groups';
    const energyLevel = payload.energyLevel === 'low' || payload.energyLevel === 'medium' || payload.energyLevel === 'high'
      ? payload.energyLevel
      : 'medium';
    const indoorOutdoor = payload.indoorOutdoor === 'indoor' || payload.indoorOutdoor === 'outdoor' || payload.indoorOutdoor === 'both'
      ? payload.indoorOutdoor
      : 'both';
    const tags = Array.isArray(payload.tags)
      ? Array.from(
          new Set(
            payload.tags
              .filter((value): value is string => typeof value === 'string')
              .map((value) => value.trim().toLowerCase())
              .filter(Boolean),
          ),
        ).slice(0, 5)
      : [];

    return {
      category,
      audienceType,
      energyLevel,
      indoorOutdoor,
      tags: tags.length ? tags : [category, audienceType, energyLevel],
    };
  }
}
