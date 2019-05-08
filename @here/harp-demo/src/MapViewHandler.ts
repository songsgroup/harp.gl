
/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapView } from "@here/harp-mapview";

export let globalMapViews: MapView[] = [];

export function applyToMapView(fun: (mapView: MapView) => void) {
    for (const mapView of globalMapViews) {
        fun(mapView);
    }

}
