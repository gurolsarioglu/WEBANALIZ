'use client';

import { useState, FormEvent } from 'react';

interface CoinInputProps {
    onSubmit: (symbol: string) => void;
    loading?: boolean;
}

export default function CoinInput({ onSubmit, loading = false }: CoinInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        // Normalize input: if user enters just 'BTC', convert to 'BTC/USDT'
        let symbol = input.trim().toUpperCase();
        if (!symbol.includes('/')) {
            symbol = `${symbol}/USDT`;
        }

        onSubmit(symbol);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-3 max-w-md mx-auto">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Coin sembolü girin (örn: BTC, ETH, SOL)"
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    disabled={loading}
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Analiz Ediliyor...
                        </span>
                    ) : (
                        'Analiz Et'
                    )}
                </button>
            </div>
        </form>
    );
}
