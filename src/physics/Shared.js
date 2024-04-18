import { TAU } from "../utils/Number";
import LoadAmmo from "./Ammo";

import {
    RIGID_MARGIN,
    RIGID_FRICTION,
    RIGID_RESTITUTION,
    DISABLE_SIMULATION,
    KINEMATIC_COLLISION,
    RIGID_LINEAR_FACTOR,
    RIGID_ANGULAR_FACTOR,
    DISABLE_DEACTIVATION,
    RIGID_LINEAR_DAMPING,
    RIGID_ANGULAR_DAMPING
} from "./constants";

export default class Physics
{
    #Engine;
    #world;

    #transform;
    #left;
    #down;
    #broadphase;

    #collision;
    #solver;
    #dispatcher;

    #vehicle;

    #friction = RIGID_FRICTION;
    #restitution = RIGID_RESTITUTION;
    #linearDamping = RIGID_LINEAR_DAMPING;
    #angularDamping = RIGID_ANGULAR_DAMPING;

    /** @type {Float64Array} */ #sharedTransformBuffer;
    /** @type {object[]} */ #kinematicBodies = new Array(32);

    /** @param {(Ammo: object) => void | undefined} onLoad */
    constructor(onLoad)
    {
        LoadAmmo().then(Ammo =>
        {
            this.#transform = new Ammo.btTransform();
            this.#left = new Ammo.btVector3(-1, 0, 0);
            this.#down = new Ammo.btVector3(0, -1, 0);
            this.#broadphase = new Ammo.btDbvtBroadphase();

            this.#collision = new Ammo.btDefaultCollisionConfiguration();
            this.#solver = new Ammo.btSequentialImpulseConstraintSolver();
            this.#dispatcher = new Ammo.btCollisionDispatcher(this.#collision);

            this.#world = new Ammo.btDiscreteDynamicsWorld(
                this.#dispatcher, this.#broadphase, this.#solver, this.#collision
            );

            this.#world.setGravity(new Ammo.btVector3(0, -9.81, 0));
            onLoad?.(this.#Engine = Ammo);
        });
    }

    /** @param {ArrayBuffer} buffer */
    setSharedTransformBuffer(buffer)
    {
        this.#sharedTransformBuffer = new Float64Array(buffer);
    }

    /**
     * @param {object} shape
     * @param {import("three").Vector3Like} position
     * @param {number[]} quaternion
     * @param {number} mass
     * @param {number} margin
     * @returns {object} body
     */
    #createRigidBody(shape, position, quaternion, mass = 0, margin = RIGID_MARGIN)
    {
        const transform = new this.#Engine.btTransform();
        const inertia = new this.#Engine.btVector3(0, 0, 0);

        mass && shape.calculateLocalInertia(mass, inertia);
        margin !== RIGID_MARGIN && shape.setMargin(margin);

        transform.setIdentity();
        transform.setRotation(new this.#Engine.btQuaternion(...quaternion));
        transform.setOrigin(new this.#Engine.btVector3(position.x, position.y, position.z));

        const body = new this.#Engine.btRigidBody(
            new this.#Engine.btRigidBodyConstructionInfo(
                mass, new this.#Engine.btDefaultMotionState(transform), shape, inertia
            )
        );

        body.setAngularFactor(new this.#Engine.btVector3(
            RIGID_ANGULAR_FACTOR, RIGID_ANGULAR_FACTOR, RIGID_ANGULAR_FACTOR
        ));

