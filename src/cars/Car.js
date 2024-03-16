import Physics from "../physics";
import { Loader } from '../utils/Assets';

export default class Car
{
    /** @param {object} */ #config;
    /** @param {object} */ #vehicle;
    /** @param {number} */ #steering;

    /** @param {import("three").Mesh[]} */ #wheels = [];
    /** @param {object} */ #tuning = Physics.vehicleTuning;

    /** @param {object} config */
    constructor(config)
    {
        this.#steering = 0;
        this.#config = config;
    }

    /** @param {string} chassis @param {string} wheel */
    async load(chassis, wheel)
    {
        return (await Promise.all([Loader.loadGLTF(chassis), Loader.loadGLTF(wheel)])).map(({ scene }) => scene);
    }

    /** @param {import("three").Mesh} chassis @param {import("three").Mesh[]} wheels */
    add(chassis, wheels)
    {
        this.#vehicle = Physics.addVehicle(chassis, this.#tuning, this.#config.mass);

        for (let w = 0, l = wheels.length; w < l; this.#wheels.push(wheels[w++]))
        {
            const { position, geometry: { parameters: { height } } } = wheels[w];
            Physics.addWheel(this.#vehicle, this.#tuning, this.#config, position, height * 0.5, w < 2);
        }
    }

    /** @param {boolean} accelerate @param {number} steer @param {boolean} brake */
    update(accelerate, steer, brake)
    {
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
            const transform = this.#vehicle.getWheelTransformWS(w);

            const origin = transform.getOrigin();
            const rotation = transform.getRotation();

            this.#wheels[w].position.set(origin.x(), origin.y(), origin.z());
            this.#wheels[w].quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }
    }

    dispose()
    {
        this.#vehicle = undefined;
        this.#config = undefined;
        this.#tuning = undefined;
        this.#wheels.length = 0;
        this.#steering = 0;
    }

    /** @returns {number} */
    get speed()
    {
        return this.#vehicle.getCurrentSpeedKmHour();
    }
}
