"""APEX ORACLE — Position Sizing Utilities.

Erweiterte Position-Sizing-Methoden:
- Fixed Fractional
- Kelly Criterion / Half-Kelly
- Volatilitaets-adjustiert (ATR-basiert)
- Korrelationsbereinigt
"""

import logging
import math

logger = logging.getLogger(__name__)


def fixed_fractional(
    capital: float,
    risk_pct: float,
    entry: float,
    stop_loss: float,
) -> float:
    """Fixed Fractional Position Sizing.

    Riskiere einen festen Prozentsatz des Kapitals pro Trade.
    Standard: 1-2% (NIEMALS mehr).
    """
    risk_amount = capital * risk_pct
    risk_per_unit = abs(entry - stop_loss)

    if risk_per_unit == 0:
        return 0.0

    return risk_amount / risk_per_unit


def kelly_criterion(
    win_rate: float,
    avg_win: float,
    avg_loss: float,
    fraction: float = 0.5,
) -> float:
    """Kelly Criterion — Optimale Positionsgroesse.

    Kelly% = W - (1-W)/R
    wobei W = Win Rate, R = Avg Win / Avg Loss

    fraction: Half-Kelly (0.5) als Standard fuer konservatives Sizing.
    """
    if avg_loss == 0:
        return 0.0

    r = avg_win / avg_loss
    kelly = win_rate - ((1 - win_rate) / r)
    kelly = max(0.0, kelly)

    return kelly * fraction


def volatility_adjusted(
    capital: float,
    risk_pct: float,
    entry: float,
    atr: float,
    atr_multiplier: float = 2.0,
) -> float:
    """Volatilitaets-adjustiertes Position Sizing.

    Verwendet ATR statt festem Stop-Loss-Abstand.
    Engerer Stop bei niedriger Volatilitaet = groessere Position.
    """
    risk_amount = capital * risk_pct
    risk_per_unit = atr * atr_multiplier

    if risk_per_unit == 0:
        return 0.0

    return risk_amount / risk_per_unit


def calculate_expected_value(
    win_rate: float,
    avg_win: float,
    avg_loss: float,
) -> float:
    """Berechne den Erwartungswert einer Strategie.

    EV = (Win% * Avg Win) - (Loss% * Avg Loss)
    Muss > 0 sein, sonst hat die Strategie keinen Edge!
    """
    return (win_rate * avg_win) - ((1 - win_rate) * avg_loss)


def monte_carlo_risk(
    win_rate: float,
    avg_win: float,
    avg_loss: float,
    num_trades: int = 1000,
    num_simulations: int = 10000,
    risk_pct: float = 0.02,
) -> dict:
    """Monte-Carlo-Simulation fuer Risikobewertung.

    Simuliert tausende moegliche Trade-Serien,
    um Drawdown-Wahrscheinlichkeiten zu schaetzen.
    """
    import random

    max_drawdowns = []
    final_capitals = []

    for _ in range(num_simulations):
        capital = 100000  # Startkapital
        peak = capital
        max_dd = 0

        for _ in range(num_trades):
            risk_amount = capital * risk_pct

            if random.random() < win_rate:
                capital += risk_amount * (avg_win / avg_loss)
            else:
                capital -= risk_amount

            if capital > peak:
                peak = capital
            dd = (peak - capital) / peak if peak > 0 else 0
            max_dd = max(max_dd, dd)

            if capital <= 0:
                break

        max_drawdowns.append(max_dd)
        final_capitals.append(capital)

    max_drawdowns.sort()
    final_capitals.sort()

    return {
        "median_max_drawdown": max_drawdowns[len(max_drawdowns) // 2],
        "worst_5pct_drawdown": max_drawdowns[int(len(max_drawdowns) * 0.95)],
        "worst_1pct_drawdown": max_drawdowns[int(len(max_drawdowns) * 0.99)],
        "median_final_capital": final_capitals[len(final_capitals) // 2],
        "worst_5pct_capital": final_capitals[int(len(final_capitals) * 0.05)],
        "probability_of_ruin": sum(1 for c in final_capitals if c <= 0) / num_simulations,
    }
