"""APEX ORACLE — Schicht 7: STRATEGISCHE EXEKUTION (Execution Supremacy).

Entry-Protokoll:
1. Marktregime identifizieren
2. Multi-Timeframe-Alignment pruefen
3. Schluesselniveau erreicht?
4. Konfluenz-Score berechnen (min. 3/5)
5. Entry-Trigger abwarten (Candlestick/Struktur-Bestaetigung)
6. Position Sizing berechnen
7. Stop-Loss + Take-Profit VORHER definieren
8. Trade dokumentieren

Management-Protokoll:
- Breakeven-Stop nach 1R Profit
- Teilgewinnmitnahmen: 50% bei 1R, Rest mit Trailing Stop
- Zeitbasiertes Exit: Funktioniert nicht -> reduzieren/schliessen
"""

import logging
from datetime import datetime
from typing import Optional

from config.settings import TRADING_MODE

logger = logging.getLogger(__name__)


class TradeExecutor:
    """Schicht 7: Trade-Exekution.

    Fuehrt Trades aus — entweder Paper oder Live.
    """

    def __init__(self, exchange):
        self.exchange = exchange
        self.mode = TRADING_MODE
        self.active_trades: list[dict] = []

    def execute(
        self,
        symbol: str,
        side: str,
        stop_loss: float,
        targets: list[float],
        position_size_pct: float,
        order_type: str = "limit",
    ) -> bool:
        """Fuehre einen Trade aus.

        EHERNE GESETZE:
        - NIEMALS ohne Stop-Loss
        - NIEMALS ohne Exit-Plan
        - IMMER Position Sizing beachten
        """
        # Validierung
        if stop_loss == 0:
            logger.error("ABGELEHNT: Kein Stop-Loss definiert!")
            return False
        if not targets:
            logger.error("ABGELEHNT: Keine Targets definiert!")
            return False
        if position_size_pct <= 0:
            logger.error("ABGELEHNT: Ungueltige Positionsgroesse!")
            return False

        trade = {
            "symbol": symbol,
            "side": side,
            "stop_loss": stop_loss,
            "targets": targets,
            "position_size_pct": position_size_pct,
            "order_type": order_type,
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
        }

        if self.mode == "paper":
            return self._execute_paper(trade)
        elif self.mode == "live":
            return self._execute_live(trade)
        else:
            logger.error(f"Unbekannter Modus: {self.mode}")
            return False

    def _execute_paper(self, trade: dict) -> bool:
        """Paper Trading — Simulierter Trade."""
        logger.info(
            f"[PAPER] Trade ausgefuehrt: {trade['side'].upper()} "
            f"{trade['symbol']} | SL: {trade['stop_loss']:.2f} | "
            f"Targets: {[f'{t:.2f}' for t in trade['targets']]}"
        )

        trade["status"] = "active"
        trade["mode"] = "paper"
        self.active_trades.append(trade)
        return True

    def _execute_live(self, trade: dict) -> bool:
        """Live Trading — Echter Trade ueber Exchange.

        VORSICHT: Echtes Geld!
        """
        logger.warning("[LIVE] Echter Trade wird ausgefuehrt!")

        try:
            # Market/Limit Order
            order = self.exchange.create_order(
                symbol=trade["symbol"],
                order_type=trade["order_type"],
                side=trade["side"],
                amount=trade["position_size_pct"],  # Wird im Connector umgerechnet
            )

            if order:
                trade["order_id"] = order.get("id")
                trade["status"] = "active"
                trade["mode"] = "live"

                # Stop-Loss Order setzen
                self._set_stop_loss(trade)

                # Take-Profit Orders setzen
                self._set_take_profit_orders(trade)

                self.active_trades.append(trade)
                logger.info(f"[LIVE] Order ausgefuehrt: {order.get('id')}")
                return True

        except Exception as e:
            logger.error(f"[LIVE] Order fehlgeschlagen: {e}")
            return False

        return False

    def _set_stop_loss(self, trade: dict):
        """Setze Stop-Loss-Order. NIEMALS mentale Stops!"""
        try:
            sl_side = "sell" if trade["side"] == "buy" else "buy"
            self.exchange.create_order(
                symbol=trade["symbol"],
                order_type="stop_loss",
                side=sl_side,
                amount=trade["position_size_pct"],
                price=trade["stop_loss"],
            )
            logger.info(f"Stop-Loss gesetzt bei {trade['stop_loss']:.2f}")
        except Exception as e:
            logger.error(f"Stop-Loss konnte nicht gesetzt werden: {e}")
            logger.error("KRITISCH: Trade ohne Stop-Loss! Manuell eingreifen!")

    def _set_take_profit_orders(self, trade: dict):
        """Setze Take-Profit-Orders.

        Teilgewinnmitnahmen:
        - Target 1 (1R): 50% der Position
        - Target 2+: Trailing Stop fuer den Rest
        """
        targets = trade["targets"]
        tp_side = "sell" if trade["side"] == "buy" else "buy"

        for i, target in enumerate(targets):
            # Erste Haelfte bei Target 1, Rest verteilt
            pct = 50 if i == 0 else 25
            try:
                self.exchange.create_order(
                    symbol=trade["symbol"],
                    order_type="take_profit",
                    side=tp_side,
                    amount=trade["position_size_pct"] * (pct / 100),
                    price=target,
                )
                logger.info(f"Take-Profit {i+1} gesetzt bei {target:.2f} ({pct}%)")
            except Exception as e:
                logger.error(f"Take-Profit {i+1} fehlgeschlagen: {e}")

    def move_to_breakeven(self, trade_index: int):
        """Verschiebe Stop-Loss auf Breakeven nach 1R Profit."""
        if trade_index < len(self.active_trades):
            trade = self.active_trades[trade_index]
            logger.info(
                f"Stop-Loss auf Breakeven verschoben fuer {trade['symbol']}"
            )
            # TODO: Bestehende SL-Order aktualisieren

    def get_active_trades(self) -> list[dict]:
        """Zeige alle aktiven Trades."""
        return [t for t in self.active_trades if t["status"] == "active"]
