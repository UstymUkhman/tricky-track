import SkylineR32 from './SkylineR32';

export default class Cars
{
    #skylineR32 = new SkylineR32();

    /** @param {() => void} onLoad */
    constructor(onLoad)
    {
        Promise.all([this.#skylineR32.load()]).then(onLoad);
    }

    update()
    {
        this.#skylineR32.update();
    }
}
