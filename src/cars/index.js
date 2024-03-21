import SkylineR32 from './SkylineR32';

export default class Cars
{
    #skylineR32 = new SkylineR32();

    /** @param {(chassis: import("three").Mesh) => void} onLoad */
    constructor(onLoad)
    {
        this.#skylineR32.load().then(onLoad);
    }

    update()
    {
        return this.#skylineR32.update();
    }

    dispose()
    {
        this.#skylineR32.dispose();
    }
}
