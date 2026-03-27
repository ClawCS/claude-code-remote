"""APEX ORACLE — Mean Reversion Strategie.

Primaerstrategie fuer Range/Seitwarts-Maerkte.
- Bollinger Band Bounces
- RSI Extremzonen
- Support/Resistance Bounces
"""

import logging

import pandas as pd

from src.core.constants import Bias
from src.strategy.base import BaseStrategy

logger = logging.getLogger(__name__)


class MeanReversionStrategy(BaseStrategy):
    """Mean Reversion — Kaufe am Support, Verkaufe am Widerstand."""

    name = "mean_reversion"

    def generate_setup(
        self,
        ohlcv: pd.DataFrame,
        technical: dict,
        bias: Bias,
        risk_manager,
    ) -> dict:
        """Generiere Mean-Reversion-Setup."""
        setup = self._empty_setup()

        indicators = technical.get("indicators", {})
        key_levels = technical.get("key_levels", {})

        if not indicators:
            return setup

        close = ohlcv["close"].iloc[-1]
        bb_upper = indicators.get("bb_upper")
        bb_lower = indicators.get("bb_lower")
        bb_middle = indicators.get("bb_middle")
        rsi = indicators.get("rsi")
        atr = indicators.get("atr")

        if any(x is None for x in [bb_upper, bb_lower, bb_middle, rsi, atr]):
            return setup

        bb_upper_val = bb_upper.iloc[-1]
        bb_lower_val = bb_lower.iloc[-1]
        bb_mid_val = bb_middle.iloc[-1]
        rsi_val = rsi.iloc[-1]
        atr_val = atr.iloc[-1]

        supports = key_levels.get("support", [])
        resistances = key_levels.get("resistance", [])

        # Long Setup: Preis am unteren Bollinger Band + RSI ueberverkauft
        if close <= bb_lower_val * 1.01 and rsi_val < 35:
            nearest_support = supports[0] if supports else bb_lower_val

            setup["entry_zone"] = (nearest_support, bb_lower_val)
            setup["stop_loss"] = nearest_support - atr_val * 1.5
            setup["targets"] = [
                bb_mid_val,         # Target 1: Mittleres BB
                bb_upper_val,       # Target 2: Oberes BB
            ]

            setup["conviction_for"] = [
                f"RSI ueberverkauft ({rsi_val:.0f})",
                "Preis am unteren Bollinger Band",
                "Mean Reversion Setup in Range-Markt",
            ]

            if rsi_val < 25:
                setup["conviction_for"].append("Extreme RSI-Zone — starkes Signal")

        # Short Setup: Preis am oberen Bollinger Band + RSI ueberkauft
        elif close >= bb_upper_val * 0.99 and rsi_val > 65:
            nearest_resistance = resistances[0] if resistances else bb_upper_val

            setup["entry_zone"] = (bb_upper_val, nearest_resistance)
            setup["stop_loss"] = nearest_resistance + atr_val * 1.5
            setup["targets"] = [
                bb_mid_val,
                bb_lower_val,
            ]

            setup["conviction_for"] = [
                f"RSI ueberkauft ({rsi_val:.0f})",
                "Preis am oberen Bollinger Band",
                "Mean Reversion Setup in Range-Markt",
            ]
        else:
            setup["warnings"].append(
                "Kein Mean-Reversion-Setup — Preis nicht an Extremen"
            )
            return setup

        # Position Size
        risk = abs(close - setup["stop_loss"])
        if risk > 0:
            setup["position_size_pct"] = min(2.0, (atr_val / risk) * 100)

        # Warnungen
        bb_width = indicators.get("bb_width")
        if bb_width is not None:
            avg_width = bb_width.rolling(50).mean().iloc[-1]
            if bb_width.iloc[-1] > avg_width * 1.5:
                setup["conviction_against"].append(
                    "Hohe Volatilitaet — Mean Reversion riskanter"
                )

        return setup
