"""APEX ORACLE — Exchange Connector.

Multi-Exchange-Anbindung via ccxt.
Unterstuetzt: Binance, Kraken, Coinbase, und weitere.

Paper Trading: Simuliert Orders ohne echtes Geld.
Live Trading: Echte Orders ueber Exchange-API.
"""

import logging
from typing import Optional

import ccxt
import pandas as pd

from config.settings import (
    EXCHANGE_API_KEY,
    EXCHANGE_API_SECRET,
    EXCHANGE_NAME,
    TRADING_MODE,
)

logger = logging.getLogger(__name__)


class ExchangeConnector:
    """Exchange-Connector fuer Multi-Exchange-Support via ccxt."""

    def __init__(self):
        self.mode = TRADING_MODE
        self.exchange_name = EXCHANGE_NAME
        self.exchange = self._initialize_exchange()

    def _initialize_exchange(self):
        """Initialisiere Exchange-Verbindung."""
        exchange_class = getattr(ccxt, self.exchange_name, None)

        if exchange_class is None:
            logger.error(f"Exchange '{self.exchange_name}' nicht unterstuetzt!")
            return None

        config = {
            "enableRateLimit": True,
        }

        if self.mode == "live" and EXCHANGE_API_KEY:
            config["apiKey"] = EXCHANGE_API_KEY
            config["secret"] = EXCHANGE_API_SECRET
            logger.info(f"Exchange {self.exchange_name} initialisiert (LIVE)")
        else:
            logger.info(
                f"Exchange {self.exchange_name} initialisiert (Public/Paper)"
            )

        exchange = exchange_class(config)

        # Sandbox/Testnet fuer Paper Trading
        if self.mode == "paper" and hasattr(exchange, "set_sandbox_mode"):
            exchange.set_sandbox_mode(True)
            logger.info("Sandbox-Modus aktiviert")

        return exchange

    def fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str = "1d",
        limit: int = 500,
    ) -> Optional[pd.DataFrame]:
        """Hole OHLCV-Daten von der Exchange."""
        if self.exchange is None:
            logger.error("Keine Exchange-Verbindung!")
            return None

        try:
            ohlcv = self.exchange.fetch_ohlcv(
                symbol, timeframe=timeframe, limit=limit
            )

            df = pd.DataFrame(
                ohlcv,
                columns=["timestamp", "open", "high", "low", "close", "volume"],
            )
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
            df.set_index("timestamp", inplace=True)

            logger.info(
                f"OHLCV geladen: {symbol} {timeframe} — {len(df)} Kerzen"
            )
            return df

        except ccxt.NetworkError as e:
            logger.error(f"Netzwerkfehler: {e}")
        except ccxt.ExchangeError as e:
            logger.error(f"Exchange-Fehler: {e}")
        except Exception as e:
            logger.error(f"Unerwarteter Fehler: {e}")

        return None

    def fetch_ticker(self, symbol: str) -> Optional[dict]:
        """Hole aktuellen Ticker (Preis, Volume, etc.)."""
        if self.exchange is None:
            return None

        try:
            ticker = self.exchange.fetch_ticker(symbol)
            return {
                "symbol": symbol,
                "last": ticker.get("last"),
                "bid": ticker.get("bid"),
                "ask": ticker.get("ask"),
                "volume_24h": ticker.get("quoteVolume"),
                "change_24h": ticker.get("percentage"),
            }
        except Exception as e:
            logger.error(f"Ticker-Fehler fuer {symbol}: {e}")
            return None

    def fetch_order_book(
        self, symbol: str, limit: int = 20
    ) -> Optional[dict]:
        """Hole Orderbuch fuer Liquiditaets-Analyse."""
        if self.exchange is None:
            return None

        try:
            ob = self.exchange.fetch_order_book(symbol, limit=limit)
            return {
                "bids": ob.get("bids", []),
                "asks": ob.get("asks", []),
                "bid_volume": sum(b[1] for b in ob.get("bids", [])),
                "ask_volume": sum(a[1] for a in ob.get("asks", [])),
            }
        except Exception as e:
            logger.error(f"Orderbuch-Fehler: {e}")
            return None

    def create_order(
        self,
        symbol: str,
        order_type: str,
        side: str,
        amount: float,
        price: Optional[float] = None,
    ) -> Optional[dict]:
        """Erstelle eine Order."""
        if self.mode == "paper":
            return self._paper_order(symbol, order_type, side, amount, price)

        if self.exchange is None:
            logger.error("Keine Exchange-Verbindung!")
            return None

        try:
            if order_type == "market":
                order = self.exchange.create_market_order(symbol, side, amount)
            elif order_type == "limit" and price:
                order = self.exchange.create_limit_order(
                    symbol, side, amount, price
                )
            elif order_type == "stop_loss" and price:
                order = self.exchange.create_order(
                    symbol, "stop_loss", side, amount, price
                )
            elif order_type == "take_profit" and price:
                order = self.exchange.create_order(
                    symbol, "take_profit", side, amount, price
                )
            else:
                logger.error(f"Ungueltiger Order-Typ: {order_type}")
                return None

            logger.info(
                f"Order erstellt: {side} {amount} {symbol} @ "
                f"{price or 'market'} ({order_type})"
            )
            return order

        except ccxt.InsufficientFunds:
            logger.error("Nicht genuegend Guthaben!")
        except ccxt.InvalidOrder as e:
            logger.error(f"Ungueltige Order: {e}")
        except Exception as e:
            logger.error(f"Order-Fehler: {e}")

        return None

    def _paper_order(
        self,
        symbol: str,
        order_type: str,
        side: str,
        amount: float,
        price: Optional[float] = None,
    ) -> dict:
        """Simulierte Paper-Order."""
        order = {
            "id": f"paper_{len(self._paper_orders) + 1}",
            "symbol": symbol,
            "type": order_type,
            "side": side,
            "amount": amount,
            "price": price,
            "status": "filled",
            "mode": "paper",
        }

        self._paper_orders.append(order)
        logger.info(f"[PAPER] Order: {side} {amount} {symbol} @ {price or 'market'}")
        return order

    @property
    def _paper_orders(self) -> list:
        if not hasattr(self, "__paper_orders"):
            self.__paper_orders = []
        return self.__paper_orders

    def get_balance(self) -> Optional[dict]:
        """Hole Kontostand."""
        if self.exchange is None or self.mode == "paper":
            return {"total": {"USDT": 100000}, "free": {"USDT": 100000}}

        try:
            return self.exchange.fetch_balance()
        except Exception as e:
            logger.error(f"Balance-Fehler: {e}")
            return None
