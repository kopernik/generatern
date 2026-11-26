export const headlineStyles = [
  'Любой стиль',
  'Интригующий',
  'Экспертный',
  'Дружелюбный',
  'Провокационный',
] as const;
export const headlineCounts = [5, 8, 10] as const;
export const topicLimit = 180;
export const defaultApiBase = 'https://generate-theta-seven.vercel.app';
export const apiPath = '/api/generate-headlines';

export type HeadlineOptions = {
  topic: string;
  count: (typeof headlineCounts)[number];
  style: (typeof headlineStyles)[number];
};

export async function generateHeadlines(url: string, options: HeadlineOptions, signal: AbortSignal) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
    signal,
  }).catch(() => {
    throw new Error('Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.');
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string' && data.error
        ? data.error
        : 'Не удалось сгенерировать заголовки.',
    );
  }

  const headlines: unknown = data?.headlines;
  if (!Array.isArray(headlines) ||
      headlines.length !== options.count ||
      !headlines.every((headline): headline is string =>
        typeof headline === 'string' && headline.trim().length > 0)) {
    throw new Error('ИИ вернул неполный список заголовков. Попробуйте ещё раз.');
  }
  return headlines as string[];
}
