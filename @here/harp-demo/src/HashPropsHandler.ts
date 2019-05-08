/*
 * Copyright (C) 2017-2019 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */

import THREE = require("three");

export interface BasicProps {
    [name: string]: number | string | boolean | BasicProps;
}

export class HashPropsHandler<P extends BasicProps = {}> extends THREE.EventDispatcher{
    private m_lastHash?: string;

    constructor(readonly defaults: P) {
        super();

        window.addEventListener("hashchange", this.onGlobalHashChange);

        setTimeout(() => {
            this.updatePropsFromHash(window.location.hash);
        }, 0);
    }

    /**
     * Called, when app internal state has changed and hash have to be updated.
     */
    setProps(newProps: P) {
        const completeProps = { ...this.defaults, ...newProps };
        const customizedProps: Partial<P> = {};
        for (const propName in completeProps) {
            if (this.defaults[propName] !== completeProps[propName]) {
                customizedProps[propName] = completeProps[propName];
            }
        }
        const params = Object.keys(customizedProps).map(propName => {
            // TODO: proper to string
            const value = "" + customizedProps[propName];
            return `${encodeURIComponent(propName)}=${encodeURIComponent(value)}`;
        }).join('/');
        const newHash = params ? '#' + params : '';
        if (newHash !== this.m_lastHash) {
            this.m_lastHash = newHash;
            window.location.hash = newHash;
        }
    }

    /**
     * Called, when we observe new `hash` value.
     */
    updatePropsFromHash(hash: string) {
        if (this.m_lastHash === hash) {
            return;
        }

        const params = hash.substr(1);


        const newProps = params
            .split("/")
            .map(item => item.split("=").map(decodeURIComponent))
            .reduce(
                (r, nameValue) => {
                    const name = nameValue[0];
                    const value = nameValue[1];

                    r[name] = value;
                    return r;
                },
                // tslint:disable-next-line:no-object-literal-type-assertion
                {} as { [name: string]: string }
            );

        const completeProps = { ...this.defaults, ...newProps };
        this.dispatchEvent({type: 'hash-props-updated', newProps: completeProps});
        this.m_lastHash = hash;
    }


    private onGlobalHashChange = () => {
        this.updatePropsFromHash(window.location.hash);
    };
}
