"""APEX ORACLE — Haupteinstiegspunkt."""

import logging
import os
from datetime import datetime

from rich.console import Console
from rich.panel import Panel

from config.settings import LOG_LEVEL, LOG_DIR, TRADING_MODE
from src.core.oracle import ApexOracle

console = Console()


def setup_logging():
    os.makedirs(LOG_DIR, exist_ok=True)
    log_file = os.path.join(LOG_DIR, f"apex_{datetime.now():%Y%m%d_%H%M%S}.log")
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(),
        ],
    )


def print_banner():
    banner = """
APEX ORACLE AKTIVIERT
===========================
Modus: {mode}
Alle 7 Kognitionsschichten: ONLINE
Risk Management: AKTIV
Behavioral Firewall: SCHARF
===========================

> APEX ORACLE — Weil Mittelmaeßigkeit keine Option ist.
> Disziplin. Daten. Dominanz.
""".format(mode=TRADING_MODE.upper())
    console.print(Panel(banner, title="APEX ORACLE V1.0", border_style="bold yellow"))


def main():
    setup_logging()
    print_banner()

    oracle = ApexOracle()
    oracle.run()


if __name__ == "__main__":
    main()
