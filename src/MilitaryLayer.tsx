// ---- IMPORTY ----
// Dokumentacja React hooków: https://react.dev/reference/react
import { useEffect, useState, useRef } from "react";
// Dokumentacja react-leaflet:
// https://react-leaflet.js.org/docs/start-introduction
import { GeoJSON, useMap } from "react-leaflet";
import type { GeoJSON as LeafletGeoJSON } from "leaflet";
// Dokumentacja Axios: https://axios-http.com/docs/intro
import axios from "axios";
// Dokumentacja osmtogeojson: https://github.com/tyrasd/osmtogeojson
import osmtogeojson from "osmtogeojson";

import type { MilitaryType, GeoJSONData } from "./types/militaryTypes";
import { MILITARY_TYPES, MILITARY_LABELS } from "./constants/militaryConstants";
import ErrorToast from "./components/ErrorToast";
import LegendPanel from "./components/LegendPanel";
import LoadingOverlay from "./components/LoadingOverlay";
import MilitaryTypeButtons from "./components/MilitaryTypeButtons";
import StyleControls from "./components/StyleControls";

// ---- KOMPONENT MilitaryOSMLayer ----
export default function MilitaryOSMLayer() {
    const [selectedTypes, setSelectedTypes] = useState<MilitaryType[]>(["barracks"]);
    const [data, setData] = useState<GeoJSONData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [fillOpacity, setFillOpacity] = useState<number>(0.45);
    const [lineWeight, setLineWeight] = useState<number>(6);
    const [layerColor, setLayerColor] = useState<string>("#2600FF");
    const layerRef = useRef<LeafletGeoJSON | null>(null);
    const map = useMap();

    const allTypesSelected = MILITARY_TYPES.every(type => selectedTypes.includes(type));

    const handleToggleType = (type: MilitaryType) => {
        const isActive = selectedTypes.includes(type);
        if (isActive) {
            setSelectedTypes(prev => prev.filter(t => t !== type));
        } else {
            setSelectedTypes(prev => [...prev, type]);
        }
    };

    const handleToggleAll = () => {
        if (allTypesSelected) {
            setSelectedTypes(["barracks"]);
        } else {
            setSelectedTypes([...MILITARY_TYPES]);
        }
    };

    // ---- CACHE (localStorage) ----
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    const makeCacheKey = (types: MilitaryType[]) => {
        const typeKey = [...types].sort().join(",");
        // Scope: country-level (PL). If later we add bbox, extend the key.
        return `overpass:PL:${typeKey}`;
    };

    const loadCache = (key: string): GeoJSONData | null => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            if (!obj || typeof obj !== "object") return null;
            if (Date.now() - obj.timestamp > CACHE_TTL_MS) return null;
            return obj.data as GeoJSONData;
        } catch {
            return null;
        }
    };

    const saveCache = (key: string, data: GeoJSONData) => {
        try {
            localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
        } catch {
            // Ignore storage errors (e.g., quota exceeded)
        }
    };

    // ---- FUNKCJA POBIERANIA DANYCH ----
    const fetchData = async (types: MilitaryType[]) => {
        setLoading(true);
        setData(null);
        setError(null);

        const cacheKey = makeCacheKey(types);
        const cached = loadCache(cacheKey);
        if (cached) {
            setData(cached);
            setLoading(false);
            return;
        }

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

            setData(geojson as GeoJSONData);
            saveCache(cacheKey, geojson as GeoJSONData);
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
            {error && <ErrorToast message={error} />}
            {loading && (
                <LoadingOverlay
                    text={`Ładowanie: ${selectedTypes.map(t => MILITARY_LABELS[t]).join(", ")}`}
                />
            )}
            <MilitaryTypeButtons
                selectedTypes={selectedTypes}
                onToggleType={handleToggleType}
                onToggleAll={handleToggleAll}
                allTypesSelected={allTypesSelected}
            />
            <LegendPanel
                selectedTypes={selectedTypes}
                featureCount={data?.features?.length || 0}
            />
            <StyleControls
                layerColor={layerColor}
                onLayerColorChange={setLayerColor}
                lineWeight={lineWeight}
                onLineWeightChange={setLineWeight}
                fillOpacity={fillOpacity}
                onFillOpacityChange={setFillOpacity}
            />
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