        body.setLinearFactor(new this.#Engine.btVector3(
            RIGID_LINEAR_FACTOR, RIGID_LINEAR_FACTOR, RIGID_LINEAR_FACTOR
        ));

        body.setDamping(this.#linearDamping, this.#angularDamping);
        body.setActivationState(DISABLE_DEACTIVATION);
        body.setRestitution(this.#restitution);
        body.setFriction(this.#friction);

        return body;
    }

    /**
     * @typedef {object} BodyParams
     * @property {import("three").Vector3} position
     * @property {number[]} quaternion
     * @typedef {object} PlaneParams
     * @property {number} rotation
     * @param {BodyParams & PlaneParams} params
     */
    addStaticPlane(params)
    {
        this.#world.addRigidBody(this.#createRigidBody(new this.#Engine.btStaticPlaneShape(
            new this.#Engine.btVector3(0, 0, params.rotation / -TAU), 0
        ), params.position, params.quaternion));
    }

    /**
     * @typedef {object} BoxParams
     * @property {number} width
     * @property {number} height
     * @property {number} depth
     * @param {KinematicParams & BoxParams} params
     */
    addKinematicBox(params)
    {
        const position =
        {
            x: this.#sharedTransformBuffer[40 + 7 * params.index],
            y: this.#sharedTransformBuffer[41 + 7 * params.index],
            z: this.#sharedTransformBuffer[42 + 7 * params.index]
        };

        const quaternion =
        [
            this.#sharedTransformBuffer[43 + 7 * params.index],
            this.#sharedTransformBuffer[44 + 7 * params.index],
            this.#sharedTransformBuffer[45 + 7 * params.index],
            this.#sharedTransformBuffer[46 + 7 * params.index]
        ];

        const body = this.#createRigidBody(new this.#Engine.btBoxShape(
            new this.#Engine.btVector3(params.width * 0.5, params.height * 0.5, params.depth * 0.5)
        ), position, quaternion);

        body.setCollisionFlags(body.getCollisionFlags() | KINEMATIC_COLLISION);
        this.#kinematicBodies[params.index] = body;
        this.#world.addRigidBody(body);
    }

    /** @param {KinematicParams} params */
    removeKinematicBody(params)
    {
        const body = this.#kinematicBodies[params.index];
        if (!body) return;
        body.forceActivationState(DISABLE_SIMULATION);

        this.#sharedTransformBuffer[40 + 7 * params.index] = 0;
        this.#sharedTransformBuffer[41 + 7 * params.index] = 0;
        this.#sharedTransformBuffer[42 + 7 * params.index] = 0;

        this.#sharedTransformBuffer[43 + 7 * params.index] = 0;
        this.#sharedTransformBuffer[44 + 7 * params.index] = 0;
        this.#sharedTransformBuffer[45 + 7 * params.index] = 0;
        this.#sharedTransformBuffer[46 + 7 * params.index] = 1;

        this.#Engine.destroy(body);
        this.#world.removeRigidBody(body);
    }

    /**
     * @typedef {object} ChassisParams
     * @property {number} mass
     * @param {BoxParams & ChassisParams} chassis
     * @param {object} tuning
     */
    addVehicle(chassis, tuning)
    {
        const shape = new this.#Engine.btBoxShape(new this.#Engine.btVector3(
            chassis.width * 0.5, chassis.height * 0.5, chassis.depth * 0.5
        ));

        const position =
        {
            x: this.#sharedTransformBuffer[0],
            y: this.#sharedTransformBuffer[1],
            z: this.#sharedTransformBuffer[2]
        };

        const quaternion =
        [
            this.#sharedTransformBuffer[3],
            this.#sharedTransformBuffer[4],
            this.#sharedTransformBuffer[5],
            this.#sharedTransformBuffer[6]
        ];

        const body = this.#createRigidBody(shape, position, quaternion, chassis.mass);
        const raycaster = new this.#Engine.btDefaultVehicleRaycaster(this.#world);
        this.#vehicle = new this.#Engine.btRaycastVehicle(tuning, body, raycaster);

        this.#vehicle.setCoordinateSystem(0, 1, 2);
        this.#world.addAction(this.#vehicle);
        this.#world.addRigidBody(body);

        return this.#vehicle;
    }

    /**
     * @param {object} tuning
     * @param {object} config
     * @param {number} radius
     * @param {number} index
     */
    addWheel(tuning, config, radius, index)
    {
        if (!this.#vehicle) return;

        const i = index * 7 + 7;

        const position = new this.#Engine.btVector3(
            this.#sharedTransformBuffer[i + 0],
            this.#sharedTransformBuffer[i + 1],
            this.#sharedTransformBuffer[i + 2]
        );

        const wheel = this.#vehicle.addWheel(
            position,
            this.#down,
            this.#left,
            config.suspensionRestLength,
            radius,
            tuning,
            index < 2
        );

        wheel.set_m_wheelsDampingCompression(config.dampingCompression);
        wheel.set_m_wheelsDampingRelaxation(config.dampingRelaxation);
        wheel.set_m_maxSuspensionTravelCm(config.suspensionTravelCm);
        wheel.set_m_suspensionStiffness(config.suspensionStiffness);
        wheel.set_m_maxSuspensionForce(config.suspensionForce);
        wheel.set_m_rollInfluence(config.rollInfluence);
        wheel.set_m_frictionSlip(config.frictionSlip);
    }

    /** @param {BodyParams} params */
    resetVehicle(params)
    {
        const { position, quaternion } = params;

        if (!this.#vehicle) return;

        this.#vehicle.setBrake(Infinity, 0);
        this.#vehicle.setBrake(Infinity, 1);
        this.#vehicle.setBrake(Infinity, 2);
        this.#vehicle.setBrake(Infinity, 3);

        this.#vehicle.setSteeringValue(0, 0);
        this.#vehicle.setSteeringValue(0, 1);

        this.#vehicle.applyEngineForce(0, 2);
        this.#vehicle.applyEngineForce(0, 3);

        this.#sharedTransformBuffer[0] = position.x;
        this.#sharedTransformBuffer[1] = position.y;
        this.#sharedTransformBuffer[2] = position.z;

        this.#sharedTransformBuffer[3] = quaternion[0];
        this.#sharedTransformBuffer[4] = quaternion[1];
        this.#sharedTransformBuffer[5] = quaternion[2];
        this.#sharedTransformBuffer[6] = quaternion[3];

        const transform = this.#vehicle.getChassisWorldTransform();
        transform.setRotation(new this.#Engine.btQuaternion(...quaternion));
        transform.setOrigin(new this.#Engine.btVector3(position.x, position.y, position.z));

        this.#vehicle.getRigidBody().setWorldTransform(transform);
    }

    #updateVehicle()
    {
        const wheels = this.#vehicle.getNumWheels();
        let transform, origin, rotation, i = wheels * 7 + 7;

        this.#vehicle.setBrake(this.#sharedTransformBuffer[i + 2], 0);
        this.#vehicle.setBrake(this.#sharedTransformBuffer[i + 2], 1);
        this.#vehicle.setBrake(this.#sharedTransformBuffer[i + 3], 2);
        this.#vehicle.setBrake(this.#sharedTransformBuffer[i + 3], 3);

        this.#vehicle.setSteeringValue(this.#sharedTransformBuffer[i + 1], 0);
        this.#vehicle.setSteeringValue(this.#sharedTransformBuffer[i + 1], 1);

        this.#vehicle.applyEngineForce(this.#sharedTransformBuffer[i + 0], 2);
        this.#vehicle.applyEngineForce(this.#sharedTransformBuffer[i + 0], 3);

        this.#sharedTransformBuffer[i + 4] = this.#vehicle.getCurrentSpeedKmHour();

        for (let w = 0; w < wheels; w++)
        {
            i = w * 7 + 7;
            this.#vehicle.updateWheelTransform(w, true);
            transform = this.#vehicle.getWheelTransformWS(w);

            origin = transform.getOrigin();
            rotation = transform.getRotation();

            this.#sharedTransformBuffer[i + 0] = origin.x();
            this.#sharedTransformBuffer[i + 1] = origin.y();
            this.#sharedTransformBuffer[i + 2] = origin.z();

            this.#sharedTransformBuffer[i + 3] = rotation.x();
            this.#sharedTransformBuffer[i + 4] = rotation.y();
            this.#sharedTransformBuffer[i + 5] = rotation.z();
            this.#sharedTransformBuffer[i + 6] = rotation.w();
        }

        transform = this.#vehicle.getChassisWorldTransform();

        origin = transform.getOrigin();
        rotation = transform.getRotation();

        this.#sharedTransformBuffer[0] = origin.x();
        this.#sharedTransformBuffer[1] = origin.y();
        this.#sharedTransformBuffer[2] = origin.z();

        this.#sharedTransformBuffer[3] = rotation.x();
        this.#sharedTransformBuffer[4] = rotation.y();
        this.#sharedTransformBuffer[5] = rotation.z();
        this.#sharedTransformBuffer[6] = rotation.w();
    }

    #updateKinematicBodies()
    {
        for (let b = 0; b < 32; b++)
        {
            const body = this.#kinematicBodies[b];

            if (body)
            {
                const motionState = body.getMotionState();
                motionState.getWorldTransform(this.#transform);

                this.#transform.getOrigin().setValue(
                    this.#sharedTransformBuffer[40 + 7 * b],
                    this.#sharedTransformBuffer[41 + 7 * b],
                    this.#sharedTransformBuffer[42 + 7 * b]
                );

                /* this.#transform.getRotation().setValue(
                    this.#sharedTransformBuffer[43 + 7 * b],
                    this.#sharedTransformBuffer[44 + 7 * b],
                    this.#sharedTransformBuffer[45 + 7 * b],
                    this.#sharedTransformBuffer[46 + 7 * b]
                ); */

                motionState.setWorldTransform(this.#transform);
            }
        }
    }

    /** @param {number} delta */
    update(delta)
    {
        this.#updateVehicle();
        this.#updateKinematicBodies();

        // Variable tick rate, advance the simulation by exactly `delta` seconds.
        // Works best in the browser since requestAnimationFrame `time`
        // value is not fixed (https://stackoverflow.com/a/21273467)
        this.#world.stepSimulation(delta, 0);
    }

    get vehicleTuning()
    {
        return new this.#Engine.btVehicleTuning();
    }

    dispose()
    {
        this.#kinematicBodies.splice(0);
        this.#world.__destroy__();
    }
}
