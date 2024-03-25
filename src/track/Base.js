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
    constructor(size, position, map, opacity = 0)
    {
        this.#target = position.y - 2;
        const min = Math.min(size.x, size.z);
        map.repeat.set(size.x / min, size.z / min);

        this.#mesh = new Mesh(
            new BoxGeometry(size.x, size.y, size.z),
            new BaseMaterial({ transparent: true, side: FrontSide, opacity, map })
        );

        this.#mesh.receiveShadow = true;
        this.#mesh.position.copy(position);

        Physics.addKinematicBox(this.#mesh);
        Emitter.dispatch("Scene::Add", this.#mesh);
    }

    /** @param {number} delta @param {number} speed */
    move(delta, speed)
    {
        speed *= 1e-3;
        let { opacity } = this.#mesh.material;

        opacity = Math.max(opacity - speed - 64e-4, 0);
        this.#mesh.position.y -= delta * (speed + 4e-4);

        this.#mesh.material.opacity = opacity;
        Physics.moveKinematicBody(this.#mesh);

        if (this.#mesh.position.y <= this.#target)
        {
            this.dispose();
            return true;
        }

        return false;
    }

    /** @param {number} delta @param {number} speed */
    fade(delta, speed)
    {
        const opacityFactor = ++speed * 1e-3;
        let { opacity } = this.#mesh.material;

        opacity = Math.min(opacity + delta * opacityFactor, 1);

        this.#mesh.material.opacity = opacity;
        return opacity === 1;
    }

    get matrix()
    {
        return this.#mesh.matrixWorld;
    }

    get center()
    {
        return this.#mesh.position;
    }

    dispose()
    {
        Physics.removeKinematicBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
