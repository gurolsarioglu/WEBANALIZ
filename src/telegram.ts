/**
 * Telegram Service — send messages with retry
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export function isConfigured(): boolean {
    return BOT_TOKEN.length > 0 && CHAT_ID.length > 0;
}

export function getChatId(): string {
    return CHAT_ID;
}

export async function sendMessage(text: string, chatId?: string): Promise<boolean> {
    const targetChat = chatId || CHAT_ID;
    if (!BOT_TOKEN || !targetChat) {
        console.log('[Telegram] Token veya ChatID eksik, mesaj gönderilmedi.');
        return false;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: targetChat,
                    text,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                }),
            });

            const data: any = await res.json();
            if (data.ok) return true;

            // Rate limited
            if (res.status === 429) {
                const wait = (data.parameters?.retry_after || 5) * 1000;
                console.log(`[Telegram] Rate limit, ${wait}ms bekleniyor...`);
                await delay(wait);
                continue;
            }

            console.error(`[Telegram] Hata: ${data.description}`);
            if (attempt < 3) await delay(2000);
        } catch (err) {
            console.error(`[Telegram] Bağlantı hatası (deneme ${attempt}):`, err);
            if (attempt < 3) await delay(2000);
        }
    }
    return false;
}

function delay(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}
