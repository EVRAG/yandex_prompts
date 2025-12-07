import { getYandexClient, getModelId } from './yandexClient';

export async function moderateNickname(nickname: string): Promise<{ allowed: boolean; reason?: string }> {
  const client = getYandexClient();
  const model = getModelId();

  const prompt = `
Ты модератор на публичном мероприятии. Твоя задача - проверить никнейм участника.
Никнейм должен быть приличным, не содержать оскорблений, мата, или неприемлемого контента.
Если никнейм допустим, ответь одним словом: OK.
Если никнейм недопустим, ответь: REJECT <причина на русском>.

Никнейм: "${nickname}"
`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Ты строгий модератор контента.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 50,
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    
    if (content.startsWith('OK')) {
      return { allowed: true };
    } else if (content.startsWith('REJECT')) {
      return { allowed: false, reason: content.replace('REJECT', '').trim() };
    } else {
      // Fallback
      return { allowed: false, reason: 'Не удалось проверить никнейм' };
    }
  } catch (error) {
    console.error('Moderation error:', error);
    // Fail closed or open? Fail closed for safety.
    return { allowed: false, reason: 'Ошибка сервиса модерации' };
  }
}
