import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { Matrix4 } from "three/src/math/Matrix4";
import { Vector3 } from "three/src/math/Vector3";
import { Mesh } from "three/src/objects/Mesh";
import { Color } from "three/src/math/Color";
import { Box3 } from "three/src/math/Box3";
import { Emitter } from "../utils/Events";
import { Loader } from '../utils/Assets';
import Physics from "../physics";

export default class Car
{
    /** @param {object} */ #config;
    /** @param {object} */ #vehicle;

    /** @param {import("three").Group[]} */ #wheels = [];
    /** @param {object} */ #tuning = Physics.vehicleTuning;

    /** @param {object} config */
    constructor(config)
    {
        this.#config = config;
    }

    /** @param {import("three").Group} mesh @param {number | undefined} color @param {boolean | undefined} precise */
    #computeBoundingBox(mesh, color, precise)
    {
        const box = new Box3().setFromObject(mesh, precise);
        const size = new Vector3().subVectors(box.max, box.min);
        const geometry = new BoxGeometry(size.x, size.y, size.z);

        geometry.applyMatrix4(new Matrix4().setPosition(
            size.addVectors(box.min, box.max).multiplyScalar(0.5)
        )).translate(0, this.#config.bboxOffset, 0).computeBoundingBox();

        const computeMesh = new Mesh(geometry, DEBUG && new MeshBasicMaterial({ wireframe: true, color }));
        DEBUG && Emitter.dispatch("Scene::Add", computeMesh);
        return computeMesh;
    }

    /** @param {string} chassis @param {string} wheel */
    async load(chassis, wheel)
    {
        return (await Promise.all([Loader.loadGLTF(chassis), Loader.loadGLTF(wheel)])).map(({ scene }) => scene);
    }

    /** @param {import("three").Group} chassis @param {import("three").Group[]} wheels */
    add(chassis, wheels)
    {
        const frame = this.#computeBoundingBox(chassis, Color.NAMES.magenta);
        frame.geometry.parameters.height += this.#config.groundClearance * 2;
        this.#vehicle = Physics.addVehicle(frame, this.#tuning, this.#config.mass);

        for (let w = 0, l = wheels.length; w < l; w++)
        {
            this.#wheels.push(this.#computeBoundingBox(wheels[w], Color.NAMES.magenta, true));
            const { position, geometry: { parameters: { height } } } = this.#wheels[w];
            Physics.addWheel(this.#vehicle, this.#config, position, height * 0.5, this.#tuning, w < 2);
        }
    }

    update()
    {
        for (let w = 0, l = this.#wheels.length; w < l; w++)
        {
            this.#vehicle.updateWheelTransform(w, true);
            const transform = this.#vehicle.getWheelTransformWS(w);

            const origin = transform.getOrigin();
            const rotation = transform.getRotation();

            this.#wheels[w].position.set(origin.x(), origin.y(), origin.z());
            // this.#wheels[w].quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
    }
}
