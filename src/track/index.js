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
                new Base(this.#size, new Vector3(0, -0.5,   0), this.#asphalt.clone(), 1),
                new Base(this.#size, new Vector3(0, -0.5,  50), this.#asphalt.clone(), 1),
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
            this.#nextTile++;
            const z = this.#tiles[this.#tiles.length - 1].center.z + 50;
            this.#tiles.push(new Base(this.#size, new Vector3(0, -0.5, z), this.#asphalt.clone()));
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
