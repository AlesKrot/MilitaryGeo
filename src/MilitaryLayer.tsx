// ---- IMPORTY ----
// Dokumentacja React hooków: https://react.dev/reference/react
import { useEffect, useState, useRef } from "react";
// Dokumentacja react-leaflet:
// https://react-leaflet.js.org/docs/start-introduction
import { GeoJSON, useMap } from "react-leaflet";
// Dokumentacja Axios: https://axios-http.com/docs/intro
import axios from "axios";
// Dokumentacja osmtogeojson: https://github.com/tyrasd/osmtogeojson
import osmtogeojson from "osmtogeojson";

import type { MilitaryType, GeoJSONData } from "./types/militaryTypes";
import { MILITARY_TYPES, MILITARY_LABELS } from "./constants/militaryConstants";

// ---- KOMPONENT MilitaryOSMLayer ----
export default function MilitaryOSMLayer() {
    const [selectedTypes, setSelectedTypes] = useState<MilitaryType[]>(["barracks"]);
    const [data, setData] = useState<GeoJSONData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fillOpacity, setFillOpacity] = useState<number>(0.45);
    const [lineWeight, setLineWeight] = useState<number>(6);
    const [layerColor, setLayerColor] = useState<string>("#2600FF");
    const layerRef = useRef<L.GeoJSON | null>(null);
    const map = useMap();

    const allTypesSelected = MILITARY_TYPES.every(type => selectedTypes.includes(type));

    // ---- FUNKCJA POBIERANIA DANYCH ----
    const fetchData = async (types: MilitaryType[]) => {
        setLoading(true);
        setData(null);
        setError(null);

        const typeConditions = types.map(type =>
            `way["military"="${type}"](area.a);\n            relation["military"="${type}"](area.a);`
        ).join('\n            ');

        const query = `
        [out:json][timeout:60];
        area["ISO3166-1"="PL"]->.a;
        (
            ${typeConditions}
        );
        out geom;
        `;

        const requestUrl =
            "https://overpass.kumi.systems/api/interpreter?data=" +
            encodeURIComponent(query);
        try {
            const res = await axios.get(requestUrl);
            console.log("Dane z Overpass:", res.data);

            const geojson = osmtogeojson(res.data);
            console.log("GeoJSON:", geojson);

            setData(geojson);
        } catch (e) {
            console.error("Błąd Overpass:", e);
            setData(null);
            setError("Nie udało się pobrać danych. Sprawdź połączenie z internetem.");
        } finally {
            setLoading(false);
        }
    };

    // ---- useEffect: pobieranie danych ----
    useEffect(() => {
        if (selectedTypes.length > 0) {
            fetchData(selectedTypes);
        }
    }, [selectedTypes]);

    // ---- useEffect: dopasowanie widoku mapy ----
    useEffect(() => {
        if (!data || !layerRef.current) return;
        const bounds = layerRef.current.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { animate: true });
        }
    }, [data, map]);

    // ---- RENDER ----
    return (
        <>
            {/* ---- WIADOMOŚĆ O BŁĘDZIE ---- */}
            {error && (
                <div
                    style={{
                        position: "fixed",
                        top: "20px",
                        right: "20px",
                        zIndex: 99999,
                        background: "rgba(220, 53, 69, 0.95)",
                        color: "white",
                        padding: "15px 20px",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        maxWidth: "400px",
                        fontWeight: "bold",
                    }}
                >
                    ❌ {error}
                </div>
            )}
            {/* ---- LOADER ---- */}
            {loading && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 99999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "24px",
                        fontWeight: "bold",
                    }}
                >
                    Ładowanie: {selectedTypes.map(t => MILITARY_LABELS[t]).join(", ")}
                </div>
            )}
            {/* ---- PRZYCISKI ---- */}
            <div
                style={{
                    position: "absolute",
                    top: "10px",
                    left: "60px",
                    zIndex: 9999,
                    background: "rgba(255,255,255,0.9)",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                }}
            >
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                    Typ obiektu wojskowego:
                </div>
                {MILITARY_TYPES.map((type) => {
                    const isActive = selectedTypes.includes(type);
                    return (
                        <button
                            key={type}
                            onClick={() => {
                                if (isActive) {
                                    setSelectedTypes(prev => prev.filter(t => t !== type));
                                } else {
                                    setSelectedTypes(prev => [...prev, type]);
                                }
                            }}
                            title={MILITARY_LABELS[type] || type}
                            aria-label={MILITARY_LABELS[type] || type}
                            style={{
                                margin: "4px",
                                padding: "6px 10px",
                                borderRadius: "6px",
                                border: "1px solid #555",
                                background: isActive ? "#c62828" : "#eee",
                                color: isActive ? "#fff" : "#000",
                                cursor: "pointer",
                            }}
                        >
                            {MILITARY_LABELS[type] || type}
                        </button>
                    );
                })}
                <button
                    onClick={() => {
                        if (allTypesSelected) {
                            setSelectedTypes(["barracks"]);
                        } else {
                            setSelectedTypes([...MILITARY_TYPES]);
                        }
                    }}
                    title="Pokaż wszystkie warstwy naraz"
                    aria-label="Pokaż wszystkie warstwy naraz"
                    style={{
                        margin: "4px",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "1px solid #555",
                        background: allTypesSelected ? "#c62828" : "#eee",
                        color: allTypesSelected ? "#fff" : "#000",
                        cursor: "pointer",
                        fontWeight: "bold",
                    }}
                >
                    Pokaż wszystkie warstwy naraz
                </button>
            </div>
            {/* ---- Legenda ---- */}
            <div
                style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "10px",
                    zIndex: 9999,
                    background: "rgba(255,255,255,0.9)",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    width: "80vw",
                    maxWidth: "200px",
                }}
            >
                <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
                    Legenda:
                </div>
                <div style={{ fontSize: "14px" }}>
                    <div style={{ marginBottom: "4px" }}>
                        <strong>Typ:</strong> {selectedTypes.map(t => MILITARY_LABELS[t]).join(", ")}
                    </div>
                    <div>
                        <strong>Liczba obiektów:</strong> {data?.features?.length || 0}
                    </div>
                </div>
            </div>
            {/* ---- Styl warstwy ---- */}
            <div
                style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    zIndex: 9999,
                    background: "rgba(255,255,255,0.9)",
                    padding: "10px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    width: "80vw",
                    maxWidth: "200px",
                }}
                onMouseEnter={() => {
                    map.dragging?.disable();
                    map.scrollWheelZoom?.disable();
                    map.doubleClickZoom?.disable();
                    map.boxZoom?.disable();
                }}
                onMouseLeave={() => {
                    map.dragging?.enable();
                    map.scrollWheelZoom?.enable();
                    map.doubleClickZoom?.enable();
                    map.boxZoom?.enable();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
            >
                <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "14px" }}>
                    Styl warstwy:
                </div>
                <div style={{ fontSize: "14px" }}>
                    <div style={{ marginBottom: "8px" }}>
                        <label style={{ display: "block", marginBottom: "4px" }}>
                            <strong>Kolor:</strong>
                        </label>
                        <input
                            type="color"
                            value={layerColor}
                            onChange={(e) => setLayerColor(e.target.value)}
                            style={{ width: "100%", height: "32px", cursor: "pointer" }}
                        />
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                        <label style={{ display: "block", marginBottom: "4px" }}>
                            <strong>Grubość linii:</strong> {lineWeight}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={lineWeight}
                            onChange={(e) => setLineWeight(parseInt(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>
                    <div style={{ marginBottom: "8px" }}>
                        <label style={{ display: "block", marginBottom: "4px" }}>
                            <strong>Przejrzystość:</strong> {fillOpacity.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={fillOpacity}
                            onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>
            </div>
            {/* ---- WARSTWA GEOJSON ---- */}
            {data && (
                <GeoJSON
                    key={selectedTypes.join(",")}
                    data={data}
                    ref={layerRef}
                    style={() => ({
                        color: layerColor,
                        weight: lineWeight,
                        opacity: 1,
                        fillColor: layerColor,
                        fillOpacity: fillOpacity,
                    })}
                />
            )}
        </>
    );
}
