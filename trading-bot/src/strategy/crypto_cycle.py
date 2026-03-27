"""APEX ORACLE — Krypto-Zyklen-Strategie.

Bitcoin Halving Cycle (4-Jahres-Zyklus):
1. Akkumulationsphase: BTC -> ETH -> Large Caps -> Mid Caps -> Micro Caps
2. Exit-Strategie: Schrittweise ab Pi-Cycle-Top-Warnung
3. On-Chain-Indikatoren als Regime-Filter

Krypto-Narrative-Zyklen: DeFi, L2, RWA, AI, DePin
"""

import logging
from dataclasses import dataclass
from datetime import datetime

import pandas as pd

from src.core.constants import Bias
from src.strategy.base import BaseStrategy

logger = logging.getLogger(__name__)


# Bitcoin Halving Dates (historisch + geschaetzt)
HALVING_DATES = [
    datetime(2012, 11, 28),
    datetime(2016, 7, 9),
    datetime(2020, 5, 11),
    datetime(2024, 4, 20),  # geschaetzt
    datetime(2028, 4, 1),   # geschaetzt
]


@dataclass
class CyclePhase:
    """Phase im Krypto-Zyklus."""
    phase: str          # accumulation | early_bull | mid_bull | late_bull | distribution | bear
    days_since_halving: int
    estimated_phase_pct: float  # 0-100% durch den Zyklus
    recommended_allocation: dict  # Asset-Klassen und ihre Gewichtung


class CryptoCycleStrategy(BaseStrategy):
    """Krypto-Zyklen — Reite den 4-Jahres-Zyklus."""

    name = "crypto_cycle"

    def generate_setup(
        self,
        ohlcv: pd.DataFrame,
        technical: dict,
        bias: Bias,
        risk_manager,
    ) -> dict:
        """Generiere Setup basierend auf Zyklusposition."""
        setup = self._empty_setup()

        phase = self.get_cycle_phase()

        if phase.phase == "accumulation":
            setup["conviction_for"] = [
                f"Akkumulationsphase ({phase.days_since_halving} Tage nach Halving)",
                "Historisch beste Kaufzone",
                "DCA-Strategie empfohlen",
            ]
            setup["position_size_pct"] = 2.0

        elif phase.phase in ("early_bull", "mid_bull"):
            setup["conviction_for"] = [
                f"Bull-Phase ({phase.phase})",
                "Trend Following aktiv",
                "Rotation: BTC -> ETH -> Altcoins",
            ]
            setup["position_size_pct"] = 1.5

        elif phase.phase == "late_bull":
            setup["warnings"] = [
                "SPAETZYKLUS — Vorsicht!",
                "Schrittweise Gewinnmitnahmen empfohlen",
                "Hedging erhoehen",
            ]
            setup["conviction_against"] = [
                "Historisch nahe am Top",
                "FOMO-Phase — hoechstes Risiko",
            ]
            setup["position_size_pct"] = 0.5

        elif phase.phase in ("distribution", "bear"):
            setup["warnings"] = [
                f"Baer-/Distributionsphase — nur Absicherung!",
                "Cash-Reserve maximieren",
                "Short-Positionen erwaegen",
            ]
            setup["position_size_pct"] = 0.0

        return setup

    def get_cycle_phase(self) -> CyclePhase:
        """Bestimme aktuelle Phase im Krypto-Zyklus."""
        now = datetime.now()

        # Letztes Halving finden
        last_halving = HALVING_DATES[0]
        for h in HALVING_DATES:
            if h <= now:
                last_halving = h

        days_since = (now - last_halving).days
        cycle_length = 1460  # ~4 Jahre in Tagen
        phase_pct = (days_since / cycle_length) * 100

        # Phasen (grobe Einteilung basierend auf historischen Daten)
        if phase_pct < 20:
            phase = "accumulation"
            allocation = {"btc": 60, "eth": 25, "stables": 15}
        elif phase_pct < 40:
            phase = "early_bull"
            allocation = {"btc": 40, "eth": 30, "large_cap": 20, "stables": 10}
        elif phase_pct < 60:
            phase = "mid_bull"
            allocation = {"btc": 25, "eth": 25, "large_cap": 25, "mid_cap": 15, "stables": 10}
        elif phase_pct < 75:
            phase = "late_bull"
            allocation = {"btc": 15, "eth": 15, "stables": 40, "hedges": 30}
        elif phase_pct < 90:
            phase = "distribution"
            allocation = {"stables": 60, "btc": 10, "hedges": 30}
        else:
            phase = "bear"
            allocation = {"stables": 80, "btc_dca": 15, "hedges": 5}

        return CyclePhase(
            phase=phase,
            days_since_halving=days_since,
            estimated_phase_pct=phase_pct,
            recommended_allocation=allocation,
        )

    def get_rotation_order(self, phase: str) -> list[str]:
        """Kapitalrotation im Bull-Markt.

        Akkumulation: BTC -> ETH -> Large Caps -> Mid Caps -> Micro Caps
        Distribution: Umgekehrt!
        """
        bull_rotation = [
            "BTC",
            "ETH",
            "Large Cap Alts (SOL, AVAX, DOT, LINK)",
            "Mid Cap Alts",
            "Small/Micro Cap (hoechstes Risiko)",
        ]

        if phase in ("distribution", "bear", "late_bull"):
            return list(reversed(bull_rotation))

        return bull_rotation
