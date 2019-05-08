/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSource } from "@here/harp-mapview";
import { APIFormat, OmvDataSource } from "@here/harp-omv-datasource";
import { WebTileDataSource } from "@here/harp-webtile-datasource";
import { accessToken, appCode, appId } from "../config";
import { applyToMapView } from "./MapViewHandler";
import { SelectItem, SelectOption } from "./Options";

export type DatasourceDefinition = SelectItem<DataSource>;

export const xyzHereDataSource: DatasourceDefinition = {
    tag: "omv-xyz-herebase",
    label: "OMV XYZ/Here",
    value: () => {
        return new OmvDataSource({
            baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
            apiFormat: APIFormat.XYZOMV,
            styleSetName: "tilezen",
            maxZoomLevel: 17,
            authenticationCode: accessToken
        });
    }
};

export const xyzOpenstreetMapDataSource: DatasourceDefinition = {
    tag: "omv-xyz-osmbase",
    label: "OMV XYZ/OpenstreetMap",
    value: () => {
        return new OmvDataSource({
            baseUrl: "https://xyz.api.here.com/tiles/osmbase/512/all",
            apiFormat: APIFormat.XYZMVT,
            styleSetName: "tilezen",
            maxZoomLevel: 17,
            authenticationCode: accessToken
        });
    }
};

export const hereWebTileDataSource: DatasourceDefinition = {
    tag: "webtile-base",
    label: "HERE Webtile",
    value: () => {
        return new WebTileDataSource({
            appId,
            appCode,
            ppi: 320
        });
    }
};

export const hereWebTileSatelliteDataSource: DatasourceDefinition = {
    tag: "webtile-satellite",
    label: "HERE Webtile",
    value: () => {
        return new WebTileDataSource({
            appId,
            appCode,
            tileBaseAddress: WebTileDataSource.TILE_AERIAL_SATELLITE
        });
    }
};

export const baseMapDataSourceOption: SelectOption<DataSource> = {
    type: "select-item",
    name: "baseMap",
    label: "BaseMap Datasource",
    initialValue: xyzHereDataSource,
    values: [
        xyzHereDataSource,
        xyzOpenstreetMapDataSource,
        hereWebTileDataSource
    ],
    apply(newValue: DataSource, oldValue: DataSource | undefined) {
        applyToMapView(mapView => {
            if (oldValue !== undefined) {
                mapView.removeDataSource(oldValue);
            }
            if (newValue) {
                mapView.addDataSource(newValue);
            }
        })
    }
}
