import { MILITARY_LABELS } from "../constants/militaryConstants";
import type { MilitaryType } from "../types/militaryTypes";
import "./LegendPanel.css";

interface LegendPanelProps {
    selectedTypes: MilitaryType[];
    featureCount: number;
}

export default function LegendPanel({ selectedTypes, featureCount }: LegendPanelProps) {
    return (
        <div className="legend-panel">
            <div className="legend-panel__title">Legenda:</div>
            <div className="legend-panel__row">
                <strong>Typ:</strong> {selectedTypes.map(t => MILITARY_LABELS[t]).join(", ")}
            </div>
            <div className="legend-panel__row">
                <strong>Liczba obiektów:</strong> {featureCount}
            </div>
        </div>
    );
}
