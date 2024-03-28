import { RepeatWrapping } from "three/src/constants";
import { Loader } from '../utils/Assets';
import Base from "./Base";

export default class Track
{
    /** @type {Base[]} */ #tiles = [];
    #tileIndex = 0; #nextTile = 1; #ready = false;
    /** @type {import("three").Texture} */ #asphalt;

    /** @param {() => void} onLoad */
    constructor(onLoad)
    {
        this.#createAsphalt().then(() =>
        {
            this.#tiles.push(new Base(this.#asphalt.clone(), undefined, this.#tileIndex++));
            this.#tiles.push(new Base(this.#asphalt.clone(), this.#tiles[this.#tiles.length - 1], this.#tileIndex++));

            setTimeout(() => this.#ready = true, 3e3) && onLoad();
        });
    }

    async #createAsphalt()
    {
        this.#asphalt = await Loader.loadTexture("asphalt.jpg");
        this.#asphalt.wrapS = this.#asphalt.wrapT = RepeatWrapping;
    }

    /** @param {number} delta @param {number} speed */
    update(delta, speed)
    {
        if (!this.#ready) return;
        speed = speed * 1e-2 | 0;

        if (this.#tiles[0].move(delta, speed))
        {
            this.#tiles.splice(0, 1);
            this.#nextTile--;
        }

        if (this.#nextTile < 32 && this.#tiles[this.#nextTile].fade(delta, speed))
        {
            this.#tiles.push(new Base(this.#asphalt.clone(), this.#tiles[this.#tiles.length - 1], this.#tileIndex++));
            this.#nextTile++;
        }
    }

    get tile()
    {
        return this.#tiles[1].matrix;
    }

    dispose()
    {
        this.#tiles.forEach(tile.dispose.bind(tile));
        this.#asphalt.dispose();
        this.#tiles.splice(0);
    }
}
