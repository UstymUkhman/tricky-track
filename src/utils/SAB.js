class SAB
{
    #bytes = 320 + 1792;

    /**
     * [0 -  6] - Chassis Transform
     *
     * [7 - 34] - Wheels Transform
     *
     * [35]     - Acceleration
     *
     * [36]     - Steering
     *
     * [37]     - Front Braking
     *
     * [38]     - Back Braking
     *
     * [39]     - Speed
     *
     * @type {Float64Array} */ transformBuffer;

    constructor()
    {
        if (crossOriginIsolated)
        {
            // Convert to KB and get pages (1 page = 64KB):
            const pages = this.#bytes / 1024 / 64;

            this.transformBuffer = new Float64Array(
                typeof SharedArrayBuffer !== 'undefined'
                    ? new SharedArrayBuffer(this.#bytes)
                    : new WebAssembly.Memory(
                    {
                        initial: Math.max(pages, 1),
                        maximum: Math.max(pages, 1),
                        shared: true
                    }).buffer
            );
        }
    }

    get supported()
    {
        return !!this.transformBuffer;
    }
}

export default new SAB();
