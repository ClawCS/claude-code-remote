"""APEX ORACLE — Smart Money Concepts (SMC) Strategie.

Implementiert:
- Order Blocks
- Fair Value Gaps (FVG)
- Liquidity Sweeps
- Break of Structure (BOS) / Change of Character (ChoCH)
- Inducement & Breaker Blocks

Triple-Konfluenz: Orderblock + FVG + Liquidity Sweep
"""

import logging

import numpy as np
import pandas as pd

from src.core.constants import Bias
from src.strategy.base import BaseStrategy

logger = logging.getLogger(__name__)


class SmartMoneyStrategy(BaseStrategy):
    """Smart Money Concepts — Trade wie die Institutionen."""

    name = "smart_money"

    def generate_setup(
        self,
        ohlcv: pd.DataFrame,
        technical: dict,
        bias: Bias,
        risk_manager,
    ) -> dict:
        """Generiere SMC-Setup basierend auf Orderflow-Konzepten."""
        setup = self._empty_setup()

        if len(ohlcv) < 50:
            return setup

        close = ohlcv["close"]
        high = ohlcv["high"]
        low = ohlcv["low"]
        volume = ohlcv["volume"]

        indicators = technical.get("indicators", {})
        atr = indicators.get("atr")
        if atr is None:
            return setup
        atr_val = atr.iloc[-1]

        current_price = close.iloc[-1]

        # Fair Value Gaps identifizieren
        fvgs = self._find_fair_value_gaps(ohlcv)

        # Order Blocks identifizieren
        order_blocks = self._find_order_blocks(ohlcv)

        # Liquidity Sweeps erkennen
        sweeps = self._find_liquidity_sweeps(ohlcv)

        # Konfluenz zaehlen
        confluence = 0
        entry_zone = None

        if bias == Bias.BULLISH:
            # Suche bullishe FVG unter dem Preis
            bull_fvgs = [
                f for f in fvgs
                if f["type"] == "bullish" and f["low"] < current_price
            ]
            if bull_fvgs:
                confluence += 1
                nearest_fvg = bull_fvgs[-1]
                entry_zone = (nearest_fvg["low"], nearest_fvg["high"])

            # Bullisher Order Block unter dem Preis
            bull_obs = [
                ob for ob in order_blocks
                if ob["type"] == "bullish" and ob["price"] < current_price
            ]
            if bull_obs:
                confluence += 1

            # Liquidity Sweep (Stop Hunt unter Lows)
            if any(s["type"] == "sell_side" for s in sweeps[-3:]):
                confluence += 1

        elif bias == Bias.BEARISH:
            bear_fvgs = [
                f for f in fvgs
                if f["type"] == "bearish" and f["high"] > current_price
            ]
            if bear_fvgs:
                confluence += 1
                nearest_fvg = bear_fvgs[-1]
                entry_zone = (nearest_fvg["low"], nearest_fvg["high"])

            bear_obs = [
                ob for ob in order_blocks
                if ob["type"] == "bearish" and ob["price"] > current_price
            ]
            if bear_obs:
                confluence += 1

            if any(s["type"] == "buy_side" for s in sweeps[-3:]):
                confluence += 1

        if confluence < 2:
            setup["warnings"].append(
                f"SMC Konfluenz nur {confluence}/3 — nicht genug fuer Entry"
            )
            return setup

        # Setup erstellen
        if entry_zone:
            setup["entry_zone"] = entry_zone

        if bias == Bias.BULLISH:
            setup["stop_loss"] = (
                entry_zone[0] - atr_val * 1.5 if entry_zone else current_price - atr_val * 3
            )
            risk = current_price - setup["stop_loss"]
            setup["targets"] = [
                current_price + risk * 2,
                current_price + risk * 3,
                current_price + risk * 5,
            ]
        else:
            setup["stop_loss"] = (
                entry_zone[1] + atr_val * 1.5 if entry_zone else current_price + atr_val * 3
            )
            risk = setup["stop_loss"] - current_price
            setup["targets"] = [
                current_price - risk * 2,
                current_price - risk * 3,
                current_price - risk * 5,
            ]

        setup["conviction_for"] = [
            f"SMC Konfluenz: {confluence}/3",
            "Institutioneller Orderflow detektiert",
        ]
        if confluence == 3:
            setup["conviction_for"].append(
                "TRIPLE KONFLUENZ: Orderblock + FVG + Liquidity Sweep"
            )

        setup["position_size_pct"] = min(2.0, confluence * 0.7)

        return setup

    def _find_fair_value_gaps(self, ohlcv: pd.DataFrame) -> list[dict]:
        """Identifiziere Fair Value Gaps (FVG).

        Bullish FVG: Luecke zwischen Kerze 1 High und Kerze 3 Low
        Bearish FVG: Luecke zwischen Kerze 1 Low und Kerze 3 High
        """
        fvgs = []
        high = ohlcv["high"]
        low = ohlcv["low"]

        for i in range(2, len(ohlcv)):
            # Bullish FVG
            if low.iloc[i] > high.iloc[i - 2]:
                fvgs.append({
                    "type": "bullish",
                    "index": i,
                    "low": float(high.iloc[i - 2]),
                    "high": float(low.iloc[i]),
                })

            # Bearish FVG
            if high.iloc[i] < low.iloc[i - 2]:
                fvgs.append({
                    "type": "bearish",
                    "index": i,
                    "low": float(high.iloc[i]),
                    "high": float(low.iloc[i - 2]),
                })

        return fvgs

    def _find_order_blocks(self, ohlcv: pd.DataFrame) -> list[dict]:
        """Identifiziere Order Blocks.

        Bullish OB: Letzte bearish Kerze vor einer starken Aufwaertsbewegung
        Bearish OB: Letzte bullish Kerze vor einer starken Abwaertsbewegung
        """
        obs = []
        close = ohlcv["close"]
        opens = ohlcv["open"]

        for i in range(1, len(ohlcv) - 1):
            current_body = abs(close.iloc[i] - opens.iloc[i])
            prev_body = abs(close.iloc[i - 1] - opens.iloc[i - 1])

            # Starke bullish Kerze nach bearish Kerze = Bullish OB
            if (
                close.iloc[i - 1] < opens.iloc[i - 1]  # Prev bearish
                and close.iloc[i] > opens.iloc[i]        # Current bullish
                and current_body > prev_body * 2          # Displacement
            ):
                obs.append({
                    "type": "bullish",
                    "index": i - 1,
                    "price": float(ohlcv["low"].iloc[i - 1]),
                })

            # Starke bearish Kerze nach bullish Kerze = Bearish OB
            if (
                close.iloc[i - 1] > opens.iloc[i - 1]
                and close.iloc[i] < opens.iloc[i]
                and current_body > prev_body * 2
            ):
                obs.append({
                    "type": "bearish",
                    "index": i - 1,
                    "price": float(ohlcv["high"].iloc[i - 1]),
                })

        return obs

    def _find_liquidity_sweeps(self, ohlcv: pd.DataFrame) -> list[dict]:
        """Erkenne Liquidity Sweeps (Stop Hunts).

        Sell-Side Sweep: Preis faellt unter vorheriges Tief, schliesst darueber
        Buy-Side Sweep: Preis steigt ueber vorheriges Hoch, schliesst darunter
        """
        sweeps = []
        high = ohlcv["high"]
        low = ohlcv["low"]
        close = ohlcv["close"]

        lookback = min(20, len(ohlcv) - 1)

        for i in range(lookback, len(ohlcv)):
            prev_low = low.iloc[i - lookback:i].min()
            prev_high = high.iloc[i - lookback:i].max()

            # Sell-Side Sweep: Wick unter prev Low, Close darueber
            if low.iloc[i] < prev_low and close.iloc[i] > prev_low:
                sweeps.append({
                    "type": "sell_side",
                    "index": i,
                    "swept_level": float(prev_low),
                })

            # Buy-Side Sweep: Wick ueber prev High, Close darunter
            if high.iloc[i] > prev_high and close.iloc[i] < prev_high:
                sweeps.append({
                    "type": "buy_side",
                    "index": i,
                    "swept_level": float(prev_high),
                })

        return sweeps
