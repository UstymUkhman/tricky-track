import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { Vector3 } from "three/src/math/Vector3";
import { Vector2 } from "three/src/math/Vector2";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import BaseMaterial from "../materials/Base";
import { Box3 } from "three/src/math/Box3";
import { Emitter } from "../utils/Events";
import Physics from "../physics";

export default class Base
{
    #bbox = new Box3();
    #end = new Vector2();
    #center = new Vector3();
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

        this.#bbox.setFromObject(this.#mesh);
        this.#bbox.getCenter(this.#center);
        const { x, z } = this.#bbox.max;

        Emitter.dispatch("Scene::Add", this.#mesh);
        this.#end.set((this.#bbox.min.x + x) * 0.5, z);
    }

    /** @param {Box3} bbox */
    intersects(bbox)
    {
        return this.#bbox.intersectsBox(bbox);
    }

    get center()
    {
        return this.#center;
    }

    get end()
    {
        return this.#end;
    }

    dispose()
    {
        Physics.removeStaticBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
