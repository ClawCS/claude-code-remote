"""APEX ORACLE — Schicht 4: FUNDAMENTALANALYSE (Value Engine).

Analysiert:
- Aktien: KGV, KBV, KUV, EV/EBITDA, DCF, ROIC, ROE, Moat
- Krypto: On-Chain (NVT, MVRV, SOPR), Token Economics, TVL
- Forex: Zinsdifferenzen, Carry-Trade, COT-Daten
"""

import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class FundamentalScore:
    """Fundamentale Bewertung eines Assets."""
    asset_type: str = "unknown"  # stock | crypto | forex
    valuation_score: float = 0.0  # -1 (ueberbewertet) bis +1 (unterbewertet)
    quality_score: float = 0.0    # 0 bis 1
    growth_score: float = 0.0     # 0 bis 1
    moat_score: float = 0.0       # 0 bis 1
    catalysts: list[str] = field(default_factory=list)
    risks: list[str] = field(default_factory=list)
    summary: str = ""


class FundamentalAnalyzer:
    """Schicht 4: Fundamentalanalyse.

    Bewertet den inneren Wert und die Qualitaet eines Assets.
    """

    def analyze_stock(self, symbol: str, data: Optional[dict] = None) -> FundamentalScore:
        """Analysiere eine Aktie fundamental."""
        logger.info(f"Schicht 4: Fundamentalanalyse Aktie — {symbol}")

        score = FundamentalScore(asset_type="stock")

        if not data:
            score.summary = "Fundamentaldaten muessen ueber API geladen werden."
            return score

        # Bewertung
        pe_ratio = data.get("pe_ratio", 0)
        if pe_ratio > 0:
            if pe_ratio < 15:
                score.valuation_score = 0.8
            elif pe_ratio < 25:
                score.valuation_score = 0.3
            elif pe_ratio < 40:
                score.valuation_score = -0.2
            else:
                score.valuation_score = -0.7

        # Qualitaet
        roic = data.get("roic", 0)
        if roic > 20:
            score.quality_score = 0.9
        elif roic > 10:
            score.quality_score = 0.6
        else:
            score.quality_score = 0.3

        # Wachstum
        revenue_growth = data.get("revenue_growth", 0)
        if revenue_growth > 30:
            score.growth_score = 0.9
        elif revenue_growth > 15:
            score.growth_score = 0.6
        elif revenue_growth > 5:
            score.growth_score = 0.3

        # Moat
        score.moat_score = self._assess_moat(data)

        return score

    def analyze_crypto(self, symbol: str, data: Optional[dict] = None) -> FundamentalScore:
        """Analysiere eine Kryptowaehrung fundamental.

        On-Chain-Metriken:
        - NVT (Network Value to Transactions): < 25 = unterbewertet
        - MVRV Z-Score: < 0 = Akkumulationszone, > 7 = Verteilungszone
        - SOPR: < 1 = Verluste realisiert (Kapitulation)
        """
        logger.info(f"Schicht 4: Fundamentalanalyse Krypto — {symbol}")

        score = FundamentalScore(asset_type="crypto")

        if not data:
            score.summary = "On-Chain-Daten muessen ueber API geladen werden."
            return score

        # MVRV Z-Score
        mvrv = data.get("mvrv_zscore", 0)
        if mvrv < 0:
            score.valuation_score = 0.9
            score.catalysts.append("MVRV Z-Score im Akkumulationsbereich")
        elif mvrv > 7:
            score.valuation_score = -0.9
            score.risks.append("MVRV Z-Score im Verteilungsbereich")
        else:
            score.valuation_score = 0.5 - (mvrv / 14)

        # TVL (Total Value Locked) — fuer DeFi
        tvl_growth = data.get("tvl_growth_30d", 0)
        if tvl_growth > 20:
            score.growth_score = 0.8
            score.catalysts.append(f"TVL +{tvl_growth:.0f}% in 30 Tagen")
        elif tvl_growth < -20:
            score.growth_score = 0.2
            score.risks.append(f"TVL {tvl_growth:.0f}% in 30 Tagen")

        # Developer Activity
        dev_score = data.get("developer_score", 0)
        score.quality_score = min(1.0, dev_score / 100)

        return score

    def analyze_forex(self, pair: str, data: Optional[dict] = None) -> FundamentalScore:
        """Analysiere ein Waehrungspaar."""
        logger.info(f"Schicht 4: Fundamentalanalyse Forex — {pair}")

        score = FundamentalScore(asset_type="forex")

        if not data:
            score.summary = "Forex-Daten muessen ueber API geladen werden."
            return score

        # Zinsdifferenz
        rate_diff = data.get("interest_rate_differential", 0)
        if abs(rate_diff) > 2:
            if rate_diff > 0:
                score.catalysts.append(f"Positive Zinsdifferenz: {rate_diff:.1f}%")
                score.valuation_score = 0.5
            else:
                score.risks.append(f"Negative Zinsdifferenz: {rate_diff:.1f}%")
                score.valuation_score = -0.5

        return score

    def _assess_moat(self, data: dict) -> float:
        """Bewerte den wirtschaftlichen Burggraben (Moat)."""
        moat = 0.0

        # Netzwerkeffekte
        if data.get("network_effects", False):
            moat += 0.25

        # Wechselkosten
        if data.get("switching_costs", False):
            moat += 0.25

        # Markenstaerke
        if data.get("brand_strength", 0) > 70:
            moat += 0.25

        # Kostenvorteile
        gross_margin = data.get("gross_margin", 0)
        if gross_margin > 60:
            moat += 0.25

        return moat
