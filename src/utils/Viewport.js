/**
 * @callback Callback
 * @param {number} width
 * @param {number} height
 * @param {number} ratio
 * @returns {void}
 */

/**
 * @typedef {object} Size
 * @property {number} width
 * @property {number} height
 * @property {number} ratio
 */

class Viewport
{
    #width = window.innerWidth;
    #height = window.innerHeight;
    #ratio = this.#width / this.#height;

    #update = this.#updateSize.bind(this);
    #root = document.documentElement.style;
    /** @type {Callback[]} */ #callbacks = [];

    constructor ()
    {
        window.addEventListener("resize", this.#update, false);
        this.#updateSize();
    }

    #updateSize ()
    {
        this.#width = window.innerWidth;
        this.#height = window.innerHeight;
        this.#ratio = this.#width / this.#height;

        this.#root.setProperty("--ratio", `${this.#ratio}`);
        this.#root.setProperty("--width", `${this.#width}px`);
        this.#root.setProperty("--height", `${this.#height}px`);

        for (let c = this.#callbacks.length; c--;)
            this.#callbacks[c](this.#width, this.#height, this.#ratio);
    }

    /** @param {Callback} callback */
    addResizeCallback (callback)
    {
        const index = this.#callbacks.indexOf(callback);
        index === -1 && this.#callbacks.push(callback);
    }

    /** @param {Callback} callback */
    removeResizeCallback (callback)
    {
        const index = this.#callbacks.indexOf(callback);
        index !== -1 && this.#callbacks.splice(index, 1);
    }

    dispose ()
    {
        window.removeEventListener("resize", this.#update, false);
        this.#callbacks.length = 0;
    }

    /** @returns {Size} */
    get size ()
    {
        return {
            height: this.#height,
            width: this.#width,
            ratio: this.#ratio
        };
    }
}

export default new Viewport();
