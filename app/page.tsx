'use client';

import { useState } from 'react';
import CoinInput from '@/shared/components/CoinInput';
import VolumeModule from '@/modules/volume/views/VolumeModule';
import TrendModule from '@/modules/trend/views/TrendModule';
import BTCCorrelationModule from '@/modules/btc-correlation/views/BTCCorrelationModule';
import FundingRateModule from '@/modules/funding-rate/views/FundingRateModule';
import SignalCard from '@/modules/signal-aggregator/views/SignalCard';
import ChartModule from '@/modules/chart-analysis/views/ChartModule';
// import LiquidationModule from '@/modules/liquidation/views/LiquidationModule'; // Temporarily disabled
import type {
  VolumeCheckResult,
  TrendAnalysisResult,
  BTCCorrelationResult,
  FundingRateResult
  // LiquidationResult // Temporarily disabled
} from '@/shared/types';
import type { TradingSignal } from '@/modules/signal-aggregator/models/SignalAggregatorModel';

export default function Home() {
  const [symbol, setSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [volumeData, setVolumeData] = useState<VolumeCheckResult | null>(null);
  const [trendData, setTrendData] = useState<TrendAnalysisResult | null>(null);
  const [btcData, setBtcData] = useState<BTCCorrelationResult | null>(null);
  const [fundingData, setFundingData] = useState<FundingRateResult | null>(null);
  const [signalData, setSignalData] = useState<TradingSignal | null>(null);
  // const [liquidationData, setLiquidationData] = useState<LiquidationResult | null>(null); // Temporarily disabled

  const handleAnalyze = async (coinSymbol: string) => {
    setLoading(true);
    setSymbol(coinSymbol);

    // Reset previous data
    setVolumeData(null);
    setTrendData(null);
    setBtcData(null);
    setFundingData(null);
    setSignalData(null);
    // setLiquidationData(null); // Temporarily disabled

    try {
      // Fetch all analysis data in parallel
      const [volumeRes, trendRes, btcRes, fundingRes, signalRes] = await Promise.all([
        fetch(`/api/analysis/volume-check?symbol=${encodeURIComponent(coinSymbol)}`),
        fetch(`/api/analysis/trend-analysis?symbol=${encodeURIComponent(coinSymbol)}`),
        fetch(`/api/analysis/btc-correlation?symbol=${encodeURIComponent(coinSymbol)}`),
        fetch(`/api/binance/funding-rate?symbol=${encodeURIComponent(coinSymbol)}`),
        fetch(`/api/signals/aggregate?symbol=${encodeURIComponent(coinSymbol)}`),
        // fetch(`/api/coinglass/liquidation?symbol=${encodeURIComponent(coinSymbol)}`), // Temporarily disabled
      ]);

      const [volumeResult, trendResult, btcResult, fundingResult, signalResult] = await Promise.all([
        volumeRes.json(),
        trendRes.json(),
        btcRes.json(),
        fundingRes.json(),
        signalRes.json(),
        // liquidationRes.json(), // Temporarily disabled
      ]);

      setVolumeData(volumeResult);
      setTrendData(trendResult);
      setBtcData(btcResult);
      setFundingData(fundingResult);
      setSignalData(signalResult?.data || null);
      // setLiquidationData(liquidationResult); // Temporarily disabled
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            📊 Crypto Scalp Analyzer
          </h1>
          <p className="text-gray-400">Gerçek zamanlı kripto analiz ve trading kararlarınız için profesyonel araç</p>
          <p className="text-gray-500 text-sm mt-2">✨ Modüler MVC Mimarisi ile Geliştirildi</p>
        </div>

        {/* Coin Input */}
        <CoinInput onSubmit={handleAnalyze} loading={loading} />

        {/* Analysis Grid */}
        {symbol && (
          <>
            {/* MAIN TRADING SIGNAL - Full Width at Top */}
            <SignalCard symbol={symbol} data={signalData} loading={loading} />

            {/* REAL-TIME CHART MODULE */}
            <div className="mt-6">
              <ChartModule symbol={symbol} />
            </div>

            {/* Supporting Analysis Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <VolumeModule data={volumeData} loading={loading} />
              <TrendModule data={trendData} loading={loading} />
              <BTCCorrelationModule data={btcData} loading={loading} />
              <FundingRateModule symbol={symbol} data={fundingData} loading={loading} />
              {/* Liquidation Module - Temporarily Disabled (CORS/iframe issue) */}
              {/* <div className="lg:col-span-2">
              <LiquidationModule symbol={symbol} data={liquidationData} loading={loading} />
            </div> */}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>⚠️ Bu araç yalnızca bilgilendirme amaçlıdır. Yatırım kararları kendi sorumluluğunuzdadır.</p>
        </div>
      </div>
    </main>
  );
}
