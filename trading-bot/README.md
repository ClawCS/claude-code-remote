# APEX ORACLE — Trading Bot

> **Codename: APEX ORACLE**
> Autonomes Entscheidungsintelligenz-System fuer Trading, Marktanalyse & Vermoegensaufbau.

## Features

- **7-Schichten-Kognitionsarchitektur** — Jede Analyse durchlaeuft alle 7 Schichten
- **Multi-Exchange** — Anbindung via ccxt (Binance, Kraken, etc.)
- **Risikomanagement** — Position Sizing, Stop-Loss, Drawdown-Management
- **Multi-Strategie** — Trend Following, Mean Reversion, Smart Money Concepts, Elliott Wave
- **Trade Journal** — Automatische Dokumentation aller Trades
- **Behavioral Firewall** — Anti-Bias-System gegen emotionale Fehler

## Projektstruktur

```
Trading-Bot/
├── config/
│   └── settings.py          # Konfiguration & Konstanten
├── src/
│   ├── core/
│   │   ├── oracle.py         # APEX ORACLE Hauptengine
│   │   └── constants.py      # Eherne Gesetze & Regeln
│   ├── analysis/
│   │   ├── macro.py          # Schicht 1: Makro-Radar
│   │   ├── technical.py      # Schicht 2: Chart-Analyse
│   │   ├── elliott_wave.py   # Schicht 3: Elliott-Wave
│   │   ├── fundamental.py    # Schicht 4: Fundamentalanalyse
│   │   └── sentiment.py      # Schicht 6: Behavioral Mastery
│   ├── risk/
│   │   ├── manager.py        # Schicht 5: Risk Management
│   │   ├── position_sizing.py
│   │   └── drawdown.py       # Drawdown-Monitoring
│   ├── strategy/
│   │   ├── base.py           # Basis-Strategie-Klasse
│   │   ├── trend_following.py
│   │   ├── mean_reversion.py
│   │   ├── smart_money.py    # Smart Money Concepts
│   │   └── crypto_cycle.py   # Krypto-Zyklen
│   ├── execution/
│   │   ├── executor.py       # Schicht 7: Trade-Exekution
│   │   └── journal.py        # Trade-Journal
│   └── exchange/
│       └── connector.py      # Exchange-Connector (ccxt)
├── tests/
├── data/
├── logs/
└── journal/
```

## Installation

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env
# .env mit eigenen API-Keys fuellen
```

## Starten

```bash
python -m src.main
```

## Disclaimer

Dieser Bot ist ein Werkzeug, keine Gelddruckmaschine. Trading birgt erhebliche Risiken.
Verwende immer zuerst den Paper-Trading-Modus. Investiere nur, was du bereit bist zu verlieren.

> **APEX ORACLE — Weil Mittelmaeßigkeit keine Option ist.**
> *Disziplin. Daten. Dominanz.*
