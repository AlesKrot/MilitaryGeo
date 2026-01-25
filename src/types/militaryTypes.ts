export type MilitaryType =
    | "barracks"
    | "naval_base"
    | "airfield"
    | "training_area"
    | "range"
    | "primary"
    | "office"
    | "danger_area"
    | "shelter"
    | "bunker"
    | "all";

export type GeoJSONData = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        geometry: any;
        properties: any;
    }>;
};
