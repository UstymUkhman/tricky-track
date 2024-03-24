import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import BaseMaterial from "../materials/Base";
import { Emitter } from "../utils/Events";
import Physics from "../physics";

export default class Base
{
    /** @type {Mesh} */ #mesh;

    /** @param {import("three").Vector3} size @param {import("three").Vector3} position @param {import("three").Texture} map */
    constructor(size, position, map)
    {
        const min = Math.min(size.x, size.z);
        map.repeat.set(size.x / min, size.z / min);

        this.#mesh = new Mesh(
            new BoxGeometry(size.x, size.y, size.z),
            new BaseMaterial({ map, side: FrontSide })
        );

        this.#mesh.position.copy(position);
        Physics.addStaticBox(this.#mesh);
        this.#mesh.receiveShadow = true;

        Emitter.dispatch("Scene::Add", this.#mesh);
    }

    get matrix()
    {
        return this.#mesh.matrixWorld;
    }

    dispose()
    {
        Physics.removeStaticBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
