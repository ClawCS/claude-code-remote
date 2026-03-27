"""APEX ORACLE — Trend Following Strategie.

Primaerstrategie fuer bullische/baerische Trendmaerkte.
- Breakout-Pullbacks
- EMA-Stack als Trendfilter
- ATR-basierte Stops
- Teilgewinnmitnahmen bei 1R, Rest mit Trailing Stop
"""

import logging

import pandas as pd

from src.core.constants import Bias
from src.strategy.base import BaseStrategy

logger = logging.getLogger(__name__)


class TrendFollowingStrategy(BaseStrategy):
    """Trend Following — Im Trend ist dein Freund."""

    name = "trend_following"

    def generate_setup(
        self,
        ohlcv: pd.DataFrame,
        technical: dict,
        bias: Bias,
        risk_manager,
    ) -> dict:
        """Generiere Trend-Following-Setup."""
        setup = self._empty_setup()

        if bias == Bias.NEUTRAL:
            setup["warnings"].append("Kein klarer Trend — Trend Following ungeeignet")
            return setup

        indicators = technical.get("indicators", {})
        if not indicators:
            return setup

        close = ohlcv["close"].iloc[-1]
        atr = indicators.get("atr")
        ema_20 = indicators.get("ema_20")
        ema_50 = indicators.get("ema_50")

        if atr is None or ema_20 is None:
            return setup

        atr_val = atr.iloc[-1]
        ema_20_val = ema_20.iloc[-1]
        ema_50_val = ema_50.iloc[-1]

        if bias == Bias.BULLISH:
            # Entry: Pullback zur EMA 20
            entry_low = ema_20_val
            entry_high = ema_20_val + atr_val * 0.5
            setup["entry_zone"] = (entry_low, entry_high)

            # Stop: Unter EMA 50 + ATR Buffer
            stop = ema_50_val - atr_val * 1.5
            setup["stop_loss"] = stop

            # Targets: 2R, 3R, 5R
            risk = close - stop
            setup["targets"] = [
                close + risk * 2,
                close + risk * 3,
                close + risk * 5,
            ]

            setup["conviction_for"] = [
                "Trend ist bullish (EMA-Stack aufwaerts)",
                "Pullback zur EMA 20 = gutes Risiko/Chance",
                "Trend Following funktioniert am besten in Trends",
            ]

        elif bias == Bias.BEARISH:
            entry_low = ema_20_val - atr_val * 0.5
            entry_high = ema_20_val
            setup["entry_zone"] = (entry_low, entry_high)

            stop = ema_50_val + atr_val * 1.5
            setup["stop_loss"] = stop

            risk = stop - close
            setup["targets"] = [
                close - risk * 2,
                close - risk * 3,
                close - risk * 5,
            ]

            setup["conviction_for"] = [
                "Trend ist bearish (EMA-Stack abwaerts)",
                "Pullback zur EMA 20 = guter Short-Entry",
            ]

        # Position Size berechnen
        risk_per_unit = abs(close - setup["stop_loss"])
        if risk_per_unit > 0:
            setup["position_size_pct"] = min(
                2.0, (atr_val / risk_per_unit) * 100
            )

        # Warnungen
        rsi = indicators.get("rsi")
        if rsi is not None:
            rsi_val = rsi.iloc[-1]
            if rsi_val > 70 and bias == Bias.BULLISH:
                setup["conviction_against"].append(
                    "RSI ueberkauft — spaeter Einstieg"
                )
            elif rsi_val < 30 and bias == Bias.BEARISH:
                setup["conviction_against"].append(
                    "RSI ueberverkauft — Bounce moeglich"
                )

        return setup
