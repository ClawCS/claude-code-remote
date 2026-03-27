"""APEX ORACLE — Schicht 5: RISIKOMANAGEMENT (Capital Shield Protocol).

Implementiert:
- Position Sizing (Kelly-Criterion, Half-Kelly)
- Stop-Loss-Architektur (technisch, zeitbasiert, volatilitaetsbasiert)
- Risk/Reward Minimum 1:2
- Korrelationsmanagement
- Schwarze-Schwaeane-Vorbereitung (Barreserve 20%)
"""

import logging
from typing import Optional

from config.settings import (
    CASH_RESERVE_PERCENT,
    MAX_RISK_PER_TRADE,
    MIN_RISK_REWARD,
    KELLY_FRACTION,
)

logger = logging.getLogger(__name__)


class RiskManager:
    """Schicht 5: Capital Shield Protocol.

    Schuetzt das Kapital durch striktes Risikomanagement.
    Kapitalerhalt > Kapitalwachstum. IMMER.
    """

    def __init__(self):
        self.max_risk_per_trade = MAX_RISK_PER_TRADE
        self.min_rr = MIN_RISK_REWARD
        self.kelly_fraction = KELLY_FRACTION
        self.cash_reserve = CASH_RESERVE_PERCENT
        self.open_positions: list[dict] = []

    def calculate_position_size(
        self,
        capital: float,
        entry_price: float,
        stop_loss: float,
        win_rate: Optional[float] = None,
        avg_rr: Optional[float] = None,
    ) -> dict:
        """Berechne optimale Positionsgroesse.

        Verwendet:
        1. Festes Risiko pro Trade (1-2%)
        2. Kelly-Criterion als Obergrenze
        3. Half-Kelly als Standard
        """
        # Verfuegbares Kapital (nach Barreserve)
        available = capital * (1 - self.cash_reserve)

        # Risiko pro Trade
        risk_amount = capital * self.max_risk_per_trade

        # Abstand Entry -> Stop Loss
        risk_per_unit = abs(entry_price - stop_loss)
        if risk_per_unit == 0:
            logger.error("Stop Loss = Entry Price — ungueltig!")
            return {"size": 0, "risk_amount": 0, "risk_pct": 0}

        # Standard Position Size (festes Risiko)
        size = risk_amount / risk_per_unit

        # Kelly-Criterion als Obergrenze
        if win_rate and avg_rr:
            kelly = self._kelly_criterion(win_rate, avg_rr)
            kelly_size = (available * kelly) / entry_price
            size = min(size, kelly_size)

        # Maximale Position: nicht mehr als verfuegbares Kapital
        max_size = available / entry_price
        size = min(size, max_size)

        position_value = size * entry_price
        risk_pct = (risk_amount / capital) * 100

        return {
            "size": size,
            "value": position_value,
            "risk_amount": risk_amount,
            "risk_pct": risk_pct,
            "pct_of_capital": (position_value / capital) * 100,
        }

    def validate_trade(
        self,
        entry: float,
        stop_loss: float,
        targets: list[float],
    ) -> dict:
        """Validiere einen Trade gegen die Risiko-Regeln."""
        issues = []
        valid = True

        # Stop-Loss vorhanden?
        if stop_loss == 0:
            issues.append("EHERNES GESETZ #2: Kein Stop-Loss definiert!")
            valid = False

        # Targets vorhanden?
        if not targets:
            issues.append("EHERNES GESETZ #3: Kein Exit-Plan definiert!")
            valid = False

        # Risk/Reward pruefen
        if stop_loss > 0 and targets:
            risk = abs(entry - stop_loss)
            if risk > 0:
                best_rr = max(abs(t - entry) / risk for t in targets)
                if best_rr < self.min_rr:
                    issues.append(
                        f"R:R {best_rr:.1f} < Minimum {self.min_rr:.1f}"
                    )
                    valid = False

        # Korrelation mit offenen Positionen
        correlation_warning = self._check_correlation()
        if correlation_warning:
            issues.append(correlation_warning)

        return {"valid": valid, "issues": issues}

    def calculate_stop_loss(
        self,
        entry: float,
        atr: float,
        key_level: Optional[float] = None,
        multiplier: float = 2.0,
    ) -> float:
        """Berechne Stop-Loss basierend auf ATR + Key Level."""
        # ATR-basierter Stop
        atr_stop = entry - (atr * multiplier)

        # Key-Level-basierter Stop (mit ATR-Buffer)
        if key_level and key_level < entry:
            level_stop = key_level - (atr * 0.5)  # Buffer
            # Nehme den engeren Stop, solange er unter Entry liegt
            return max(atr_stop, level_stop)

        return atr_stop

    def calculate_targets(
        self,
        entry: float,
        stop_loss: float,
        risk_multiples: Optional[list[float]] = None,
    ) -> list[float]:
        """Berechne Take-Profit-Targets als Vielfache des Risikos."""
        if risk_multiples is None:
            risk_multiples = [2.0, 3.0, 5.0]

        risk = abs(entry - stop_loss)
        is_long = entry > stop_loss

        targets = []
        for multiple in risk_multiples:
            if is_long:
                targets.append(entry + risk * multiple)
            else:
                targets.append(entry - risk * multiple)

        return targets

    def _kelly_criterion(self, win_rate: float, avg_rr: float) -> float:
        """Berechne Kelly-Criterion.

        Kelly% = W - (1-W)/R
        Verwende Half-Kelly fuer konservativere Sizing.
        """
        kelly = win_rate - ((1 - win_rate) / avg_rr)
        kelly = max(0, kelly)  # Nie negativ
        return kelly * self.kelly_fraction  # Half-Kelly

    def _check_correlation(self) -> Optional[str]:
        """Pruefe Korrelation mit bestehenden Positionen."""
        # Zaehle Positionen pro Sektor/Richtung
        sectors = {}
        for pos in self.open_positions:
            sector = pos.get("sector", "unknown")
            sectors[sector] = sectors.get(sector, 0) + 1

        for sector, count in sectors.items():
            if count >= 3:
                return (
                    f"KORRELATIONSWARNUNG: Bereits {count} Positionen "
                    f"im Sektor '{sector}'. Max. 3 erlaubt!"
                )
        return None
