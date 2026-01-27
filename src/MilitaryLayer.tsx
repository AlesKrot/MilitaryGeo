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
    const [layerVersion, setLayerVersion] = useState(0);
    const layerRef = useRef<LeafletGeoJSON | null>(null);
    const fetchIdRef = useRef(0);
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

    // ---- LOKALNE ZAPISANE DANE (offline) ----
    const LOCAL_DATA_BASE = "/data";

    const fetchLocalData = async (types: MilitaryType[]): Promise<GeoJSONData | null> => {
        const collections = await Promise.all(
            types.map(async type => {
                try {
                    const res = await fetch(`${LOCAL_DATA_BASE}/${type}.json`);
                    if (!res.ok) return null;
                    const json = await res.json();
                    if (json?.type === "FeatureCollection" && Array.isArray(json.features)) {
                        return json as GeoJSONData;
                    }
                    return null;
                } catch {
                    return null;
                }
            })
        );

        const mergedFeatures = collections.flatMap(collection => collection?.features || []);
        if (!mergedFeatures.length) return null;

        return {
            type: "FeatureCollection",
            features: mergedFeatures,
        } satisfies GeoJSONData;
    };

    // ---- FUNKCJA POBIERANIA DANYCH ----
    const fetchData = async (types: MilitaryType[]) => {
        const fetchId = ++fetchIdRef.current; // ensure stale responses do not overwrite new state
        setLoading(true);
        setData(null);
        setError(null);

        const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

        const cacheKey = makeCacheKey(types);
        const cached = loadCache(cacheKey);
        if (cached) {
            if (fetchId === fetchIdRef.current) {
                setData(cached);
                setLayerVersion(v => v + 1);
                setLoading(false);
            }
            return;
        }

        let onlineData: GeoJSONData | null = null;

        // ---- PROBA ONLINE (Overpass) ----
        if (isOnline) {
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

                onlineData = geojson as GeoJSONData;
            } catch (e) {
                console.error("Błąd Overpass:", e);
            }
        }

        // ---- PROBA OFFLINE (lokalne pliki) ----
        if (!onlineData) {
            const localData = await fetchLocalData(types);
            if (localData) {
                if (fetchId === fetchIdRef.current) {
                    setData(localData);
                    setLayerVersion(v => v + 1);
                    saveCache(cacheKey, localData);
                    if (isOnline) {
                        setError("Korzystam z zapisanych plików, bo nie udało się pobrać świeżych danych.");
                    }
                    setLoading(false);
                }
                return;
            }
        }

        if (!onlineData) {
            if (fetchId === fetchIdRef.current) {
                setData(null);
                setError("Nie udało się pobrać danych ani wczytać zapisanych plików.");
                setLoading(false);
            }
            return;
        }

        if (fetchId === fetchIdRef.current) {
            setData(onlineData);
            setLayerVersion(v => v + 1);
            saveCache(cacheKey, onlineData);
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
                    key={layerVersion}
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
