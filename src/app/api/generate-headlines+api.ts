import { apiPath, defaultApiBase, headlineCounts, headlineStyles, topicLimit } from '@/features/headlines/api';

export async function POST(request: Request) {
  const data = await request.json().catch(() => null);
  const topic = typeof data?.topic === 'string' ? data.topic.trim() : '';
  if (topic.length < 2 || topic.length > topicLimit) {
    return Response.json({ error: 'Тема должна содержать от 2 до 180 символов.' }, { status: 400 });
  }
  if (!headlineCounts.includes(data.count) || !headlineStyles.includes(data.style)) {
    return Response.json({ error: 'Выберите стиль и количество вариантов из списка.' }, { status: 400 });
  }

  const apiBase = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || defaultApiBase;
  try {
    const response = await fetch(apiBase + apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, count: data.count, style: data.style }),
      signal: AbortSignal.timeout(45_000),
    });
    return Response.json(await response.json(), { status: response.status });
  } catch {
    return Response.json({ error: 'Сервер генерации недоступен. Попробуйте ещё раз.' }, { status: 502 });
  }
}
