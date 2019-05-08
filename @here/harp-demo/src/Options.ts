/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 *
 */


 export interface BaseOption {
     /**
      * Type of option, so UI knows how to render it.
      */
     type: string; // type of option

     /**
      * Name of property, used in code for this option.
      */
     name: string;

     /**
      * Label to be used in UI.
      */
     label: string;

     /**
      * Possibility to group options in UI.
      */
     suboptions?: Array<Option<any>>;
 }
/**
 * Item in select list.
 */
export interface SelectItem<T> {
    label?: string;
    tag: string;
    value: T | (() => T) | (() => Promise<T>);

    suboptions?: Array<Option<any>>;
}


/**
 * Metadata for drop-down / combobox / list type of option.
 */
export interface SelectOption<T> extends BaseOption {
    type: 'select-item';
    initialValue?: SelectItem<T>;
    values: Array<SelectItem<T>>;
    apply(newValue: T | undefined, oldValue: T | undefined): void;
}


/**
 * Metadata for drop-down / combobox / list type of option.
 */
export interface FreeTextOption extends BaseOption {
    type: 'text';
    initialValue: string;
    constraints?:
        { min?: number, step?: number, max?: number } |
        number[];
    apply(newValue: string, oldValue: string): void;
}

/**
 * Metadata for drop-down / combobox / list type of option.
 */
export interface NumberOption extends BaseOption {
    type: 'number';
    initialValue: number;
    constraints?:
        { min?: number, step?: number, max?: number } |
        number[];
    apply(newValue: number, oldValue: number | undefined): void;
}

export type Option<T> = SelectOption<T> | FreeTextOption | NumberOption;
