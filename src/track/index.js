import { RepeatWrapping } from "three/src/constants";
import { Loader } from '../utils/Assets';
import Base from "./Base";

export default class Track
{
    #tileIndex = 0;
    #nextTile = 30;
    active = false;

    /** @type {Base[]} */ #tiles = [];
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
        if (!this.active) return;

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
        const index = +this.#tiles[1].moved;
        return this.#tiles[index + 1].matrix;
    }

    dispose()
    {
        this.#tiles.forEach(tile.dispose.bind(tile));
        this.#asphalt.dispose();
        this.#tiles.splice(0);
        this.active = false;
    }
}
