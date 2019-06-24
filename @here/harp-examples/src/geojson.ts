/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import { StyleSet } from "@here/harp-datasource-protocol";
import { FeaturesDataSource } from "@here/harp-features-datasource";
import { GeoCoordinates } from "@here/harp-geoutils";
import { MapControls, MapControlsUI } from "@here/harp-map-controls";
import { CopyrightInfo, MapView } from "@here/harp-mapview";
import { APIFormat, OmvDataSource } from "@here/harp-omv-datasource";
import { accessToken } from "../config";

/**
 *
 */
export namespace GeoJsonExample {
    const map = createBaseMap();
    map.renderLabels = false;

    setUpFilePicker();

    const featuresDataSource = new FeaturesDataSource();
    map.addDataSource(featuresDataSource).then(() => {
        featuresDataSource.setStyleSet(getStyleSet());
    });

    function getStyleSet(): StyleSet {
        return [
            {
                when: "$geometryType == 'polygon'",
                technique: "fill",
                renderOrder: 10000,
                attr: {
                    color: "#7cf",
                    transparent: true,
                    opacity: 0.8,
                    lineWidth: 1,
                    lineColor: "#003344"
                }
            },
            {
                when: "$geometryType == 'polygon'",
                technique: "solid-line",
                renderOrder: 10001,
                attr: {
                    color: "#8df",
                    metricUnit: "Pixel",
                    lineWidth: 5
                }
            },
            {
                when: "$geometryType == 'point'",
                technique: "circles",
                renderOrder: 10002,
                attr: {
                    size: 10,
                    color: "5ad"
                }
            },
            {
                when: "$geometryType == 'line'",
                technique: "solid-line",
                renderOrder: 10000,
                attr: {
                    color: "#8df",
                    metricUnit: "Pixel",
                    lineWidth: 5
                }
            }
        ];
    }

    function processGeoJsonFile(file: File) {
        const reader = new FileReader();
        reader.onload = () => {
            const geojson = JSON.parse(reader.result as string);
            featuresDataSource.setFromGeojson(geojson);
        };
        if (file.type === "application/geo+json" || file.type === "application/json") {
            reader.readAsBinaryString(file);
        }
    }

    function setUpFilePicker() {
        const input = document.getElementById("input") as HTMLInputElement;
        input.addEventListener("change", e => {
            const file = input.files![0];
            processGeoJsonFile(file);
        });

        const overlay = document.getElementById("drag-overlay") as HTMLDivElement;
        window.addEventListener("dragover", e => {
            e.preventDefault();
            overlay.style.display = "block";
        });
        const removeOverlay = (e: any) => {
            e.preventDefault();
            overlay.style.display = "none";
        };
        overlay.addEventListener("dragleave", removeOverlay);
        overlay.addEventListener("dragend", removeOverlay);
        overlay.addEventListener("dragexit", removeOverlay);
        overlay.addEventListener(
            "drop",
            e => {
                removeOverlay(e);
                const file = e.dataTransfer!.files[0];
                processGeoJsonFile(file);
            },
            false
        );
    }

    function getExampleHTML(): string {
        return `
            <style>
                #mapCanvas{
                    top:0
                }
                #drag-overlay{
                    position:absolute;
                    width:100%;
                    height: 100%;
                    background: rgba(0,0,0,0.5);
                    display:none
                }
                #drag-dashes{
                    --border-thickness: 9px;
                    --margin:70px;
                    position:absolute;
                    width:calc(100% - var(--margin) * 2 - var(--border-thickness) * 2);
                    height:calc(100% - var(--margin) * 2 - var(--border-thickness) * 2);
                    top:var(--margin);
                    left:var(--margin);
                    border: dashed var(--border-thickness) #fff;
                    border-radius: 25px;
                }
                #info{
                    color: #fff;
                    width: 80%;
                    text-align: center;
                    font-family: monospace;
                    left: 50%;
                    position: relative;
                    margin: 10px 0 0 -40%;
                    font-size: 15px;
                }
            </style>
            <div id="drag-overlay">
                <div id="drag-dashes"></div>
            </div>
            <p id=info>Drag and drop a geojson file or browse a local one.
            <input type=file id="input">
            </p>
        `;
    }

    function createBaseMap(): MapView {
        document.body.innerHTML += getExampleHTML();

        const canvas = document.getElementById("mapCanvas") as HTMLCanvasElement;
        const mapView = new MapView({
            canvas,
            theme: "resources/berlin_tilezen_night_reduced.json"
        });
        mapView.setCameraGeolocationAndZoom(new GeoCoordinates(30, 0), 2.6);

        const controls = new MapControls(mapView);
        const ui = new MapControlsUI(controls);
        canvas.parentElement!.appendChild(ui.domElement);

        window.addEventListener("resize", () => mapView.resize(innerWidth, innerHeight));

        const hereCopyrightInfo: CopyrightInfo = {
            id: "here.com",
            year: new Date().getFullYear(),
            label: "HERE",
            link: "https://legal.here.com/terms"
        };
        const copyrights: CopyrightInfo[] = [hereCopyrightInfo];

        const baseMap = new OmvDataSource({
            baseUrl: "https://xyz.api.here.com/tiles/herebase.02",
            apiFormat: APIFormat.XYZOMV,
            styleSetName: "tilezen",
            maxZoomLevel: 17,
            authenticationCode: accessToken,
            copyrightInfo: copyrights
        });
        mapView.addDataSource(baseMap);

        return mapView;
    }
}
