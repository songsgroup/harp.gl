/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import { MathUtils } from "@here/harp-geoutils";
import { CubicInterpolant, DiscreteInterpolant, LinearInterpolant } from "three";

import { ExponentialInterpolant } from "./ExponentialInterpolant";
import { StringEncodedNumeralFormats, StringEncodedNumeralType } from "./StringEncodedNumeral";

import {
    InterpolatedProperty,
    InterpolatedPropertyDefinition,
    InterpolationMode,
    MaybeInterpolatedProperty
} from "./InterpolatedPropertyDefs";

import { color, length } from "./TechniqueParams";

const interpolants = [
    DiscreteInterpolant,
    LinearInterpolant,
    CubicInterpolant,
    ExponentialInterpolant
];

/**
 * Checks if a property is interpolated.
 * @param p property to be checked
 */
export function isInterpolatedPropertyDefinition<T>(
    p: any
): p is InterpolatedPropertyDefinition<T> {
    if (
        p !== undefined &&
        p.values instanceof Array &&
        p.values.length > 0 &&
        p.values[0] !== undefined &&
        p.zoomLevels instanceof Array &&
        p.zoomLevels.length > 0 &&
        p.zoomLevels[0] !== undefined &&
        p.values.length === p.zoomLevels.length
    ) {
        return true;
    }
    return false;
}

/**
 * Type guard to check if an object is an instance of `InterpolatedProperty`.
 */
export function isInterpolatedProperty<T>(p: any): p is InterpolatedProperty<T> {
    if (
        p !== undefined &&
        p.interpolationMode !== undefined &&
        p.zoomLevels !== undefined &&
        p.values !== undefined &&
        p.values.length > 0 &&
        (p.zoomLevels.length === p.values.length / 3 || p.zoomLevels.length === p.values.length)
    ) {
        return true;
    }
    return false;
}

/**
 * Get the value of the specified property at the given zoom level, represented as a `number` value.
 *
 * @param property Property of a technique.
 * @param level Display level the property should be rendered at.
 * @param pixelToMeters Optional pixels to meters conversion factor (needed for proper
 * interpolation of `length` values).
 *
 */
export function getPropertyValue<T>(
    property: InterpolatedProperty<T> | MaybeInterpolatedProperty<T>,
    level: number,
    pixelToMeters: number = 1.0
): number {
    if (isInterpolatedPropertyDefinition<T>(property)) {
        throw new Error("Cannot interpolate a InterpolatedPropertyDefinition.");
    } else if (!isInterpolatedProperty(property)) {
        if (typeof property !== "string") {
            return (property as unknown) as number;
        } else {
            if (
                StringEncodedNumeralFormats[StringEncodedNumeralType.Meters].regExp.test(property)
            ) {
                return StringEncodedNumeralFormats[StringEncodedNumeralType.Meters].decoder(
                    property
                )[0];
            } else if (
                StringEncodedNumeralFormats[StringEncodedNumeralType.Pixels].regExp.test(property)
            ) {
                return (
                    StringEncodedNumeralFormats[StringEncodedNumeralType.Pixels].decoder(
                        property
                    )[0] * pixelToMeters
                );
            } else {
                for (
                    let i = StringEncodedNumeralType.HexRGB;
                    i <= StringEncodedNumeralType.HSL;
                    ++i
                ) {
                    if (StringEncodedNumeralFormats[i].regExp.test(property)) {
                        const hslValues = StringEncodedNumeralFormats[i].decoder(property);
                        const rgbValues = hslToRGB(hslValues[0], hslValues[1], hslValues[2]);
                        let result = "0x";
                        for (const value of rgbValues) {
                            // tslint:disable:no-bitwise
                            result += (
                                "0" + ((MathUtils.clamp(value, 0, 1) * 255) | 0).toString(16)
                            ).slice(-2);
                        }
                        return parseInt(result, 16);
                    }
                }
            }
            throw new Error(`No StringEncodedNumeralFormat matched ${property}.`);
        }
    } else if (property._stringEncodedNumeralType !== undefined) {
        if (
            property._stringEncodedNumeralType === StringEncodedNumeralType.Meters ||
            property._stringEncodedNumeralType === StringEncodedNumeralType.Pixels
        ) {
            return getInterpolatedLength(property, level, pixelToMeters);
        } else {
            return getInterpolatedColor(property, level);
        }
    }
    return getInterpolatedLength(property, level, pixelToMeters);
}

function getInterpolatedLength(
    property: InterpolatedProperty<length>,
    level: number,
    pixelToMeters: number
): number {
    const nChannels = property.values.length / property.zoomLevels.length;
    const interpolant = new interpolants[property.interpolationMode](
        property.zoomLevels,
        property.values,
        nChannels
    );
    if (
        property.interpolationMode === InterpolationMode.Exponential &&
        property.exponent !== undefined
    ) {
        (interpolant as ExponentialInterpolant).exponent = property.exponent;
    }
    interpolant.evaluate(level);

    if (property._stringEncodedNumeralDynamicMask === undefined) {
        return interpolant.resultBuffer[0];
    } else {
        const maskInterpolant = new interpolants[property.interpolationMode](
            property.zoomLevels,
            property._stringEncodedNumeralDynamicMask,
            1
        );
        if (
            property.interpolationMode === InterpolationMode.Exponential &&
            property.exponent !== undefined
        ) {
            (maskInterpolant as ExponentialInterpolant).exponent = property.exponent;
        }
        maskInterpolant.evaluate(level);

        return (
            interpolant.resultBuffer[0] * (1 - maskInterpolant.resultBuffer[0]) +
            interpolant.resultBuffer[0] * pixelToMeters * maskInterpolant.resultBuffer[0]
        );
    }
}

function getInterpolatedColor(property: InterpolatedProperty<color>, level: number): number {
    const nChannels = property.values.length / property.zoomLevels.length;
    const interpolant = new interpolants[property.interpolationMode](
        property.zoomLevels,
        property.values,
        nChannels
    );
    if (
        property.interpolationMode === InterpolationMode.Exponential &&
        property.exponent !== undefined
    ) {
        (interpolant as ExponentialInterpolant).exponent = property.exponent;
    }
    interpolant.evaluate(level);

    const rgbValues = hslToRGB(
        interpolant.resultBuffer[0],
        interpolant.resultBuffer[1],
        interpolant.resultBuffer[2]
    );
    let result = "0x";
    for (const value of rgbValues) {
        // tslint:disable:no-bitwise
        result += ("0" + Math.round(MathUtils.clamp(value, 0, 1) * 255).toString(16)).slice(-2);
    }
    return parseInt(result, 16);
}

function hslToRGB(h: number, s: number, l: number): number[] {
    let r = 0;
    let g = 0;
    let b = 0;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToTGB(p, q, h + 1 / 3);
        g = hueToTGB(p, q, h);
        b = hueToTGB(p, q, h - 1 / 3);
    }

    return [r, g, b];
}

function hueToTGB(p: number, q: number, t: number): number {
    if (t < 0) {
        t += 1;
    }
    if (t > 1) {
        t -= 1;
    }
    if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
        return q;
    }
    if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
}
