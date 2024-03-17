import { MeshStandardMaterial } from "three/src/materials/MeshStandardMaterial";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import { Color } from "three/src/math/Color";
import { Emitter } from "../utils/Events";
import Physics from "../physics";

export default class Base
{
    /** @param {number} width @param {number} height @param {number} depth */
    constructor(width, height, depth)
    {
        const base = new Mesh(
            new BoxGeometry(width, height, depth),
            new MeshStandardMaterial({ side: FrontSide, color: Color.NAMES.darkgray })
        );

        Emitter.dispatch("Scene::Add", base);
        base.position.y = height * -0.5;
        Physics.addStaticBox(base);
    }
}
