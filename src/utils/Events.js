/**
 * @callback Callback
 * @param {Event} event
 */

class Event extends CustomEvent
{
    data;
}

class EventEmitter
{
    #target = new EventTarget();
    /** @type {Map<string, Event>} */ #events = new Map();
    /** @type {Map<string, Callback[]>} */ #callbacks = new Map();

    /** @param {string} name @param {Callback} callback */
    add(name, callback)
    {
        const callbacks = this.#callbacks.get(name);

        callbacks
            ? callbacks.push(callback)
            : this.#callbacks.set(name, [callback]);

        this.#events.set(name, new Event(name));
        this.#target.addEventListener(name, callback, false);
    }

    /** @param {string} name @param {unknown} data */
    dispatch(name, data)
    {
        const event = this.#events.get(name);
        if (!event) return;

        event.data = data;
        this.#target.dispatchEvent(event);
    }

    /** @param {string} name @param {Callback | undefined} callback */
    remove(name, callback)
    {
        const callbacks = this.#callbacks.get(name);

        if (callbacks && callback)
        {
            const index = callbacks.indexOf(callback);
            index !== -1 && callbacks.splice(index, 1);

            this.#target.removeEventListener(name, callback, false);
        }

        if (!callback)
        {
            callbacks?.forEach(callback =>
                this.#target.removeEventListener(name, callback, false)
            );

            this.#callbacks.delete(name);
            this.#events.delete(name);
        }
    }

    dispose()
    {
        this.#callbacks.clear();
        this.#events.clear();
    }
}

const Emitter = new EventEmitter();
export { Event, Emitter };
