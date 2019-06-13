/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import { GeometryKind, GeometryKindSet } from "@here/harp-datasource-protocol";

import { MapView } from "../MapView";
import { Tile } from "../Tile";
import { Phase, PhasedTileGeometryLoader } from "./PhasedTileGeometryLoader";
import { TileGeometryManagerBase } from "./TileGeometryManager";

/**
 * The default phases to load geometry.
 */
const DefaultPhases: Phase[] = [
    [GeometryKind.Background, GeometryKind.Terrain, GeometryKind.Area, GeometryKind.Border],
    [GeometryKind.Line],
    [GeometryKind.Building],
    [GeometryKind.Label],
    [GeometryKind.All]
];

// FIXME: This should (always) be the first phase, no?
const DefaultBasicGeometryKinds: GeometryKindSet = new GeometryKindSet(DefaultPhases[0]);

/**
 * Manages the loading of [[Tile]] geometry in phases.
 */
export class PhasedTileGeometryManager extends TileGeometryManagerBase {
    private m_maxUpdatedTilePerFrame = 5;
    private m_loadPhaseDefinitions: Phase[] = DefaultPhases;
    private m_basicGeometryKinds: GeometryKindSet = DefaultBasicGeometryKinds;

    /**
     * Creates an instance of PhasedTileGeometryManager. Keeps the reference to the [[MapView]].
     *
     * @param {MapView} mapView
     */
    constructor(mapView: MapView) {
        super(mapView);
    }

    initTile(tile: Tile): void {
        tile.tileGeometryLoader = new PhasedTileGeometryLoader(
            tile,
            this.m_loadPhaseDefinitions,
            this.m_basicGeometryKinds
        );
    }

    updateTiles(tiles: Tile[]): void {
        if (this.mapView.isDynamicFrame) {
            this.updateAllTiles(tiles);
        } else {
            this.updateTilesTogether(tiles);
        }

        this.updateTileObjectVisibility(tiles);

        if (!this.checkTilesFinished(tiles)) {
            this.mapView.update();
        }
    }

    private checkTilesFinished(tiles: Tile[]): boolean {
        for (const tile of tiles) {
            const phasedGeometryLoader = tile.tileGeometryLoader as PhasedTileGeometryLoader;
            if (phasedGeometryLoader !== undefined && !phasedGeometryLoader.allGeometryLoaded) {
                return false;
            }
        }
        return true;
    }

    private updateAllTiles(tiles: Tile[]) {
        let numTilesUpdated = 0;
        for (const tile of tiles) {
            const phasedGeometryLoader = tile.tileGeometryLoader as PhasedTileGeometryLoader;

            if (
                phasedGeometryLoader !== undefined &&
                phasedGeometryLoader.update(
                    this.enableFilterByKind ? this.enabledGeometryKinds : undefined,
                    this.enableFilterByKind ? this.disabledGeometryKinds : undefined
                )
            ) {
                numTilesUpdated++;
                if (
                    this.m_maxUpdatedTilePerFrame > 0 &&
                    numTilesUpdated >= this.m_maxUpdatedTilePerFrame &&
                    tile.mapView.isDynamicFrame
                ) {
                    break;
                }
            }
        }
    }

    private updateTilesTogether(tiles: Tile[]): void {
        let lowestPhase: number | undefined;

        for (const tile of tiles) {
            const phasedGeometryLoader = tile.tileGeometryLoader as PhasedTileGeometryLoader;

            if (
                phasedGeometryLoader !== undefined &&
                (lowestPhase === undefined || phasedGeometryLoader.currentPhase < lowestPhase)
            ) {
                lowestPhase = phasedGeometryLoader.currentPhase;
            }
        }

        if (lowestPhase !== undefined && lowestPhase < this.m_loadPhaseDefinitions.length) {
            const nextPhase = lowestPhase + 1;
            this.updateTilesIfNeeded(tiles, nextPhase);
        }
    }

    private updateTilesIfNeeded(tiles: Tile[], toPhase: number) {
        let numTilesUpdated = 0;
        for (const tile of tiles) {
            const phasedGeometryLoader = tile.tileGeometryLoader as PhasedTileGeometryLoader;
            if (
                phasedGeometryLoader !== undefined &&
                phasedGeometryLoader.updateToPhase(
                    toPhase,
                    this.enableFilterByKind ? this.enabledGeometryKinds : undefined,
                    this.enableFilterByKind ? this.disabledGeometryKinds : undefined
                )
            ) {
                numTilesUpdated++;
                if (
                    tile.mapView.isDynamicFrame &&
                    this.m_maxUpdatedTilePerFrame > 0 &&
                    numTilesUpdated >= this.m_maxUpdatedTilePerFrame
                ) {
                    break;
                }
            }
        }
    }
}
