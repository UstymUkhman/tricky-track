import { Vector3 } from "three/src/math/Vector3";
import { Box3 } from "three/src/math/Box3";
import { Emitter } from "../utils/Events";
import { Loader } from "../utils/Assets";
import Physics from "../physics";

export default class Car
{
    #steering = 0;
    #bbox = new Box3();
    #dir = new Vector3();

    /** @type {object} */ #config;
    /** @type {object} */ #vehicle;

    /** @type {import("three").Mesh} */ #chassis;
    /** @type {import("three").Mesh[]} */ #wheels = [];

    /** @type {object} */ #tuning = Physics.vehicleTuning;
    /** @type {(chassis: import("three").Mesh) => void} */ #onLoad;

    /** @param {object} config @param {(chassis: import("three").Mesh) => void} onLoad */
    constructor(config, onLoad)
    {
        this.#config = config;
        this.#onLoad = onLoad;
    }

    /** @param {string} chassis @param {string} wheel */
    async load(chassis, wheel)
    {
        return (await Promise.all([Loader.loadGLTF(chassis), Loader.loadGLTF(wheel)])).map(({ scene }) => scene);
    }

    /** @param {import("three").Mesh} chassis @param {import("three").Mesh[]} wheels */
    add(chassis, wheels)
    {
        this.#bbox.setFromObject(this.#chassis = chassis);
        this.#vehicle = Physics.addVehicle(chassis, this.#tuning, this.#config.mass);

        for (let w = 0, l = wheels.length; w < l; this.#wheels.push(wheels[w++]))
        {
            const { position, geometry: { parameters: { height } } } = wheels[w];
            Physics.addWheel(this.#tuning, this.#config, position, height * 0.5, w);
        }

        this.#onLoad(this.#chassis.children[0]);
    }

    /** @param {boolean} accelerate @param {number} steer @param {boolean} brake */
    update(accelerate, steer, brake)
    {
        let transform, origin, rotation;
        const speed = this.speed;
        let acceleration = 0;
        let braking = 0;

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

        this.#vehicle.setBrake(braking * frontBrakeFactor, 0);
        this.#vehicle.setBrake(braking * frontBrakeFactor, 1);

        this.#vehicle.setBrake(braking * backBrakeFactor, 2);
        this.#vehicle.setBrake(braking * backBrakeFactor, 3);

        this.#vehicle.setSteeringValue(this.#steering, 0);
        this.#vehicle.setSteeringValue(this.#steering, 1);

        this.#vehicle.applyEngineForce(acceleration, 2);
        this.#vehicle.applyEngineForce(acceleration, 3);

        for (let w = 0, l = this.#wheels.length; w < l; w++)
        {
            this.#vehicle.updateWheelTransform(w, true);
            transform = this.#vehicle.getWheelTransformWS(w);

            origin = transform.getOrigin();
            rotation = transform.getRotation();

            this.#wheels[w].position.set(origin.x(), origin.y(), origin.z());
            this.#wheels[w].quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }

        transform = this.#vehicle.getChassisWorldTransform();

        origin = transform.getOrigin();
        rotation = transform.getRotation();
        const x = origin.x(), y = origin.y(), z = origin.z();

        this.#chassis.userData.position.set(x, y, z);

        this.#chassis.position.copy(this.#chassis.userData.position);
        this.#chassis.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());

        this.#bbox.copy(this.#chassis.geometry.boundingBox).applyMatrix4(this.#chassis.matrixWorld);
    }

    /** @param {import("three").Vector3} position @param {import("three").Quaternion} rotation */
    reset(position, rotation)
    {
        this.#vehicle.setBrake(Infinity, 0);
        this.#vehicle.setBrake(Infinity, 1);
        this.#vehicle.setBrake(Infinity, 2);
        this.#vehicle.setBrake(Infinity, 3);

        this.#vehicle.setSteeringValue(0, 0);
        this.#vehicle.setSteeringValue(0, 1);

        this.#vehicle.applyEngineForce(0, 2);
        this.#vehicle.applyEngineForce(0, 3);

        this.#chassis.position.copy(position);
        this.#chassis.quaternion.copy(rotation);

        Physics.resetVehicle(this.#chassis);
        Emitter.dispatch("Car::Reset", this.rotation);

        this.#bbox.copy(this.#chassis.geometry.boundingBox)
            .applyMatrix4(this.#chassis.matrixWorld);
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

    /** @returns {number} */
    get speed()
    {
        return this.#vehicle.getCurrentSpeedKmHour();
    }

    dispose()
    {
        this.#vehicle = undefined;
        this.#config = undefined;
        this.#tuning = undefined;
        this.#wheels.length = 0;
        this.#steering = 0;
    }
}
