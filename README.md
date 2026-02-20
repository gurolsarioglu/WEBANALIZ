# Nokta - Crypto Sinyal Botu 🎯

Binance Futures coinlerini tarayarak RSI, Stochastic RSI, WT Cross ve Funding Rate filtrelerine göre LONG/SHORT sinyalleri üreten Telegram botu.

## Kurulum

```bash
npm install
```

## Yapılandırma

`.env` dosyasını düzenle:
```
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

## Kullanım

```bash
# Botu başlat (15dk aralıklı tarama)
npm start

# Geliştirme modu (otomatik yeniden başlatma)
npm run dev

# Tek coin test
npm test
```

## Sinyal Koşulları

| Yön | RSI | SRSI K | WT Cross |
|-----|-----|--------|----------|
| LONG | ≤ 20 | ≈ 0 | 🟢 Yeşil |
| SHORT | ≥ 80 | ≈ 100 | 🔴 Kırmızı |

**FR Filtresi:** FR ≥ 1% → Long işleme girme
