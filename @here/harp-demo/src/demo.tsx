/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import * as ReactDOM from "react-dom";

import { GeoCoordinates } from "@here/harp-geoutils";
import { MapControls, MapControlsUI } from "@here/harp-map-controls";
import {
    CopyrightElementHandler,
    CopyrightInfo,
    MapView,
    MapViewEventNames
} from "@here/harp-mapview";

import { xyzHereDataSource } from "./DataSourceOption";
import { BasicProps, HashPropsHandler } from "./HashPropsHandler";
import { globalMapViews, applyToMapView } from "./MapViewHandler";
import { berlinTilezenBase } from "./ThemeOption";
import { NumberOption } from "./Options";

export const copyrights: CopyrightInfo[] = [
    {
        id: "openstreetmap.org",
        label: "OpenStreetMap contributors",
        link: "https://www.openstreetmap.org/copyright"
    },
    {
        // http://openstreetmapdata.com/info/license says that this data is actually OSM data and
        // lands under same label
        id: "openstreetmapdata.com",
        label: "OpenStreetMap contributors",
        link: "https://www.openstreetmap.org/copyright"
    },
    {
        // Data from Natural Eartth doesn't require attribution, but it's just
        // example how to show it
        id: "naturalearthdata.com",
        label: "Natural Earth",
        link: "https://www.naturalearthdata.com/about/terms-of-use/"
    },
    {
        id: "here.com",
        year: new Date().getFullYear(),
        label: "HERE",
        link: "https://legal.here.com/terms"
    }
];

function initializeMapView(id: string): MapView {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    const map = new MapView({
        canvas,
        theme: "resources/berlin_tilezen_base.json"
    });

    CopyrightElementHandler.install("copyrightNotice", map).setDefaults(copyrights);

    map.setCameraGeolocationAndZoom(new GeoCoordinates(40.6935, -74.009), 16.9);

    const mapControls = new MapControls(map);
    mapControls.maxPitchAngle = 50;
    mapControls.setRotation(6.3, 50);

    const ui = new MapControlsUI(mapControls);
    canvas.parentElement!.appendChild(ui.domElement);

    map.resize(window.innerWidth, window.innerHeight);

    window.addEventListener("resize", () => {
        map.resize(window.innerWidth, window.innerHeight);
    });

    return map;
}

const globalMapView = initializeMapView("mapCanvas");
globalMapViews.push(globalMapView);

interface DemoAppState extends BasicProps {
    latitude: number;
    longitude: number;
    zoom: number;
    baseMap: string;
    theme: string;
}


export const latitudeOption: NumberOption = {
    type: "number",
    name: "latitude",
    label: "Latitude",
    initialValue: 40.6935,
    constraints: { min: -90, max: 90 },
    apply(newValue: number) {
        applyToMapView(mapView => {
            const currentLocation = mapView.geoCenter;
            const newLocation = new GeoCoordinates(newValue, currentLocation.longitude);
            mapView.geoCenter = newLocation;
        });
    }
};

export const longitudeOption: NumberOption = {
    type: "number",
    name: "longitide",
    label: "Longitude",
    initialValue: -74.009,
    constraints: { min: -180, max: 180 },
    apply(newValue: number) {
        applyToMapView(mapView => {
            const currentLocation = mapView.geoCenter;
            const newLocation = new GeoCoordinates(currentLocation.latitude, newValue);
            mapView.geoCenter = newLocation;
        });
    }
};

export const zoomLevelOption: NumberOption = {
    type: "number",
    name: "longitide",
    label: "Longitude",
    initialValue: 16.9,
    constraints: { min: 1, max: 20 },
    apply(newValue: number) {
        applyToMapView(mapView => {
            mapView.setCameraGeolocationAndZoom(mapView.geoCenter, newValue);
        });
    }
};

const demoAppDefaults: DemoAppState = {
    latitude: 40.6935,
    longitude: -74.009,
    zoom: 16.9,
    baseMap: xyzHereDataSource.tag,
    theme: berlinTilezenBase.tag
};

const hashPropsHandler = new HashPropsHandler(demoAppDefaults);

class DemoApp extends React.Component<{}, DemoAppState> {
    constructor() {
        super({});
        this.state = { ...demoAppDefaults };

        hashPropsHandler.addEventListener("hash-props-updated", this.onHashPropsUpdated);
        mapView.addEventListener(MapViewEventNames.MovementFinished, this.onCameraMovementFinished);
    }

    onCameraMovementFinished = () => {
        const geoCenter = globalMapView.geoCenter;
        this.setState({
            latitude: geoCenter.latitude,
            longitude: geoCenter.longitude,
            zoom: globalMapView.zoomLevel
        });
        hashPropsHandler.setProps(this.state);
    };

    onHashPropsUpdated = (event: any) => {
        // tslint:disable-next-line:no-console
        console.log("onHashPropsUpdated", event.newProps);
        //const newProps: DemoAppState = event.newProps;
        //this.setState(newProps);
    };

    componentWillUnmount() {
        globalMapView.removeEventListener(
            MapViewEventNames.MovementFinished,
            this.onCameraMovementFinished
        );
    }
    componentDidUpdate(prevProps: any, prevState: DemoAppState) {}

    render() {
        return <div />;
    }
}

ReactDOM.render(<DemoApp />, document.getElementById("app"));
