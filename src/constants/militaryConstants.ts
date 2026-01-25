import type { MilitaryType } from "../types/militaryTypes";

export const MILITARY_TYPES: MilitaryType[] = [
    "barracks",
    "naval_base",
    "airfield",
    "training_area",
    "range",
    "primary",
    "office",
    "danger_area",
    "shelter",
    "bunker",
];

export const MILITARY_LABELS: Record<MilitaryType, string> = {
    barracks: "Koszary",
    naval_base: "Baza morska",
    airfield: "Lotnisko wojskowe",
    training_area: "Obszar szkoleniowy",
    range: "Strzelnica",
    primary: "Obiekt strategiczny",
    office: "Biuro wojskowe",
    danger_area: "Obszar niebezpieczny",
    shelter: "Schron",
    bunker: "Bunkier",
    all: "Wszystkie warstwy",
};
