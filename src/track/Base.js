import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import BaseMaterial from "../materials/Base";
import { Emitter } from "../utils/Events";
import Physics from "../physics";

export default class Base
{
    /** @type {Mesh} */ #mesh;
    /** @type {number} */ #target;

    /**
     * @param {import("three").Vector3} size
     * @param {import("three").Vector3} position
     * @param {import("three").Texture} map
     * @param {boolean} hidden
     */
    constructor(size, position, map, hidden = true)
    {
        this.#target = position.y - size.y;
        const min = Math.min(size.x, size.z);
        map.repeat.set(size.x / min, size.z / min);

        this.#mesh = new Mesh(
            new BoxGeometry(size.x, size.y, size.z),
            new BaseMaterial({ map, side: FrontSide, ...(hidden && {
                transparent: true, opacity: 0
            })})
        );

        this.#mesh.receiveShadow = true;
        this.#mesh.position.copy(position);
        Physics.addKinematicBox(this.#mesh);

        Emitter.dispatch("Scene::Add", this.#mesh);
    }

    /** @param {number} delta */
    update(delta)
    {
        let { opacity } = this.#mesh.material;

        if (opacity === 1)
        {
            this.#mesh.position.y -= delta * 0.0002;
            Physics.moveKinematicBody(this.#mesh);

            if (this.#mesh.position.y <= this.#target)
            {
                this.dispose();
                return true;
            }

            return false;
        }

        opacity = Math.min(opacity + delta * 0.002, 1);
        this.#mesh.material.opacity = opacity;
        return opacity === 1;
    }

    get matrix()
    {
        return this.#mesh.matrixWorld;
    }

    dispose()
    {
        Physics.removeKinematicBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
