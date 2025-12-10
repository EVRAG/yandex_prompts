import { getYandexClient, getModelId } from './yandexClient';

export async function moderateNickname(nickname: string): Promise<{ allowed: boolean; reason?: string }> {
  // Проверка базовой валидности локально
  if (!nickname || nickname.trim().length < 3) {
    return { allowed: false, reason: 'Имя должно содержать минимум 3 символа' };
  }

  // Если нет API ключа или folderId, пропускаем модерацию через YandexGPT
  const apiKey = process.env.YANDEX_API_KEY?.trim();
  const folderId = process.env.YANDEX_FOLDER_ID?.trim();
  
  if (!apiKey || apiKey.length === 0 || !folderId || folderId.length === 0) {
    console.log('[moderation] YandexGPT not configured (missing API_KEY or FOLDER_ID), allowing nickname');
    console.log('[moderation] API_KEY present:', !!apiKey, 'FOLDER_ID present:', !!folderId);
    return { allowed: true };
  }

  const client = getYandexClient();
  const model = getModelId();
  
  console.log(`[moderation] Using model: ${model}`);

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
