"""APEX ORACLE — Haupt-Engine.

Das Herz des Trading-Bots. Orchestriert alle 7 Kognitionsschichten
und koordiniert Analyse, Risikomanagement und Exekution.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

from rich.console import Console

from src.core.constants import (
    Bias,
    DrawdownStatus,
    MarketRegime,
    MIN_CONFLUENCE_SCORE,
    STRATEGY_MATRIX,
    Timeframe,
)
from src.analysis.technical import TechnicalAnalyzer
from src.analysis.elliott_wave import ElliottWaveAnalyzer
from src.analysis.sentiment import SentimentAnalyzer
from src.risk.manager import RiskManager
from src.risk.drawdown import DrawdownMonitor
from src.strategy.trend_following import TrendFollowingStrategy
from src.strategy.mean_reversion import MeanReversionStrategy
from src.strategy.smart_money import SmartMoneyStrategy
from src.execution.executor import TradeExecutor
from src.execution.journal import TradeJournal
from src.exchange.connector import ExchangeConnector

logger = logging.getLogger(__name__)
console = Console()


@dataclass
class AnalysisResult:
    """Ergebnis einer vollstaendigen 7-Schichten-Analyse."""

    asset: str
    timestamp: datetime
    bias: Bias
    confidence: int  # 1-10
    timeframe: Timeframe
    regime: MarketRegime
    macro_context: str = ""
    technical_summary: str = ""
    elliott_wave_primary: str = ""
    elliott_wave_alternative: str = ""
    invalidation_level: Optional[float] = None
    fundamental_summary: str = ""
    entry_zone: tuple[float, float] = (0.0, 0.0)
    stop_loss: float = 0.0
    targets: list[float] = field(default_factory=list)
    position_size_pct: float = 0.0
    risk_warnings: list[str] = field(default_factory=list)
    conviction_for: list[str] = field(default_factory=list)
    conviction_against: list[str] = field(default_factory=list)
    confluence_score: int = 0


class ApexOracle:
    """APEX ORACLE — Autonomes Entscheidungsintelligenz-System."""

    def __init__(self):
        self.exchange = ExchangeConnector()
        self.technical = TechnicalAnalyzer()
        self.elliott = ElliottWaveAnalyzer()
        self.sentiment = SentimentAnalyzer()
        self.risk_manager = RiskManager()
        self.drawdown_monitor = DrawdownMonitor()
        self.executor = TradeExecutor(self.exchange)
        self.journal = TradeJournal()

        self.strategies = {
            "trend_following": TrendFollowingStrategy(),
            "mean_reversion": MeanReversionStrategy(),
            "smart_money": SmartMoneyStrategy(),
        }

        logger.info("APEX ORACLE initialisiert — Alle Systeme online.")

    def analyze(self, symbol: str, timeframe: str = "1d") -> AnalysisResult:
        """Fuehre vollstaendige 7-Schichten-Analyse durch."""
        logger.info(f"Starte 7-Schichten-Analyse fuer {symbol} ({timeframe})")

        # Marktdaten holen
        ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe)
        if ohlcv is None or len(ohlcv) == 0:
            logger.error(f"Keine Daten fuer {symbol}")
            return self._empty_result(symbol)

        # Schicht 2: Technische Analyse
        tech = self.technical.analyze(ohlcv)

        # Schicht 3: Elliott Wave
        wave = self.elliott.analyze(ohlcv)

        # Schicht 5: Risikomanagement-Check
        dd_status = self.drawdown_monitor.get_status()
        if dd_status in (DrawdownStatus.PAUSE, DrawdownStatus.FULL_STOP):
            logger.warning(f"Drawdown-Status: {dd_status.value} — Trading pausiert!")
            result = self._empty_result(symbol)
            result.risk_warnings.append(
                f"DRAWDOWN {dd_status.value}: Trading ist pausiert!"
            )
            return result

        # Schicht 6: Sentiment/Behavioral Check
        sentiment = self.sentiment.analyze(symbol)

        # Regime bestimmen
        regime = tech.get("regime", MarketRegime.RANGE)

        # Bias bestimmen (Konfluenz aus allen Schichten)
        bias, confidence, confluence = self._determine_bias(
            tech, wave, sentiment, regime
        )

        # Strategie basierend auf Regime waehlen
        strategy_name = STRATEGY_MATRIX.get(regime, {}).get(
            "primary", "trend_following"
        )
        strategy = self.strategies.get(strategy_name)

        # Trade-Setup generieren
        setup = {}
        if strategy and confluence >= MIN_CONFLUENCE_SCORE:
            setup = strategy.generate_setup(ohlcv, tech, bias, self.risk_manager)

        result = AnalysisResult(
            asset=symbol,
            timestamp=datetime.now(),
            bias=bias,
            confidence=confidence,
            timeframe=Timeframe.SWING,
            regime=regime,
            technical_summary=tech.get("summary", ""),
            elliott_wave_primary=wave.get("primary_count", ""),
            elliott_wave_alternative=wave.get("alt_count", ""),
            invalidation_level=wave.get("invalidation"),
            entry_zone=setup.get("entry_zone", (0.0, 0.0)),
            stop_loss=setup.get("stop_loss", 0.0),
            targets=setup.get("targets", []),
            position_size_pct=setup.get("position_size_pct", 0.0),
            risk_warnings=setup.get("warnings", []),
            conviction_for=setup.get("conviction_for", []),
            conviction_against=setup.get("conviction_against", []),
            confluence_score=confluence,
        )

        self._print_analysis(result)
        return result

    def execute_trade(self, analysis: AnalysisResult) -> bool:
        """Fuehre Trade aus basierend auf Analyse-Ergebnis.

        Schicht 7: Strategische Exekution — Entry-Protokoll.
        """
        # Pre-Trade Mental Checks (Schicht 6: Behavioral Firewall)
        if analysis.confluence_score < MIN_CONFLUENCE_SCORE:
            logger.info(
                f"Konfluenz {analysis.confluence_score} < {MIN_CONFLUENCE_SCORE} "
                "— Kein Trade."
            )
            return False

        if analysis.confidence < 6:
            logger.info(
                f"Konfidenz {analysis.confidence}/10 zu niedrig — Kein Trade."
            )
            return False

        # EHERNES GESETZ #2: Kein Trade ohne Stop-Loss
        if analysis.stop_loss == 0.0:
            logger.warning("EHERNES GESETZ #2: Kein Trade ohne Stop-Loss!")
            return False

        # EHERNES GESETZ #3: Kein Trade ohne Exit-Plan
        if not analysis.targets:
            logger.warning("EHERNES GESETZ #3: Kein Trade ohne Exit-Plan!")
            return False

        # Drawdown-Eskalation pruefen
        dd_status = self.drawdown_monitor.get_status()
        if dd_status == DrawdownStatus.REDUCE:
            analysis.position_size_pct *= 0.5
            logger.warning("Drawdown REDUCE: Positionsgroesse halbiert.")
        elif dd_status == DrawdownStatus.A_PLUS_ONLY:
            if analysis.confidence < 8:
                logger.warning("Drawdown A+_ONLY: Nur A+ Setups — abgelehnt.")
                return False

        # Trade ausfuehren
        success = self.executor.execute(
            symbol=analysis.asset,
            side="buy" if analysis.bias == Bias.BULLISH else "sell",
            stop_loss=analysis.stop_loss,
            targets=analysis.targets,
            position_size_pct=analysis.position_size_pct,
        )

        if success:
            self.journal.log_trade(analysis)
            logger.info(f"Trade ausgefuehrt: {analysis.asset} {analysis.bias.value}")

        return success

    def run(self):
        """Hauptloop des APEX ORACLE."""
        from config.settings import TRADING_MODE

        logger.info(f"APEX ORACLE laeuft im {TRADING_MODE}-Modus.")
        console.print(
            f"\n[bold green]APEX ORACLE aktiv[/bold green] — "
            f"Modus: {TRADING_MODE.upper()}\n"
        )
        console.print(
            "Verwende [bold]oracle.analyze('BTC/USDT')[/bold] fuer eine Analyse.\n"
            "Verwende [bold]oracle.execute_trade(result)[/bold] fuer Exekution.\n"
        )

    def _determine_bias(
        self,
        tech: dict,
        wave: dict,
        sentiment: dict,
        regime: MarketRegime,
    ) -> tuple[Bias, int, int]:
        """Bestimme Bias durch Konfluenz aller Schichten."""
        score = 0  # positiv = bullish, negativ = bearish
        confluence = 0

        # Technischer Bias
        tech_bias = tech.get("bias")
        if tech_bias == Bias.BULLISH:
            score += 1
            confluence += 1
        elif tech_bias == Bias.BEARISH:
            score -= 1
            confluence += 1

        # Elliott Wave Bias
        wave_bias = wave.get("bias")
        if wave_bias == Bias.BULLISH:
            score += 1
            confluence += 1
        elif wave_bias == Bias.BEARISH:
            score -= 1
            confluence += 1

        # Sentiment Bias
        sent_bias = sentiment.get("bias")
        if sent_bias == Bias.BULLISH:
            score += 1
            confluence += 1
        elif sent_bias == Bias.BEARISH:
            score -= 1
            confluence += 1

        # Regime-Bonus
        if regime in (MarketRegime.BULLISH_TREND, MarketRegime.EUPHORIA):
            score += 1
            confluence += 1
        elif regime in (MarketRegime.BEARISH_TREND, MarketRegime.CRASH):
            score -= 1
            confluence += 1

        # Trend-Alignment (Multi-Timeframe)
        if tech.get("mtf_aligned", False):
            confluence += 1

        # Bias & Konfidenz berechnen
        if score > 0:
            bias = Bias.BULLISH
        elif score < 0:
            bias = Bias.BEARISH
        else:
            bias = Bias.NEUTRAL

        confidence = min(10, abs(score) * 2 + confluence)
        return bias, confidence, confluence

    def _empty_result(self, symbol: str) -> AnalysisResult:
        return AnalysisResult(
            asset=symbol,
            timestamp=datetime.now(),
            bias=Bias.NEUTRAL,
            confidence=0,
            timeframe=Timeframe.SWING,
            regime=MarketRegime.RANGE,
        )

    def _print_analysis(self, result: AnalysisResult):
        """Drucke Analyse im APEX ORACLE Format."""
        bias_color = {
            Bias.BULLISH: "green",
            Bias.BEARISH: "red",
            Bias.NEUTRAL: "yellow",
        }
        color = bias_color[result.bias]

        console.print()
        console.rule("[bold yellow]APEX ORACLE — ANALYSE-OUTPUT[/bold yellow]")
        console.print(f"  ASSET: [bold]{result.asset}[/bold]")
        console.print(f"  DATUM: {result.timestamp:%Y-%m-%d %H:%M}")
        console.print(f"  BIAS: [bold {color}]{result.bias.value}[/bold {color}]")
        console.print(f"  KONFIDENZ: {result.confidence}/10")
        console.print(f"  TIMEFRAME: {result.timeframe.value}")
        console.print(f"  REGIME: {result.regime.value}")
        console.print(f"  KONFLUENZ: {result.confluence_score}/5")

        if result.technical_summary:
            console.print(f"\n  [bold]-- TECHNISCHE STRUKTUR --[/bold]")
            console.print(f"  {result.technical_summary}")

        if result.elliott_wave_primary:
            console.print(f"\n  [bold]-- ELLIOTT-WAVE-COUNT --[/bold]")
            console.print(f"  Primaer: {result.elliott_wave_primary}")
            console.print(f"  Alternativ: {result.elliott_wave_alternative}")
            if result.invalidation_level:
                console.print(
                    f"  Invalidierung: {result.invalidation_level:,.2f}"
                )

        if result.stop_loss > 0:
            console.print(f"\n  [bold]-- TRADE-SETUP --[/bold]")
            console.print(
                f"  Entry Zone: {result.entry_zone[0]:,.2f} — "
                f"{result.entry_zone[1]:,.2f}"
            )
            console.print(f"  Stop Loss: {result.stop_loss:,.2f}")
            for i, target in enumerate(result.targets, 1):
                console.print(f"  Target {i}: {target:,.2f}")
            console.print(f"  Position Size: {result.position_size_pct:.1f}%")

        if result.risk_warnings:
            console.print(f"\n  [bold red]-- RISIKO-WARNUNG --[/bold red]")
            for w in result.risk_warnings:
                console.print(f"  {w}")

        if result.conviction_for:
            console.print(f"\n  [bold]-- CONVICTION FACTORS --[/bold]")
            for f in result.conviction_for:
                console.print(f"  + {f}")
            for a in result.conviction_against:
                console.print(f"  - {a}")

        console.rule()
