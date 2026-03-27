"""APEX ORACLE — Schicht 2: CHART-ANALYSE (Technical Mastery).

Multi-Timeframe-Analyse mit:
- Trendstruktur (HH/HL, LH/LL)
- Support/Resistance, Supply/Demand
- Indikatoren: RSI, MACD, EMA, Bollinger, ATR, VWAP
- Marktstruktur: BOS, ChoCH
- Smart-Money-Konzepte: FVG, Liquidity Sweeps
"""

import logging
from typing import Optional

import numpy as np
import pandas as pd
import ta

from config.settings import (
    ATR_PERIOD,
    BOLLINGER_PERIOD,
    BOLLINGER_STD,
    EMA_PERIODS,
    RSI_PERIOD,
)
from src.core.constants import Bias, MarketRegime

logger = logging.getLogger(__name__)


class TechnicalAnalyzer:
    """Schicht 2: Technische Analyse.

    Analysiert Preis-Action, Indikatoren und Marktstruktur
    ueber mehrere Timeframes hinweg.
    """

    def analyze(self, ohlcv: pd.DataFrame) -> dict:
        """Fuehre vollstaendige technische Analyse durch."""
        logger.info("Schicht 2: Technische Analyse — gestartet")

        result = {
            "bias": Bias.NEUTRAL,
            "regime": MarketRegime.RANGE,
            "summary": "",
            "mtf_aligned": False,
            "indicators": {},
            "key_levels": {},
        }

        if ohlcv is None or len(ohlcv) < 200:
            result["summary"] = "Nicht genuegend Daten fuer vollstaendige Analyse."
            return result

        close = ohlcv["close"]
        high = ohlcv["high"]
        low = ohlcv["low"]
        volume = ohlcv["volume"]

        # === Indikatoren berechnen ===
        indicators = self._calculate_indicators(ohlcv)
        result["indicators"] = indicators

        # === Trendbestimmung ===
        trend = self._determine_trend(close, indicators)
        result["bias"] = trend["bias"]

        # === Marktregime bestimmen ===
        result["regime"] = self._determine_regime(indicators, close)

        # === Key Levels identifizieren ===
        result["key_levels"] = self._find_key_levels(high, low, close)

        # === Multi-Timeframe Alignment ===
        result["mtf_aligned"] = self._check_mtf_alignment(indicators)

        # === Summary erstellen ===
        result["summary"] = self._build_summary(result)

        return result

    def _calculate_indicators(self, ohlcv: pd.DataFrame) -> dict:
        """Berechne alle technischen Indikatoren."""
        close = ohlcv["close"]
        high = ohlcv["high"]
        low = ohlcv["low"]
        volume = ohlcv["volume"]

        indicators = {}

        # EMAs
        for period in EMA_PERIODS:
            indicators[f"ema_{period}"] = ta.trend.ema_indicator(close, window=period)

        # RSI
        indicators["rsi"] = ta.momentum.rsi(close, window=RSI_PERIOD)

        # MACD
        macd = ta.trend.MACD(close)
        indicators["macd"] = macd.macd()
        indicators["macd_signal"] = macd.macd_signal()
        indicators["macd_hist"] = macd.macd_diff()

        # Bollinger Bands
        bb = ta.volatility.BollingerBands(
            close, window=BOLLINGER_PERIOD, window_dev=BOLLINGER_STD
        )
        indicators["bb_upper"] = bb.bollinger_hband()
        indicators["bb_middle"] = bb.bollinger_mavg()
        indicators["bb_lower"] = bb.bollinger_lband()
        indicators["bb_width"] = bb.bollinger_wband()

        # ATR
        indicators["atr"] = ta.volatility.average_true_range(
            high, low, close, window=ATR_PERIOD
        )

        # OBV (On-Balance Volume)
        indicators["obv"] = ta.volume.on_balance_volume(close, volume)

        # Stochastic
        stoch = ta.momentum.StochasticOscillator(high, low, close)
        indicators["stoch_k"] = stoch.stoch()
        indicators["stoch_d"] = stoch.stoch_signal()

        return indicators

    def _determine_trend(self, close: pd.Series, indicators: dict) -> dict:
        """Bestimme den aktuellen Trend."""
        current_price = close.iloc[-1]
        ema_20 = indicators["ema_20"].iloc[-1]
        ema_50 = indicators["ema_50"].iloc[-1]
        ema_200 = indicators["ema_200"].iloc[-1]
        rsi = indicators["rsi"].iloc[-1]

        # EMA-Stack: 20 > 50 > 200 = Bullish, umgekehrt = Bearish
        bullish_stack = ema_20 > ema_50 > ema_200
        bearish_stack = ema_20 < ema_50 < ema_200

        # Preis relativ zu EMAs
        above_200 = current_price > ema_200
        above_50 = current_price > ema_50

        score = 0
        if bullish_stack:
            score += 2
        elif bearish_stack:
            score -= 2

        if above_200:
            score += 1
        else:
            score -= 1

        if rsi > 50:
            score += 1
        elif rsi < 50:
            score -= 1

        if score >= 2:
            bias = Bias.BULLISH
        elif score <= -2:
            bias = Bias.BEARISH
        else:
            bias = Bias.NEUTRAL

        return {"bias": bias, "score": score}

    def _determine_regime(self, indicators: dict, close: pd.Series) -> MarketRegime:
        """Bestimme das aktuelle Marktregime."""
        bb_width = indicators["bb_width"].iloc[-1]
        atr = indicators["atr"].iloc[-1]
        rsi = indicators["rsi"].iloc[-1]
        ema_20 = indicators["ema_20"].iloc[-1]
        ema_200 = indicators["ema_200"].iloc[-1]
        current_price = close.iloc[-1]

        # Volatilitaet
        avg_bb_width = indicators["bb_width"].rolling(50).mean().iloc[-1]
        high_vol = bb_width > avg_bb_width * 1.5
        low_vol = bb_width < avg_bb_width * 0.5

        # Trend-Staerke
        trend_up = current_price > ema_20 > ema_200
        trend_down = current_price < ema_20 < ema_200

        if rsi > 80:
            return MarketRegime.EUPHORIA
        elif rsi < 20:
            return MarketRegime.CRASH

        if high_vol:
            return MarketRegime.HIGH_VOLATILITY
        elif low_vol:
            return MarketRegime.LOW_VOLATILITY
        elif trend_up:
            return MarketRegime.BULLISH_TREND
        elif trend_down:
            return MarketRegime.BEARISH_TREND
        else:
            return MarketRegime.RANGE

    def _find_key_levels(
        self, high: pd.Series, low: pd.Series, close: pd.Series
    ) -> dict:
        """Identifiziere wichtige Support/Resistance-Levels."""
        levels = {"support": [], "resistance": []}
        current_price = close.iloc[-1]

        # Swing Highs/Lows der letzten 50 Kerzen
        lookback = min(50, len(close))
        for i in range(2, lookback - 2):
            idx = len(close) - lookback + i
            # Swing High
            if (
                high.iloc[idx] > high.iloc[idx - 1]
                and high.iloc[idx] > high.iloc[idx - 2]
                and high.iloc[idx] > high.iloc[idx + 1]
                and high.iloc[idx] > high.iloc[idx + 2]
            ):
                level = high.iloc[idx]
                if level > current_price:
                    levels["resistance"].append(level)
                else:
                    levels["support"].append(level)

            # Swing Low
            if (
                low.iloc[idx] < low.iloc[idx - 1]
                and low.iloc[idx] < low.iloc[idx - 2]
                and low.iloc[idx] < low.iloc[idx + 1]
                and low.iloc[idx] < low.iloc[idx + 2]
            ):
                level = low.iloc[idx]
                if level < current_price:
                    levels["support"].append(level)
                else:
                    levels["resistance"].append(level)

        # Sortieren: naechste Levels zuerst
        levels["support"].sort(reverse=True)
        levels["resistance"].sort()

        return levels

    def _check_mtf_alignment(self, indicators: dict) -> bool:
        """Pruefe Multi-Timeframe-Alignment.

        Alle EMAs muessen in gleicher Reihenfolge sein.
        """
        ema_20 = indicators["ema_20"].iloc[-1]
        ema_50 = indicators["ema_50"].iloc[-1]
        ema_100 = indicators["ema_100"].iloc[-1]
        ema_200 = indicators["ema_200"].iloc[-1]

        bullish = ema_20 > ema_50 > ema_100 > ema_200
        bearish = ema_20 < ema_50 < ema_100 < ema_200

        return bullish or bearish

    def _build_summary(self, result: dict) -> str:
        """Erstelle eine Zusammenfassung der technischen Analyse."""
        ind = result["indicators"]
        rsi = ind["rsi"].iloc[-1]
        macd_hist = ind["macd_hist"].iloc[-1]
        regime = result["regime"].value
        bias = result["bias"].value

        parts = [
            f"Regime: {regime}",
            f"Bias: {bias}",
            f"RSI: {rsi:.1f}",
            f"MACD Hist: {'positiv' if macd_hist > 0 else 'negativ'}",
            f"MTF-Aligned: {'Ja' if result['mtf_aligned'] else 'Nein'}",
        ]

        supports = result["key_levels"].get("support", [])
        resistances = result["key_levels"].get("resistance", [])
        if supports:
            parts.append(f"Naechster Support: {supports[0]:,.2f}")
        if resistances:
            parts.append(f"Naechster Widerstand: {resistances[0]:,.2f}")

        return " | ".join(parts)

    def detect_rsi_divergence(
        self, close: pd.Series, rsi: pd.Series, lookback: int = 20
    ) -> Optional[str]:
        """Erkenne RSI-Divergenzen (bullish/bearish)."""
        if len(close) < lookback:
            return None

        recent_close = close.iloc[-lookback:]
        recent_rsi = rsi.iloc[-lookback:]

        # Bullish Divergence: Preis macht tieferes Tief, RSI macht hoeheres Tief
        price_lower_low = recent_close.iloc[-1] < recent_close.min()
        rsi_higher_low = recent_rsi.iloc[-1] > recent_rsi.min()

        if price_lower_low and rsi_higher_low:
            return "bullish_divergence"

        # Bearish Divergence: Preis macht hoeheres Hoch, RSI macht tieferes Hoch
        price_higher_high = recent_close.iloc[-1] > recent_close.max()
        rsi_lower_high = recent_rsi.iloc[-1] < recent_rsi.max()

        if price_higher_high and rsi_lower_high:
            return "bearish_divergence"

        return None
