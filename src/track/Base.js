import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { randomInt, random } from "../utils/Number";
import { Object3D } from "three/src/core/Object3D";
import { Vector3 } from "three/src/math/Vector3";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import BaseMaterial from "../materials/Base";
import { Emitter } from "../utils/Events";
import Physics from "../physics";

export default class Base
{
    #corner = new Object3D();

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
        const size = this.#setMeshSize(tile);
        const min = Math.min(size.x, size.z);
        map.repeat.set(size.x / min, size.z / min);

        this.#mesh = new Mesh(
            new BoxGeometry(size.x, size.y, size.z),
            new BaseMaterial({ opacity: +!(tile && index > 1), transparent: true, side: FrontSide, map })
        );

        this.#mesh.position.set(0, -0.5 - index % 2 * 5e-3, tile?.center ?? 0);
        this.#mesh.rotation.y = this.#getMeshRotation(tile?.rotation);
        this.#mesh.receiveShadow = true;

        this.#computeCornersPosition();
        tile && this.#connectLastTile(tile);

        Physics.addKinematicBox(this.#mesh);
        Emitter.dispatch("Scene::Add", this.#mesh);
    }

    /** @param {Base | undefined} tile */
    #setMeshSize(tile)
    {
        const rand = Math.random();
        const width = tile?.width ?? 50;
        const x = rand < 0.6 && rand > 0.4 && randomInt(20, 50);
        return new Vector3(x || width, 1, 50 /* randomInt(50, 100) */);
    }

    /** @param {number | undefined} rotation */
    #getMeshRotation(rotation)
    {
        const rand = Math.random();
        const rotate = rand < 0.6 && rand > 0.4;
        return rotation + +rotate * random(-1, 1) || 0;
    }

    #computeCornersPosition()
    {
        const { width, depth } = this.#mesh.geometry.parameters;

        const halfWidth = width * 0.5;
        const halfDepth = depth * 0.5;

        this.#corners.forEach((corner, c) =>
        {
            const position = new Vector3(
                Math.abs(c - 1.5 | 0) * width - halfWidth,
                0, +(c < 2) * depth - halfDepth
            );

            this.#mesh.add(this.#corner);
            this.#corner.position.copy(position);

            this.#corner.getWorldPosition(position);
            this.#mesh.remove(this.#corner);
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

        this.rotation === tile.rotation && this.width !== tile.width &&
            this.#mesh.translateX((tile.width - this.width) * -0.5);

        this.#computeCornersPosition();
    }

    /** @param {number} delta @param {number} speed */
    move(delta, speed)
    {
        speed *= 1e-3; // 5e-4
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
        const opacityFactor = ++speed * 1e-3; // 5e-4
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

    get width()
    {
        return this.#mesh.geometry.parameters.width;
    }

    dispose()
    {
        this.#corners.splice(0);
        Physics.removeKinematicBody(this.#mesh);
        Emitter.dispatch("Scene::Remove", this.#mesh);
    }
}
