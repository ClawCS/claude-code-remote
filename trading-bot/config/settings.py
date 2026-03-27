"""APEX ORACLE — Konfiguration & Einstellungen."""

import os
from dotenv import load_dotenv

load_dotenv()

# === Exchange ===
EXCHANGE_NAME = os.getenv("EXCHANGE_NAME", "binance")
EXCHANGE_API_KEY = os.getenv("EXCHANGE_API_KEY", "")
EXCHANGE_API_SECRET = os.getenv("EXCHANGE_API_SECRET", "")

# === Trading Mode ===
TRADING_MODE = os.getenv("TRADING_MODE", "paper")  # paper | live

# === Risk Management ===
MAX_RISK_PER_TRADE = float(os.getenv("MAX_RISK_PER_TRADE", "0.02"))  # 2%
MAX_DRAWDOWN_PERCENT = float(os.getenv("MAX_DRAWDOWN_PERCENT", "0.20"))  # 20%
CASH_RESERVE_PERCENT = float(os.getenv("CASH_RESERVE_PERCENT", "0.20"))  # 20%

# === Drawdown Eskalationsstufen ===
DRAWDOWN_LEVELS = {
    0.05: "REDUCE",       # 5%  -> Positionsgroessen halbieren
    0.10: "A_PLUS_ONLY",  # 10% -> Nur A+ Setups
    0.15: "PAUSE",        # 15% -> Trading pausieren
    0.20: "FULL_STOP",    # 20% -> Komplette Neubewertung
}

# === Position Sizing ===
KELLY_FRACTION = 0.5  # Half-Kelly als Standard
MIN_RISK_REWARD = 2.0  # Minimum R:R = 1:2

# === Timeframes ===
TIMEFRAMES = ["1M", "1w", "1d", "4h", "1h", "15m"]

# === Technical Indicators ===
EMA_PERIODS = [20, 50, 100, 200]
RSI_PERIOD = 14
ATR_PERIOD = 14
BOLLINGER_PERIOD = 20
BOLLINGER_STD = 2.0

# === Logging ===
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_DIR = "logs"
JOURNAL_DIR = "journal"
DATA_DIR = "data"
