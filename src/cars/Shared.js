import { Vector3 } from "three/src/math/Vector3";
import { Box3 } from "three/src/math/Box3";
import { Emitter } from "../utils/Events";
import { Loader } from "../utils/Assets";
import Worker from "../utils/worker";
import SAB from "../utils/SAB";

export default class Car
{
    #steering = 0;
    #loadedWheels = 0;
    #bbox = new Box3();
    #dir = new Vector3();

    /** @type {object} */ #config;
    /** @type {object} */ #tuning;

    #setVehicleTuning = this.#setTuning.bind(this);
    #setVehicleBody   = this.#setVehicle.bind(this);
    #setVehicleWheel  = this.#setWheel.bind(this);

    /** @type {import("three").Mesh} */ #chassis;
    /** @type {import("three").Mesh[]} */ #wheels = [];
    /** @type {(chassis: import("three").Mesh) => void} */ #onLoad;

    /** @param {object} config @param {(chassis: import("three").Mesh) => void} onLoad */
    constructor(config, onLoad)
    {
        this.#config = config;
        this.#onLoad = onLoad;

        Worker.post("Physics::Set::SharedArrayBuffer", { buffer: SAB.transformBuffer.buffer });
        Worker.add("Physics::Get::VehicleTuning", this.#setVehicleTuning).post("Physics::Get::VehicleTuning");
    }

    /** @param {object} tuning */
    #setTuning(tuning)
    {
        this.#tuning = tuning;
        Worker.remove("Physics::Get::VehicleTuning", this.#setVehicleTuning);
    }

    #setVehicle()
    {
        Worker.add("Physics::Add::Wheel", this.#setVehicleWheel);
        Worker.remove("Physics::Add::Vehicle", this.#setVehicleBody);

        for (let w = 0, l = this.#wheels.length; w < l; w++)
        {
            const i = w * 7 + 7;
            const { geometry: { parameters: { height } } } = this.#wheels[w];

            SAB.transformBuffer[i + 0] = this.#wheels[w].position.x;
            SAB.transformBuffer[i + 1] = this.#wheels[w].position.y;
            SAB.transformBuffer[i + 2] = this.#wheels[w].position.z;

            SAB.transformBuffer[i + 3] = 0;
            SAB.transformBuffer[i + 4] = 0;
            SAB.transformBuffer[i + 5] = 0;
            SAB.transformBuffer[i + 6] = 0;

            Worker.post("Physics::Add::Wheel",
            {
                tuning: this.#tuning,
                config: this.#config,
                radius: height / 2,
                index: w
            });
        }
    }

    #setWheel()
    {
        if (this.#wheels.length === ++this.#loadedWheels)
        {
            Worker.remove("Physics::Add::Wheel", this.#setVehicleWheel);
            this.#onLoad(this.#chassis.children[0]);
        }
    }

    /** @param {string} chassis @param {string} wheel */
    async load(chassis, wheel)
    {
        return (await Promise.all([Loader.loadGLTF(chassis), Loader.loadGLTF(wheel)])).map(({ scene }) => scene);
    }

    /** @param {import("three").Mesh} chassis @param {import("three").Mesh[]} wheels */
    add(chassis, wheels)
    {
        this.#wheels = wheels;

        SAB.transformBuffer[0] = chassis.position.x;
        SAB.transformBuffer[1] = chassis.position.y;
        SAB.transformBuffer[2] = chassis.position.z;

        SAB.transformBuffer[3] = chassis.quaternion.x;
        SAB.transformBuffer[4] = chassis.quaternion.y;
        SAB.transformBuffer[5] = chassis.quaternion.z;
        SAB.transformBuffer[6] = chassis.quaternion.w;

        this.#bbox.setFromObject(this.#chassis = chassis);
        const { width, height, depth } = chassis.geometry.parameters;

        Worker.add("Physics::Add::Vehicle", this.#setVehicleBody).post("Physics::Add::Vehicle",
        {
            tuning: this.#tuning,
            chassis: {
                width, height, depth,
                mass: this.#config.mass
            }
        });
    }

    /** @param {boolean} accelerate @param {number} steer @param {boolean} brake */
    update(accelerate, steer, brake)
    {
        let i = this.#wheels.length * 7 + 7;
        let acceleration = 0, braking = 0;
        const speed = this.speed;

        const {
            brakeForce,
            engineForce,
            reverseForce,
            steerLimit,
            steerFactor,
            frontBrakeFactor,
            backBrakeFactor
        } = this.#config;

        accelerate && (speed < -1 ? braking = brakeForce : acceleration = engineForce );
        brake      && (speed >  1 ? braking = brakeForce : acceleration = reverseForce);

        steer === -1 ? this.#steering <  steerLimit && (this.#steering += steerFactor) :
        steer ===  1 ? this.#steering > -steerLimit && (this.#steering -= steerFactor) :

        this.#steering < -steerFactor
            ? (this.#steering += steerFactor) : this.#steering > steerFactor
            ? (this.#steering -= steerFactor) : this.#steering = 0;

        SAB.transformBuffer[i + 0] = acceleration;
        SAB.transformBuffer[i + 1] = this.#steering;
        SAB.transformBuffer[i + 2] = braking * frontBrakeFactor;
        SAB.transformBuffer[i + 3] = braking * backBrakeFactor;

        for (let w = 0, l = this.#wheels.length; w < l; w++)
        {
            i = w * 7 + 7;

            this.#wheels[w].position.set(
                SAB.transformBuffer[i + 0],
                SAB.transformBuffer[i + 1],
                SAB.transformBuffer[i + 2]
            );

            this.#wheels[w].quaternion.set(
                SAB.transformBuffer[i + 3],
                SAB.transformBuffer[i + 4],
                SAB.transformBuffer[i + 5],
                SAB.transformBuffer[i + 6]
            );
        }

        this.#chassis.position.set(
            SAB.transformBuffer[0],
            SAB.transformBuffer[1],
            SAB.transformBuffer[2]
        );

        this.#chassis.quaternion.set(
            SAB.transformBuffer[3],
            SAB.transformBuffer[4],
            SAB.transformBuffer[5],
            SAB.transformBuffer[6]
        );

        this.#bbox.copy(this.#chassis.geometry.boundingBox)
            .applyMatrix4(this.#chassis.matrixWorld);
    }

    /** @param {import("three").Vector3} position @param {import("three").Quaternion} rotation */
    reset(position, rotation)
    {
        this.#chassis.position.copy(position);
        this.#chassis.quaternion.copy(rotation);

        this.#bbox.copy(this.#chassis.geometry.boundingBox)
            .applyMatrix4(this.#chassis.matrixWorld);

        Worker.post("Physics::Reset::Vehicle",
        {
            quaternion: rotation.toJSON(),
            position
        });
    }

    /** @param {import("three").Plane} plane */
    intersects(plane)
    {
        return this.#bbox.intersectsPlane(plane);
    }

    get direction()
    {
        return this.#chassis.getWorldDirection(this.#dir).z;
    }

    get rotation()
    {
        return this.#chassis.quaternion;
    }

    get speed()
    {
        return SAB.transformBuffer[39];
    }

    dispose()
    {
        this.#config = undefined;
        this.#tuning = undefined;
        this.#wheels.length = 0;
        this.#steering = 0;
    }
}
