import { RepeatWrapping } from "three/src/constants";
import { Loader } from '../utils/Assets';
import Base from "./Base";

export default class Track
{
    /** @type {Base[]} */ #tiles = [];
    #tileIndex = 0; #nextTile = 30; #ready = false;
    /** @type {import("three").Texture} */ #asphalt;

    /** @param {() => void} onLoad */
    constructor(onLoad)
    {
        this.#createAsphalt().then(() =>
        {
            for ( ; this.#tileIndex < 31; this.#tileIndex++)
            {
                this.#tiles.push(new Base(this.#asphalt.clone(), this.#tiles[this.#tiles.length - 1], this.#tileIndex));
            }

            setTimeout(() => this.#ready = true, 3e3) && onLoad();
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

        delta *= 50 / this.#tiles[0].depth;

        if (this.#tiles[0].move(delta))
        {
            this.#tiles.splice(0, 1);
            this.#nextTile--;
        }

        if (this.#nextTile < 32 && this.#tiles[this.#nextTile].fade(delta))
        {
            this.#tiles.push(new Base(this.#asphalt.clone(), this.#tiles[this.#tiles.length - 1], this.#tileIndex++));
            this.#nextTile++;
        }
    }

    get tile()
    {
        return this.#tiles[2].matrix;
    }

    dispose()
    {
        this.#tiles.forEach(tile.dispose.bind(tile));
        this.#asphalt.dispose();
        this.#tiles.splice(0);
    }
}
