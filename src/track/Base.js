import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { Vector2 } from "three/src/math/Vector2";
import { Mesh } from "three/src/objects/Mesh";
import BaseMaterial from "../materials/Base";
import { Emitter } from "../utils/Events";
import Physics from "../physics";

export default class Base
{
    /** @type {Mesh} */ #mesh;

    /** @param {number} width @param {number} height @param {number} depth */
    constructor(width, height, depth)
    {
        this.#mesh = new Mesh(
            new BoxGeometry(width, height, depth),
            new BaseMaterial(undefined, new Vector2(1, 2))
        );

        Emitter.dispatch("Scene::Add", this.#mesh);
        this.#mesh.position.y = height * -0.5;
        Physics.addStaticBox(this.#mesh);
        this.#mesh.receiveShadow = true;
    }

    dispose()
    {
        Physics.removeStaticBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
