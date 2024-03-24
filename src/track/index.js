import { RepeatWrapping } from "three/src/constants";
import { Vector3 } from "three/src/math/Vector3";
import { Loader } from '../utils/Assets';
import Base from "./Base";

export default class Track
{
    #ready = false; #nextTile = 2;
    #size = new Vector3(25, 1, 50);

    /** @type {Base[]} */ #tiles = [];
    /** @type {import("three").Texture} */ #asphalt;

    /** @param {() => void} onLoad */
    constructor(onLoad)
    {
        this.#createAsphalt().then(() =>
        {
            this.#tiles.push(
                new Base(this.#size, new Vector3(0, -0.5,   0), this.#asphalt.clone(), false),
                new Base(this.#size, new Vector3(0, -0.5,  50), this.#asphalt.clone(), false),
                new Base(this.#size, new Vector3(0, -0.5, 100), this.#asphalt.clone())
            );

            setTimeout(() => this.#ready = true, 3e3);
            onLoad();
        });
    }

    async #createAsphalt()
    {
        this.#asphalt = await Loader.loadTexture("asphalt.jpg");
        this.#asphalt.wrapS = this.#asphalt.wrapT = RepeatWrapping;
    }

    /** @param {number} delta */
    update(delta)
    {
        if (!this.#ready) return;

        if (this.#tiles[0].update(delta))
        {
            this.#tiles.splice(0, 1);
            this.#nextTile--;
        }

        if (this.#tiles[this.#nextTile].update(delta))
        {
            const z = ++this.#nextTile * 50;
            this.#tiles.push(new Base(this.#size, new Vector3(0, -0.5, z), this.#asphalt.clone()));
        }
    }

    get tile()
    {
        return this.#tiles[0].matrix;
    }

    dispose()
    {
        this.#tiles.forEach(tile.dispose.bind(tile));
        this.#asphalt.dispose();
        this.#tiles.splice(0);
    }
}
