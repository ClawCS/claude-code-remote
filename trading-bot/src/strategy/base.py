"""APEX ORACLE — Basis-Strategie-Klasse.

Alle Strategien muessen diese Klasse erweitern und
die generate_setup-Methode implementieren.
"""

from abc import ABC, abstractmethod

import pandas as pd

from src.core.constants import Bias


class BaseStrategy(ABC):
    """Abstrakte Basisklasse fuer alle Trading-Strategien."""

    name: str = "base"

    @abstractmethod
    def generate_setup(
        self,
        ohlcv: pd.DataFrame,
        technical: dict,
        bias: Bias,
        risk_manager,
    ) -> dict:
        """Generiere ein Trade-Setup.

        Returns:
            dict mit keys:
            - entry_zone: tuple[float, float]
            - stop_loss: float
            - targets: list[float]
            - position_size_pct: float
            - warnings: list[str]
            - conviction_for: list[str]
            - conviction_against: list[str]
        """

    def _empty_setup(self) -> dict:
        return {
            "entry_zone": (0.0, 0.0),
            "stop_loss": 0.0,
            "targets": [],
            "position_size_pct": 0.0,
            "warnings": [],
            "conviction_for": [],
            "conviction_against": [],
        }
