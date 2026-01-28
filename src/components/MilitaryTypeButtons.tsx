import { MILITARY_TYPES, MILITARY_LABELS } from "../constants/militaryConstants";
import type { MilitaryType } from "../types/militaryTypes";
import "./MilitaryTypeButtons.css";

interface MilitaryTypeButtonsProps {
    selectedTypes: MilitaryType[];
    onToggleType: (type: MilitaryType) => void;
    onToggleAll: () => void;
    allTypesSelected: boolean;
}

export default function MilitaryTypeButtons({
    selectedTypes,
    onToggleType,
    onToggleAll,
    allTypesSelected,
}: MilitaryTypeButtonsProps) {
    return (
        <div className="type-buttons">
            <div className="type-buttons__label">Typ obiektu wojskowego:</div>
            {MILITARY_TYPES.map((type) => {
                const isActive = selectedTypes.includes(type);
                return (
                    <button
                        key={type}
                        onClick={() => onToggleType(type)}
                        title={MILITARY_LABELS[type] || type}
                        aria-label={MILITARY_LABELS[type] || type}
                        className={`type-buttons__button${isActive ? " type-buttons__button--active" : ""}`}
                    >
                        {MILITARY_LABELS[type] || type}
                    </button>
                );
            })}
            <button
                onClick={onToggleAll}
                title="Pokaż wszystkie warstwy naraz"
                aria-label="Pokaż wszystkie warstwy naraz"
                className={`type-buttons__button type-buttons__button--all${allTypesSelected ? " type-buttons__button--active" : ""
                    }`}
            >
                Pokaż wszystkie warstwy naraz
            </button>
        </div>
    );
}
