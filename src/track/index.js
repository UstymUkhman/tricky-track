import { RepeatWrapping } from "three/src/constants";
import { Vector3 } from "three/src/math/Vector3";
import { Loader } from '../utils/Assets';
import Base from "./Base";

export default class Track
{
    #halfDepth = 25;
    /** @type {Base[]} */ #tiles = [];
    /** @type {import("three").Texture} */ #asphalt;
    #size = new Vector3(25, 1, this.#halfDepth * 2);

    /** @param {() => void} onLoad */
    constructor(onLoad)
    {
        this.#createAsphalt().then(() =>
        {
            this.#initialize();
            onLoad();
        });
    }

    async #createAsphalt()
    {
        this.#asphalt = await Loader.loadTexture("asphalt.jpg");
        this.#asphalt.wrapS = this.#asphalt.wrapT = RepeatWrapping;
    }

    #initialize()
    {
        this.#tiles.push(
            new Base(this.#size, new Vector3(0, -0.5,   0), this.#asphalt.clone()),
            new Base(this.#size, new Vector3(0, -0.5,  50), this.#asphalt.clone()),
            new Base(this.#size, new Vector3(0, -0.5, 100), this.#asphalt.clone()),
            new Base(this.#size, new Vector3(0, -0.5, 150), this.#asphalt.clone()),
            new Base(this.#size, new Vector3(0, -0.5, 200), this.#asphalt.clone())
        );
    }

    get firstTile()
    {
        return this.#tiles[0].center;
    }

    dispose()
    {
        this.#asphalt.dispose();
        this.#tiles.splice(0);
    }
}
