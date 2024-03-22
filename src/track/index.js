import { RepeatWrapping } from "three/src/constants";
import { Vector3 } from "three/src/math/Vector3";
import { Loader } from '../utils/Assets';
import Base from "./Base";

export default class Track
{
    #halfDepth = 25;
    /** @type {Base[]} */ #tiles = [];
    /** @type {import("three").Box3} */ #bbox;
    /** @type {import("three").Texture} */ #asphalt;
    #size = new Vector3(25, 1, this.#halfDepth * 2);

    /** @param {import("three").Box3} bbox @param {() => void} onLoad */
    constructor(bbox, onLoad)
    {
        this.#createAsphalt().then(() =>
        {
            this.#initialize();
            this.#bbox = bbox;
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

    /** @param {Vector3} car */
    update(car)
    {
        if (
            car.z > this.#tiles[0].end.y &&
            !this.#tiles[0].intersects(this.#bbox)
        ) {
            this.#tiles.shift().dispose();
            const last = this.#tiles.length - 1;
            const { x, y } = this.#tiles[last].end;

            this.#tiles.push(new Base(
                this.#size, new Vector3(x, -0.5, this.#halfDepth + y), this.#asphalt.clone()
            ));
        }
    }

    dispose()
    {
        this.#asphalt.dispose();
        this.#tiles.splice(0);
    }
}
