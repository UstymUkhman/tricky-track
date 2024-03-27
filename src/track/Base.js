import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { Object3D } from "three/src/core/Object3D";
import { Vector3 } from "three/src/math/Vector3";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import BaseMaterial from "../materials/Base";
import { Emitter } from "../utils/Events";
import { random } from "../utils/Number";
import Physics from "../physics";

export default class Base
{
    /** @type {Mesh} */ #mesh;
    /** @type {Vector3[]} */ #corners =
        Array.from({ length: 4 }).map(() => new Vector3());

    /**
     * @param {import("three").Texture} map
     * @param {Base | undefined} tile
     * @param {number} index
     */
    constructor(map, tile, index)
    {
        const size = new Vector3(20, 1, 50);
        const y = -0.5 - index % 2 * 5e-3;

        const min = Math.min(size.x, size.z);
        map.repeat.set(size.x / min, size.z / min);

        this.#mesh = new Mesh(
            new BoxGeometry(size.x, size.y, size.z),
            new BaseMaterial({ transparent: true, opacity: +!tile, side: FrontSide, map })
        );

        this.#mesh.rotation.y = tile?.rotation + random(-1, 1) || 0;
        this.#mesh.position.set(0, y, tile?.center ?? 0);
        this.#mesh.receiveShadow = true;

        this.#computeCornersPosition();
        tile && this.#connectLastTile(tile);

        Physics.addKinematicBox(this.#mesh);
        Emitter.dispatch("Scene::Add", this.#mesh);
    }

    #computeCornersPosition()
    {
        this.#corners.forEach((corner, c) =>
        {
            const vertex = new Object3D();

            const position = new Vector3(
                Math.abs(c - 1.5 | 0) * 20 - 10,
                0,
                +(c < 2) * 50 - 25
            );

            this.#mesh.add(vertex);
            vertex.position.copy(position);

            vertex.getWorldPosition(position);
            this.#mesh.remove(vertex);
            corner.copy(position);
        });
    }

    /** @param {Base} tile */
    #connectLastTile(tile)
    {
        const c = +(this.#mesh.rotation.y - tile.rotation > 0);
        const dist = this.#corners[3 - c].clone().sub(tile.corners[c]);

        this.#mesh.position.x -= dist.x;
        this.#mesh.position.z -= dist.z;

        this.#computeCornersPosition();
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

        if (this.#mesh.position.y <= -2.5)
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

    get rotation()
    {
        return this.#mesh.rotation.y;
    }

    get corners()
    {
        return this.#corners;
    }

    get matrix()
    {
        return this.#mesh.matrixWorld;
    }

    get center()
    {
        return this.#mesh.position.z;
    }

    dispose()
    {
        Physics.removeKinematicBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
