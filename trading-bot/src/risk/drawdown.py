"""APEX ORACLE — Drawdown-Monitoring.

Eskalationsstufen:
- 5%  Drawdown -> Positionsgroessen halbieren
- 10% Drawdown -> Nur A+ Setups traden
- 15% Drawdown -> Trading pausieren, System reviewen
- 20% Drawdown -> VOLLSTOPP. Komplette Neubewertung.
"""

import logging
from datetime import datetime
from typing import Optional

from config.settings import DRAWDOWN_LEVELS
from src.core.constants import DrawdownStatus

logger = logging.getLogger(__name__)


class DrawdownMonitor:
    """Ueberwacht den Drawdown und eskaliert bei Bedarf."""

    def __init__(self, initial_capital: float = 0.0):
        self.initial_capital = initial_capital
        self.peak_capital = initial_capital
        self.current_capital = initial_capital
        self.max_drawdown = 0.0
        self.drawdown_history: list[dict] = []

    def update(self, current_capital: float):
        """Aktualisiere Kapitalstand und Drawdown."""
        self.current_capital = current_capital

        if current_capital > self.peak_capital:
            self.peak_capital = current_capital

        drawdown = self._calculate_drawdown()

        if drawdown > self.max_drawdown:
            self.max_drawdown = drawdown
            self.drawdown_history.append({
                "timestamp": datetime.now().isoformat(),
                "drawdown": drawdown,
                "capital": current_capital,
                "peak": self.peak_capital,
            })

        status = self.get_status()
        if status != DrawdownStatus.NORMAL:
            logger.warning(
                f"DRAWDOWN ALERT: {drawdown:.1%} — Status: {status.value}"
            )

    def get_status(self) -> DrawdownStatus:
        """Bestimme aktuellen Drawdown-Status."""
        dd = self._calculate_drawdown()

        if dd >= 0.20:
            return DrawdownStatus.FULL_STOP
        elif dd >= 0.15:
            return DrawdownStatus.PAUSE
        elif dd >= 0.10:
            return DrawdownStatus.A_PLUS_ONLY
        elif dd >= 0.05:
            return DrawdownStatus.REDUCE
        else:
            return DrawdownStatus.NORMAL

    def get_drawdown_pct(self) -> float:
        """Aktueller Drawdown in Prozent."""
        return self._calculate_drawdown()

    def get_report(self) -> dict:
        """Erstelle Drawdown-Report."""
        dd = self._calculate_drawdown()
        return {
            "current_drawdown": dd,
            "max_drawdown": self.max_drawdown,
            "status": self.get_status().value,
            "peak_capital": self.peak_capital,
            "current_capital": self.current_capital,
            "capital_to_recover": self.peak_capital - self.current_capital,
            "pct_to_recover": (
                (self.peak_capital / self.current_capital - 1) * 100
                if self.current_capital > 0
                else float("inf")
            ),
        }

    def stress_test(self, scenario_pct: float) -> dict:
        """Stress-Test: Was passiert bei X% Overnight-Verlust?

        SCHWARZE-SCHWAEANE-VORBEREITUNG:
        'Was passiert bei -30% Overnight?'
        """
        stressed_capital = self.current_capital * (1 - scenario_pct)
        stressed_dd = (
            (self.peak_capital - stressed_capital) / self.peak_capital
            if self.peak_capital > 0
            else 0
        )

        # Status nach Stress
        if stressed_dd >= 0.20:
            status = DrawdownStatus.FULL_STOP
        elif stressed_dd >= 0.15:
            status = DrawdownStatus.PAUSE
        elif stressed_dd >= 0.10:
            status = DrawdownStatus.A_PLUS_ONLY
        elif stressed_dd >= 0.05:
            status = DrawdownStatus.REDUCE
        else:
            status = DrawdownStatus.NORMAL

        return {
            "scenario": f"-{scenario_pct:.0%} Overnight",
            "stressed_capital": stressed_capital,
            "stressed_drawdown": stressed_dd,
            "status_after": status.value,
            "recovery_needed": (
                (self.peak_capital / stressed_capital - 1) * 100
                if stressed_capital > 0
                else float("inf")
            ),
        }

    def _calculate_drawdown(self) -> float:
        """Berechne aktuellen Drawdown vom Peak."""
        if self.peak_capital <= 0:
            return 0.0
        return (self.peak_capital - self.current_capital) / self.peak_capital
