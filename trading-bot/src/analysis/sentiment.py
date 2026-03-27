"""APEX ORACLE — Schicht 6: BEHAVIORAL MASTERY (Anti-Bias-Firewall).

Sentiment-Analyse & Behavioral-Finance-Engine:
- Fear & Greed Index
- Put/Call Ratio
- VIX Term Structure
- Social Sentiment
- Cognitive Bias Detection
"""

import logging
from dataclasses import dataclass

from src.core.constants import Bias

logger = logging.getLogger(__name__)


@dataclass
class SentimentSnapshot:
    """Sentiment-Zusammenfassung."""
    fear_greed_index: int = 50      # 0 = Extreme Fear, 100 = Extreme Greed
    put_call_ratio: float = 1.0     # > 1 = bearish, < 0.7 = bullish
    social_sentiment: float = 0.0   # -1 bis +1
    funding_rate: float = 0.0       # Krypto: positiv = longs zahlen
    bias: Bias = Bias.NEUTRAL
    contrarian_signal: bool = False
    summary: str = ""


class SentimentAnalyzer:
    """Schicht 6: Behavioral Mastery.

    Analysiert Markt-Sentiment und identifiziert
    Extreme fuer Contrarian-Signale.
    """

    def analyze(self, symbol: str) -> dict:
        """Fuehre Sentiment-Analyse durch."""
        logger.info(f"Schicht 6: Sentiment-Analyse — {symbol}")

        snapshot = SentimentSnapshot()

        # TODO: Echte Datenquellen anbinden
        # - Fear & Greed Index API
        # - Options-Daten fuer Put/Call Ratio
        # - Social Media Sentiment (Twitter, Reddit)
        # - Krypto Funding Rates

        bias = self._interpret_sentiment(snapshot)
        snapshot.bias = bias

        return {
            "bias": bias,
            "fear_greed": snapshot.fear_greed_index,
            "contrarian": snapshot.contrarian_signal,
            "summary": snapshot.summary,
        }

    def _interpret_sentiment(self, snapshot: SentimentSnapshot) -> Bias:
        """Interpretiere Sentiment — Contrarian-Ansatz bei Extremen."""
        fg = snapshot.fear_greed_index

        # Extreme Fear = Contrarian Bullish
        if fg < 20:
            snapshot.contrarian_signal = True
            snapshot.summary = "EXTREME FEAR — Contrarian bullish Signal"
            return Bias.BULLISH

        # Extreme Greed = Contrarian Bearish
        if fg > 80:
            snapshot.contrarian_signal = True
            snapshot.summary = "EXTREME GREED — Contrarian bearish Signal"
            return Bias.BEARISH

        # Put/Call Ratio
        pcr = snapshot.put_call_ratio
        if pcr > 1.2:
            snapshot.summary = "Hohe Put/Call Ratio — Uebermaessige Angst"
            return Bias.BULLISH  # Contrarian
        elif pcr < 0.5:
            snapshot.summary = "Niedrige Put/Call Ratio — Uebermaessige Gier"
            return Bias.BEARISH  # Contrarian

        # Krypto Funding Rate
        fr = snapshot.funding_rate
        if fr > 0.05:
            snapshot.summary = "Hohe Funding Rate — Longs ueberpositioniert"
            return Bias.BEARISH
        elif fr < -0.05:
            snapshot.summary = "Negative Funding Rate — Shorts ueberpositioniert"
            return Bias.BULLISH

        snapshot.summary = "Sentiment neutral — keine Extreme"
        return Bias.NEUTRAL

    def check_cognitive_biases(self, trade_context: dict) -> list[str]:
        """Pruefe auf kognitive Verzerrungen vor einem Trade.

        Schicht 6: Anti-Bias-Firewall.
        """
        warnings = []

        # Confirmation Bias
        if trade_context.get("only_bullish_reasons", False):
            warnings.append(
                "CONFIRMATION BIAS: Du hast nur bullishe Argumente gesucht. "
                "Was spricht GEGEN den Trade?"
            )

        # Recency Bias
        recent_wins = trade_context.get("recent_consecutive_wins", 0)
        if recent_wins >= 3:
            warnings.append(
                f"RECENCY BIAS: {recent_wins} Gewinne in Folge. "
                "Positionsgroesse NICHT erhoehen!"
            )

        # Loss Aversion / Rache-Trade
        recent_losses = trade_context.get("recent_consecutive_losses", 0)
        if recent_losses >= 2:
            warnings.append(
                f"RACHE-TRADE-WARNUNG: {recent_losses} Verluste in Folge. "
                "EHERNES GESETZ #6: Pause nach Verlust!"
            )

        # FOMO
        if trade_context.get("price_moved_significantly", False):
            warnings.append(
                "FOMO-WARNUNG: Der Preis hat sich bereits stark bewegt. "
                "Verpasste Trades sind KEINE verlorenen Trades."
            )

        # Overconfidence
        if trade_context.get("position_size_above_normal", False):
            warnings.append(
                "OVERCONFIDENCE: Positionsgroesse ueber Normal. "
                "Disziplin > Brillanz."
            )

        return warnings
