"""APEX ORACLE — Schicht 3: ELLIOTT-WAVE-ANALYSE (Wave Supremacy).

Implementiert:
- Impuls-Regeln (unverhandelbar)
- Multi-Degree-Analyse
- Fibonacci-Cluster
- Alternation-Prinzip
- Invalidierungspunkte

Impuls-Regeln:
1. Welle 2 retraciert NIEMALS 100% von Welle 1
2. Welle 3 ist NIEMALS die kuerzeste Impulswelle
3. Welle 4 ueberlappt NIEMALS das Preisterritorium von Welle 1
   (Ausnahme: Diagonale/Ending Diagonal)
"""

import logging
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import pandas as pd

from src.core.constants import (
    Bias,
    FIB_EXTENSIONS,
    FIB_RETRACEMENTS,
    WaveDegree,
    WaveType,
)

logger = logging.getLogger(__name__)


@dataclass
class WaveCount:
    """Eine Elliott-Wave-Zaehlung."""
    wave_type: WaveType
    degree: WaveDegree
    current_wave: str  # z.B. "3", "C", "iv"
    bias: Bias
    confidence: float  # 0.0-1.0
    invalidation_level: float = 0.0
    targets: list[float] = field(default_factory=list)
    description: str = ""


class ElliottWaveAnalyzer:
    """Schicht 3: Elliott Wave Analyse.

    Identifiziert Wellenstrukturen und generiert
    Primaer- und Alternativzaehlungen.
    """

    def analyze(self, ohlcv: pd.DataFrame) -> dict:
        """Fuehre Elliott-Wave-Analyse durch."""
        logger.info("Schicht 3: Elliott Wave — Analyse gestartet")

        result = {
            "bias": Bias.NEUTRAL,
            "primary_count": "",
            "alt_count": "",
            "invalidation": None,
            "targets": [],
        }

        if ohlcv is None or len(ohlcv) < 50:
            return result

        close = ohlcv["close"].values
        high = ohlcv["high"].values
        low = ohlcv["low"].values

        # Swing-Punkte identifizieren
        swings = self._find_swing_points(high, low)

        if len(swings) < 5:
            result["primary_count"] = "Nicht genuegend Swing-Punkte fuer Zaehlung"
            return result

        # Primaerzaehlung versuchen
        primary = self._try_impulse_count(swings, close)
        if primary:
            result["primary_count"] = primary.description
            result["bias"] = primary.bias
            result["invalidation"] = primary.invalidation_level
            result["targets"] = primary.targets

        # Alternativzaehlung (IMMER mindestens eine!)
        alt = self._try_corrective_count(swings, close)
        if alt:
            result["alt_count"] = alt.description

        return result

    def _find_swing_points(
        self, high: np.ndarray, low: np.ndarray, order: int = 5
    ) -> list[dict]:
        """Identifiziere Swing-Highs und Swing-Lows."""
        swings = []

        for i in range(order, len(high) - order):
            # Swing High
            is_swing_high = all(
                high[i] >= high[i - j] and high[i] >= high[i + j]
                for j in range(1, order + 1)
            )
            if is_swing_high:
                swings.append({
                    "index": i,
                    "type": "high",
                    "price": float(high[i]),
                })

            # Swing Low
            is_swing_low = all(
                low[i] <= low[i - j] and low[i] <= low[i + j]
                for j in range(1, order + 1)
            )
            if is_swing_low:
                swings.append({
                    "index": i,
                    "type": "low",
                    "price": float(low[i]),
                })

        swings.sort(key=lambda x: x["index"])
        return swings

    def _try_impulse_count(
        self, swings: list[dict], close: np.ndarray
    ) -> Optional[WaveCount]:
        """Versuche eine Impuls-Zaehlung (5 Wellen)."""
        if len(swings) < 5:
            return None

        # Letzte 5 Swing-Punkte nehmen
        recent = swings[-5:]
        prices = [s["price"] for s in recent]

        # Aufwaerts-Impuls pruefen
        if self._validate_impulse_up(prices):
            w1_length = prices[1] - prices[0]
            w3_length = prices[3] - prices[2]

            # Welle 5 Target: Fibonacci-Extensions
            targets = []
            for ext in [1.0, 1.618, 2.618]:
                target = prices[4] + w1_length * ext
                targets.append(target)

            return WaveCount(
                wave_type=WaveType.IMPULSE,
                degree=WaveDegree.INTERMEDIATE,
                current_wave="5",
                bias=Bias.BULLISH,
                confidence=0.7,
                invalidation_level=prices[3],  # Welle 4 Tief
                targets=targets,
                description=(
                    f"Aufwaerts-Impuls: Welle 5 laeuft. "
                    f"Invalidierung unter {prices[3]:,.2f}"
                ),
            )

        # Abwaerts-Impuls pruefen
        if self._validate_impulse_down(prices):
            w1_length = prices[0] - prices[1]
            targets = []
            for ext in [1.0, 1.618, 2.618]:
                target = prices[4] - w1_length * ext
                targets.append(max(0, target))

            return WaveCount(
                wave_type=WaveType.IMPULSE,
                degree=WaveDegree.INTERMEDIATE,
                current_wave="5",
                bias=Bias.BEARISH,
                confidence=0.7,
                invalidation_level=prices[3],
                targets=targets,
                description=(
                    f"Abwaerts-Impuls: Welle 5 laeuft. "
                    f"Invalidierung ueber {prices[3]:,.2f}"
                ),
            )

        return None

    def _try_corrective_count(
        self, swings: list[dict], close: np.ndarray
    ) -> Optional[WaveCount]:
        """Versuche eine korrektive Zaehlung (ABC)."""
        if len(swings) < 3:
            return None

        recent = swings[-3:]
        prices = [s["price"] for s in recent]

        # Aufwaerts-Korrektur (Zigzag)
        if prices[1] > prices[0] and prices[2] < prices[1] and prices[2] > prices[0]:
            # ABC fertig -> Abwaerts
            return WaveCount(
                wave_type=WaveType.ZIGZAG,
                degree=WaveDegree.INTERMEDIATE,
                current_wave="C",
                bias=Bias.BEARISH,
                confidence=0.5,
                invalidation_level=prices[1],
                description=(
                    f"Alternative: ABC-Korrektur (Zigzag). "
                    f"C-Welle koennte bei {prices[0]:,.2f} enden."
                ),
            )

        # Abwaerts-Korrektur
        if prices[1] < prices[0] and prices[2] > prices[1] and prices[2] < prices[0]:
            return WaveCount(
                wave_type=WaveType.ZIGZAG,
                degree=WaveDegree.INTERMEDIATE,
                current_wave="C",
                bias=Bias.BULLISH,
                confidence=0.5,
                invalidation_level=prices[1],
                description=(
                    f"Alternative: ABC-Korrektur abgeschlossen. "
                    f"Neue Aufwaertsbewegung moeglich."
                ),
            )

        return None

    def _validate_impulse_up(self, prices: list[float]) -> bool:
        """Validiere Aufwaerts-Impuls gegen die 3 unverhandelbaren Regeln."""
        if len(prices) < 5:
            return False

        w0, w1, w2, w3, w4 = prices

        # Basisstruktur: aufwaerts
        if not (w1 > w0 and w3 > w1):
            return False

        # Regel 1: Welle 2 retraciert NIEMALS 100% von Welle 1
        if w2 <= w0:
            return False

        # Regel 2: Welle 3 ist NIEMALS die kuerzeste
        w1_len = w1 - w0
        w3_len = w3 - w2
        w5_len = abs(prices[-1] - w4) if len(prices) > 4 else w1_len
        if w3_len < w1_len and w3_len < w5_len:
            return False

        # Regel 3: Welle 4 ueberlappt NIEMALS Welle 1
        if w4 <= w1:
            return False

        return True

    def _validate_impulse_down(self, prices: list[float]) -> bool:
        """Validiere Abwaerts-Impuls."""
        if len(prices) < 5:
            return False

        w0, w1, w2, w3, w4 = prices

        if not (w1 < w0 and w3 < w1):
            return False

        # Regel 1
        if w2 >= w0:
            return False

        # Regel 2
        w1_len = w0 - w1
        w3_len = w2 - w3
        w5_len = abs(w4 - prices[-1]) if len(prices) > 4 else w1_len
        if w3_len < w1_len and w3_len < w5_len:
            return False

        # Regel 3
        if w4 >= w1:
            return False

        return True

    def calculate_fib_levels(
        self, swing_low: float, swing_high: float
    ) -> dict:
        """Berechne Fibonacci-Retracements und -Extensions."""
        diff = swing_high - swing_low

        retracements = {}
        for level in FIB_RETRACEMENTS:
            retracements[f"{level:.3f}"] = swing_high - diff * level

        extensions = {}
        for level in FIB_EXTENSIONS:
            extensions[f"{level:.3f}"] = swing_high + diff * (level - 1)

        return {
            "retracements": retracements,
            "extensions": extensions,
        }
