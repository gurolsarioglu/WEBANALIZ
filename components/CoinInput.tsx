'use client';

import { useState } from 'react';

interface CoinInputProps {
    onSubmit: (symbol: string) => void;
    loading?: boolean;
}

export default function CoinInput({ onSubmit, loading }: CoinInputProps) {
    const [symbol, setSymbol] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (symbol.trim()) {
            // Normalize symbol format
            const normalizedSymbol = symbol.toUpperCase().includes('USDT')
                ? symbol.toUpperCase()
                : `${symbol.toUpperCase()}/USDT`;
            onSubmit(normalizedSymbol);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex gap-4">
                <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Coin sembolü girin (örn: BTC, ETH, ETHUSDT)"
                    className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !symbol.trim()}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
                >
                    {loading ? 'Analiz Ediliyor...' : 'Analiz Et'}
                </button>
            </div>
        </form>
    );
}
