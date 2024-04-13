/** @typedef {object | undefined} EventParams */
/** @callback Callback @param {unknown} data */

/**
 * @typedef {object} EventData
 * @property {Callback} callback
 * @property {EventParams} params
 */

import WebWorker from "./Worker?worker";

class Worker
{
    #worker = new WebWorker();
    /** @type Map<string, EventData> */ #events = new Map();

    constructor()
    {
        this.#worker.onmessage = this.#onMessage.bind(this);
        this.#worker.onerror = this.#onError.bind(this);
    }

    /** @param {MessageEvent} event */
    #onMessage(event)
    {
        const { name, response } = event.data;
        this.#events?.get(name)?.callback?.(response);
    }

    /** @param {ErrorEvent} error */
    #onError(error)
    {
        console.error(error);
    }

    /**
     * @param {string} event
     * @param {Callback} callback
     * @param {EventParams} params
     */
    add(event, callback, params)
    {
        this.#events.set(event, { callback, params });

        return this;
    }

    /** @param {string} event @param {EventParams} params */
    post(event, params)
    {
        const eventParams = this.#events.get(event)?.params;

        this.#worker.postMessage({
            event,
            params:
            {
                ...eventParams,
                ...params
            }
        });

        return this;
    }

    /** @param {string} event */
    remove(event)
    {
        this.#events.delete(event);

        return this;
    }

    dispose()
    {
        this.#worker.terminate();
        this.#events.clear();
    }
}

export default new Worker();
