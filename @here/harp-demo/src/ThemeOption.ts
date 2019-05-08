/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { Theme } from "@here/harp-datasource-protocol";
import { ThemeLoader } from "@here/harp-mapview";
import { applyToMapView } from "./MapViewHandler";
import { SelectItem, SelectOption } from "./Options";

export type DatasourceDefinition = SelectItem<Theme>;

export const berlinTilezenBase: DatasourceDefinition = {
    tag: "berlin-base-day",
    label: "Berlin Base Day / Tilezen",\
    value: () => {
        return ThemeLoader.loadAsync("resources/berlin_base_day.json");
    }
};

export const berlinTilezenReducedDay: DatasourceDefinition = {
    tag: "berlin-reduced-day",
    label: "Berlin Reduced Day / Tilezen",
    value: () => {
        return ThemeLoader.loadAsync("resources/berlin_tilezen_day_reduced.json");
    }
};

export const berlinTilezenReducedNight: DatasourceDefinition = {
    tag: "berlin-reduced-night",
    label: "Berlin Reduced Day / Tilezen",
    value: () => {
        return ThemeLoader.loadAsync("resources/berlin_tilezen_night_reduced.json");
    }
};

export const themeOption: SelectOption<Theme> = {
    type: "select-item",
    name: "theme",
    label: "BaseMap Theme",
    initialValue: berlinTilezenBase,
    values: [
        berlinTilezenBase,
        berlinTilezenReducedDay,
        berlinTilezenReducedNight
    ],
    apply(newValue: Theme) {
        applyToMapView(mapView => {
            mapView.theme = newValue;
        });
    }
}
