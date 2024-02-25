/**
 * @callback Callback
 * @param {number} delta
 * @param {number} time
 * @returns {void}
 */

class RAF
{
    #lastTime = 0;
    #paused = true;

    /** @type {number} */ #raf;
    #onUpdate = this.#update.bind(this);
    /** @type {Callback[]} */ #callbacks = [];

    /** @param {number} time */
    #update (time)
    {
        this.#raf = requestAnimationFrame(this.#onUpdate);
        const delta = time - (this.#lastTime || 0);

        for (let c = this.#callbacks.length; c--; )
            this.#callbacks[c](delta, time);

        this.#lastTime = time;
    }

    /** @param {Callback} callback */
    add (callback)
    {
        const index = this.#callbacks.indexOf(callback);
        index === -1 && this.#callbacks.push(callback);
    }

    /** @param {Callback} callback */
    remove (callback)
    {
        const index = this.#callbacks.indexOf(callback);
        index !== -1 && this.#callbacks.splice(index, 1);
    }

    dispose ()
    {
        cancelAnimationFrame(this.#raf);
        this.#callbacks.length = 0;
    }

    /** @param {boolean} paused */
    set pause (paused)
    {
        if (this.#paused !== paused)
            ((this.#paused = paused))
                ? cancelAnimationFrame(this.#raf)
                : (this.#raf = requestAnimationFrame(this.#onUpdate));
    }
}

export default new RAF();
