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

// ---- TYPY ----
type MilitaryType =
    | "barracks"
    | "naval_base"
    | "airfield"
    | "training_area"
    | "range"
    | "primary"
    | "office"
    | "danger_area"
    | "shelter"
    | "bunker";

// Typ danych GeoJSON. Poczytaj o GeoJSON: https://geojson.org/
// type GeoJSONData = GeoJSOND.FeatureCollection;

type GeoJSONData = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: any;
        properties: any;
    }>;
};

// ---- LISTA TYPÓW ----
const MILITARY_TYPES: MilitaryType[] = [
    "barracks",
    "naval_base",
    "airfield",
    "training_area",
    "range",
    "primary",
    "office",
    "danger_area",
    "shelter",
    "bunker"
];

// ---- ETYKIETY ----
const MILITARY_LABELS: Record<MilitaryType, string> = {
    barracks: "Koszary",
    naval_base: "Baza morska",
    airfield: "Lotnisko wojskowe",
    training_area: "Obszar szkoleniowy",
    range: "Strzelnica",
    primary: "Obiekt strategiczny",
    office: "Biuro wojskowe",
    danger_area: "Obszar niebezpieczny",
    shelter: "Schron",
    bunker: "Bunkier"
};

// ---- KOMPONENT MilitaryOSMLayer ----
export default function MilitaryOSMLayer() {
    const [militaryType, setMilitaryType] =
        useState<MilitaryType>("barracks");
    const [data, setData] = useState<GeoJSONData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    // TODO: Sprawdź w dokumentacji Leaflet co można zrobić z ref: https://leafletjs.com/reference.html#geojson
    const layerRef = useRef<L.GeoJSON | null>(null);
    const map = useMap();

    // ---- FUNKCJA POBIERANIA DANYCH ----
    const fetchData = async (type: MilitaryType) => {
        setLoading(true);
        setData(null);
        setError(null);
        const query = `
        [out:json][timeout:60];
        area["ISO3166-1"="PL"]->.a;
        (
            way["military"="${type}"](area.a);
            relation["military"="${type}"](area.a);
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
        fetchData(militaryType);
    }, [militaryType]);
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
                    Ładowanie: {MILITARY_LABELS[militaryType]}
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
                    width: "80vw",
                }}
            >
                <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
                    Typ obiektu wojskowego:
                </div>
                {/* TODO: Dodaj tooltipy (podpowiedzi) do przycisków */}
                {MILITARY_TYPES.map((type) => (
                    <button
                        key={type}
                        onClick={() => setMilitaryType(type)}
                        title={MILITARY_LABELS[type] || type}
                        aria-label={MILITARY_LABELS[type] || type}
                        style={{
                            margin: "4px",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #555",
                            background: type === militaryType ? "#c62828" : "#eee",
                            color: type === militaryType ? "#fff" : "#000",
                            cursor: "pointer",
                        }}
                    >
                        {MILITARY_LABELS[type] || type}
                    </button>
                ))}
            </div>
            {/* ---- WARSTWA GEOJSON ---- */}
            {data && (
                <GeoJSON
                    key={militaryType}
                    data={data}
                    ref={layerRef}
                    style={() => ({
                        color: "#2600FFFF",
                        weight: 6,
                        opacity: 1,
                        fillColor: "#2600FFFF",
                        fillOpacity: 0.45,
                    })}
                />
            )}
        </>
    );
}