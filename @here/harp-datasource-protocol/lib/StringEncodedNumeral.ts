/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enumeration of supported string encoded numerals.
 */
export enum StringEncodedNumeralType {
    Meters,
    Pixels,
    HexRGB,
    RGB,
    HSL
}

/**
 * Interface containing information about a [[StringEncodedNumeral]] format, component size and
 * evaluation.
 */
export interface StringEncodedNumeralFormat {
    size: number;
    regExp: RegExp;
    decoder: (encodedValue: string) => number[];
}

/**
 * Array of supported [[StringEncodedNumeralFormat]]s (inteded to be indexed with
 * [[StringEncodedNumeralType]] enum).
 */
export const StringEncodedNumeralFormats: StringEncodedNumeralFormat[] = [
    {
        size: 1,
        regExp: /([0-9]{1,})+(m)/,
        decoder: (encodedValue: string) => {
            return [
                Number(
                    StringEncodedNumeralFormats[StringEncodedNumeralType.Meters].regExp.exec(
                        encodedValue
                    )![1]
                )
            ];
        }
    },
    {
        size: 1,
        regExp: /([0-9]{1,})+px/,
        decoder: (encodedValue: string) => {
            return [
                Number(
                    StringEncodedNumeralFormats[StringEncodedNumeralType.Pixels].regExp.exec(
                        encodedValue
                    )![1]
                )
            ];
        }
    },
    {
        size: 3,
        regExp: /#([0-9A-Fa-f]{1,2})([0-9A-Fa-f]{1,2})([0-9A-Fa-f]{1,2})/,
        decoder: (encodedValue: string) => {
            const channels = StringEncodedNumeralFormats[
                StringEncodedNumeralType.HexRGB
            ].regExp.exec(encodedValue)!;
            for (let i = 1; i < channels.length; ++i) {
                if (channels[i].length < 2) {
                    channels[i] = channels[i] + channels[i];
                }
            }
            return rgbToHsl(
                parseInt(channels[1], 16) / 255,
                parseInt(channels[2], 16) / 255,
                parseInt(channels[3], 16) / 255
            );
        }
    },
    {
        size: 3,
        // tslint:disable-next-line:max-line-length
        regExp: /rgb\((?:([0-9]{1,2}|1[0-9]{1,2}|2[0-4][0-9]|25[0-5]), ?)(?:([0-9]{1,2}|1[0-9]{1,2}|2[0-4][0-9]|25[0-5]), ?)(?:([0-9]{1,2}|1[0-9]{1,2}|2[0-4][0-9]|25[0-5]))\)/,
        decoder: (encodedValue: string) => {
            const channels = StringEncodedNumeralFormats[StringEncodedNumeralType.RGB].regExp.exec(
                encodedValue
            )!;
            return rgbToHsl(
                parseInt(channels[1], 10) / 255,
                parseInt(channels[2], 10) / 255,
                parseInt(channels[3], 10) / 255
            );
        }
    },
    {
        size: 3,
        // tslint:disable-next-line:max-line-length
        regExp: /hsl\(((?:[0-9]|[1-9][0-9]|1[0-9]{1,2}|2[0-9]{1,2}|3[0-5][0-9]|360)), ?(?:([0-9]|[1-9][0-9]|100)%), ?(?:([0-9]|[1-9][0-9]|100)%)\)/,
        decoder: (encodedValue: string) => {
            const channels = StringEncodedNumeralFormats[StringEncodedNumeralType.HSL].regExp.exec(
                encodedValue
            )!;
            return [
                parseInt(channels[1], 10) / 360,
                parseInt(channels[2], 10) / 100,
                parseInt(channels[3], 10) / 100
            ];
        }
    }
];

function rgbToHsl(r: number, g: number, b: number): number[] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = l;
    let s = l;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h, s, l];
}
