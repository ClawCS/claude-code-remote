"""APEX ORACLE — Trade Journal.

Post-Trade-Analyse:
- War der Trade regelkonform?
- Was haette ich besser machen koennen?
- Journal-Eintrag mit Emotionsprotokoll

Selbstoptimierungs-Loop:
- Woechentlich: Alle Trades reviewen
- Monatlich: Strategie-Performance nach Regime
- Quartalsweise: Komplettes System-Audit
"""

import json
import logging
import os
from datetime import datetime
from typing import Optional

from config.settings import JOURNAL_DIR

logger = logging.getLogger(__name__)


class TradeJournal:
    """Trade Journal — Dokumentiere alles, lerne aus allem."""

    def __init__(self):
        os.makedirs(JOURNAL_DIR, exist_ok=True)
        self.trades: list[dict] = []
        self._load_existing()

    def log_trade(self, analysis_result) -> dict:
        """Logge einen Trade im Journal."""
        entry = {
            "id": len(self.trades) + 1,
            "timestamp": datetime.now().isoformat(),
            "asset": analysis_result.asset,
            "bias": analysis_result.bias.value,
            "confidence": analysis_result.confidence,
            "regime": analysis_result.regime.value,
            "confluence_score": analysis_result.confluence_score,
            "entry_zone": list(analysis_result.entry_zone),
            "stop_loss": analysis_result.stop_loss,
            "targets": analysis_result.targets,
            "position_size_pct": analysis_result.position_size_pct,
            "conviction_for": analysis_result.conviction_for,
            "conviction_against": analysis_result.conviction_against,
            "risk_warnings": analysis_result.risk_warnings,
            # Post-Trade (wird spaeter ausgefuellt)
            "result": None,         # win | loss | breakeven
            "pnl": 0.0,
            "actual_rr": 0.0,
            "rule_compliant": True,
            "lessons_learned": "",
            "emotion_before": "",
            "emotion_after": "",
        }

        self.trades.append(entry)
        self._save()

        logger.info(f"Trade #{entry['id']} im Journal dokumentiert: {entry['asset']}")
        return entry

    def close_trade(
        self,
        trade_id: int,
        result: str,
        pnl: float,
        actual_rr: float,
        rule_compliant: bool = True,
        lessons: str = "",
        emotion_before: str = "",
        emotion_after: str = "",
    ):
        """Schliesse einen Trade und dokumentiere das Ergebnis."""
        for trade in self.trades:
            if trade["id"] == trade_id:
                trade["result"] = result
                trade["pnl"] = pnl
                trade["actual_rr"] = actual_rr
                trade["rule_compliant"] = rule_compliant
                trade["lessons_learned"] = lessons
                trade["emotion_before"] = emotion_before
                trade["emotion_after"] = emotion_after
                trade["closed_at"] = datetime.now().isoformat()
                self._save()
                logger.info(
                    f"Trade #{trade_id} geschlossen: {result} | "
                    f"PnL: {pnl:.2f} | R:R: {actual_rr:.1f}"
                )
                return

        logger.warning(f"Trade #{trade_id} nicht gefunden!")

    def get_statistics(self) -> dict:
        """Berechne Trading-Statistiken."""
        closed = [t for t in self.trades if t["result"] is not None]

        if not closed:
            return {"total_trades": 0, "message": "Noch keine geschlossenen Trades"}

        wins = [t for t in closed if t["result"] == "win"]
        losses = [t for t in closed if t["result"] == "loss"]

        total_pnl = sum(t["pnl"] for t in closed)
        avg_win = (
            sum(t["pnl"] for t in wins) / len(wins) if wins else 0
        )
        avg_loss = (
            sum(t["pnl"] for t in losses) / len(losses) if losses else 0
        )

        win_rate = len(wins) / len(closed) if closed else 0
        avg_rr = (
            sum(t["actual_rr"] for t in closed) / len(closed) if closed else 0
        )
        rule_compliance = (
            sum(1 for t in closed if t["rule_compliant"]) / len(closed)
            if closed
            else 0
        )

        # Erwartungswert
        expected_value = (win_rate * avg_win) - ((1 - win_rate) * abs(avg_loss))

        # Profit Factor
        gross_profit = sum(t["pnl"] for t in wins)
        gross_loss = abs(sum(t["pnl"] for t in losses))
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else float("inf")

        return {
            "total_trades": len(closed),
            "wins": len(wins),
            "losses": len(losses),
            "win_rate": f"{win_rate:.1%}",
            "total_pnl": total_pnl,
            "avg_win": avg_win,
            "avg_loss": avg_loss,
            "avg_rr": avg_rr,
            "expected_value": expected_value,
            "profit_factor": profit_factor,
            "rule_compliance": f"{rule_compliance:.1%}",
        }

    def weekly_review(self) -> dict:
        """Woechentlicher Review — Alle Trades der letzten Woche."""
        from datetime import timedelta

        week_ago = datetime.now() - timedelta(days=7)
        recent = [
            t for t in self.trades
            if datetime.fromisoformat(t["timestamp"]) > week_ago
        ]

        stats = self.get_statistics()

        # Beste und schlechteste Trades
        closed_recent = [t for t in recent if t["result"] is not None]
        best = max(closed_recent, key=lambda t: t["pnl"]) if closed_recent else None
        worst = min(closed_recent, key=lambda t: t["pnl"]) if closed_recent else None

        return {
            "period": "Letzte 7 Tage",
            "trades_count": len(recent),
            "overall_stats": stats,
            "best_trade": best,
            "worst_trade": worst,
            "action_items": self._generate_action_items(closed_recent),
        }

    def _generate_action_items(self, trades: list[dict]) -> list[str]:
        """Generiere Handlungsempfehlungen aus Trade-Review."""
        items = []

        non_compliant = [t for t in trades if not t.get("rule_compliant", True)]
        if non_compliant:
            items.append(
                f"{len(non_compliant)} Trades waren nicht regelkonform — "
                "System-Review noetig!"
            )

        losses_in_row = 0
        for t in trades:
            if t.get("result") == "loss":
                losses_in_row += 1
            else:
                losses_in_row = 0
        if losses_in_row >= 3:
            items.append(
                f"{losses_in_row} Verluste in Folge — "
                "EHERNES GESETZ #6: Pause und System reviewen!"
            )

        return items

    def _save(self):
        """Speichere Journal."""
        filepath = os.path.join(JOURNAL_DIR, "trades.json")
        with open(filepath, "w") as f:
            json.dump(self.trades, f, indent=2, default=str)

    def _load_existing(self):
        """Lade bestehendes Journal."""
        filepath = os.path.join(JOURNAL_DIR, "trades.json")
        if os.path.exists(filepath):
            with open(filepath) as f:
                self.trades = json.load(f)
            logger.info(f"Journal geladen: {len(self.trades)} Trades")
