"""APEX ORACLE — Eherne Gesetze & Konstanten.

Diese Regeln sind NIEMALS verhandelbar.
"""

from enum import Enum


class MarketRegime(Enum):
    """Marktregime-Klassifikation."""
    BULLISH_TREND = "bullish_trend"
    BEARISH_TREND = "bearish_trend"
    RANGE = "range"
    HIGH_VOLATILITY = "high_volatility"
    LOW_VOLATILITY = "low_volatility"
    CRASH = "crash"
    EUPHORIA = "euphoria"


class Bias(Enum):
    """Trade-Bias."""
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    NEUTRAL = "NEUTRAL"


class Timeframe(Enum):
    """Trading-Zeithorizont."""
    INTRADAY = "Intraday"
    SWING = "Swing"
    POSITION = "Position"
    INVESTMENT = "Investment"


class DrawdownStatus(Enum):
    """Drawdown-Eskalationsstufen."""
    NORMAL = "normal"
    REDUCE = "reduce"             # 5% DD
    A_PLUS_ONLY = "a_plus_only"   # 10% DD
    PAUSE = "pause"               # 15% DD
    FULL_STOP = "full_stop"       # 20% DD


class WaveType(Enum):
    """Elliott Wave Typen."""
    IMPULSE = "impulse"           # 5-Wellen-Impuls
    ZIGZAG = "zigzag"             # 5-3-5
    FLAT = "flat"                 # 3-3-5
    TRIANGLE = "triangle"         # 3-3-3-3-3
    DOUBLE_COMBO = "double_combo" # W-X-Y
    TRIPLE_COMBO = "triple_combo" # W-X-Y-X-Z


class WaveDegree(Enum):
    """Elliott Wave Grade."""
    GRAND_SUPERCYCLE = "Grand Supercycle"
    SUPERCYCLE = "Supercycle"
    CYCLE = "Cycle"
    PRIMARY = "Primary"
    INTERMEDIATE = "Intermediate"
    MINOR = "Minor"
    MINUTE = "Minute"
    MINUETTE = "Minuette"
    SUB_MINUETTE = "Sub-Minuette"


# === Strategie-Matrix nach Marktregime ===
STRATEGY_MATRIX = {
    MarketRegime.BULLISH_TREND: {
        "primary": "trend_following",
        "secondary": "elliott_w3_entry",
    },
    MarketRegime.BEARISH_TREND: {
        "primary": "short_selling",
        "secondary": "put_options",
    },
    MarketRegime.RANGE: {
        "primary": "mean_reversion",
        "secondary": "iron_condor",
    },
    MarketRegime.HIGH_VOLATILITY: {
        "primary": "volatility_breakout",
        "secondary": "hedging_first",
    },
    MarketRegime.LOW_VOLATILITY: {
        "primary": "squeeze_setup",
        "secondary": "accumulation",
    },
    MarketRegime.CRASH: {
        "primary": "cash_deployment",
        "secondary": "deep_value_hunting",
    },
    MarketRegime.EUPHORIA: {
        "primary": "profit_taking",
        "secondary": "hedging_escalation",
    },
}

# === Die 12 Ehernen Gesetze ===
IRON_LAWS = [
    "KAPITALERHALT > KAPITALWACHSTUM. Immer.",
    "Kein Trade ohne Stop-Loss. NIEMALS.",
    "Kein Trade ohne vordefinierten Exit-Plan. NIEMALS.",
    "Verluste begrenzen, Gewinne laufen lassen.",
    "Der Markt hat immer Recht. Dein Ego nie.",
    "Keine Rache-Trades. Nach einem Verlust -> Pause.",
    "Korrelationsrisiko ist das unsichtbare Risiko. Immer monitoren.",
    "Cash ist eine Position. Manchmal die beste.",
    "Backteste alles. Vertraue nichts ohne Daten.",
    "Wenn der Trade erklaert werden muss -> kein Trade.",
    "Ueberlebe den Drawdown. Wer ueberlebt, gewinnt langfristig.",
    "Disziplin > Intelligenz. Konstanz > Brillanz.",
]

# === Fibonacci Levels ===
FIB_RETRACEMENTS = [0.236, 0.382, 0.5, 0.618, 0.786]
FIB_EXTENSIONS = [1.0, 1.272, 1.618, 2.0, 2.618, 3.618, 4.236]

# === Konfluenz-Mindestanforderung ===
MIN_CONFLUENCE_SCORE = 3  # Minimum 3 von 5 Faktoren

# === Mental Checks vor jedem Trade ===
PRE_TRADE_CHECKS = [
    "Wuerde ich diesen Trade auch eingehen, wenn ich bereits 5 Verlierer in Folge haette?",
    "Ist das ein Setup oder ein Gefuehl?",
    "Habe ich den Invalidierungspunkt BEVOR ich den Trade eingehe?",
    "Passt der Trade zum uebergeordneten Marktregime?",
]
