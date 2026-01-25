import type { SyntheticEvent } from "react";
import { useMap } from "react-leaflet";
import "./StyleControls.css";

interface StyleControlsProps {
    layerColor: string;
    onLayerColorChange: (value: string) => void;
    lineWeight: number;
    onLineWeightChange: (value: number) => void;
    fillOpacity: number;
    onFillOpacityChange: (value: number) => void;
}

export default function StyleControls({
    layerColor,
    onLayerColorChange,
    lineWeight,
    onLineWeightChange,
    fillOpacity,
    onFillOpacityChange,
}: StyleControlsProps) {
    const map = useMap();

    const disableMapInteraction = () => {
        map.dragging?.disable();
        map.scrollWheelZoom?.disable();
        map.doubleClickZoom?.disable();
        map.boxZoom?.disable();
    };

    const enableMapInteraction = () => {
        map.dragging?.enable();
        map.scrollWheelZoom?.enable();
        map.doubleClickZoom?.enable();
        map.boxZoom?.enable();
    };

    const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

    return (
        <div
            className="style-controls"
            onMouseEnter={disableMapInteraction}
            onMouseLeave={enableMapInteraction}
            onMouseDown={stopPropagation}
            onMouseMove={stopPropagation}
            onMouseUp={stopPropagation}
            onClick={stopPropagation}
            onDoubleClick={stopPropagation}
            onWheel={stopPropagation}
        >
            <div className="style-controls__title">Styl warstwy:</div>
            <div className="style-controls__group">
                <label className="style-controls__label">
                    <strong>Kolor:</strong>
                </label>
                <input
                    type="color"
                    value={layerColor}
                    onChange={(e) => onLayerColorChange(e.target.value)}
                    className="style-controls__color"
                />
            </div>
            <div className="style-controls__group">
                <label className="style-controls__label">
                    <strong>Grubość linii:</strong> {lineWeight}
                </label>
                <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={lineWeight}
                    onChange={(e) => onLineWeightChange(Number(e.target.value))}
                    className="style-controls__slider"
                />
            </div>
            <div className="style-controls__group">
                <label className="style-controls__label">
                    <strong>Przejrzystość:</strong> {fillOpacity.toFixed(2)}
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={fillOpacity}
                    onChange={(e) => onFillOpacityChange(Number(e.target.value))}
                    className="style-controls__slider"
                />
            </div>
        </div>
    );
}
