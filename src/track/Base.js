import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import { Color } from "three/src/math/Color";
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
            new MeshStandardMaterial({ side: FrontSide, color: Color.NAMES.darkgray })
        );

        Emitter.dispatch("Scene::Add", this.#mesh);
        this.#mesh.position.y = height * -0.5;
        Physics.addStaticBox(this.#mesh);
    }

    dispose()
    {
        Physics.removeStaticBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
