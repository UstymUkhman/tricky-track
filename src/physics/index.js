/**
 * @typedef {object} DynamicBody
 * @property {import("three").Mesh} mesh
 * @property {object} body
 */

const Ammo = await (await import("./Ammo")).default();
import { Vector3 } from "three/src/math/Vector3";
import { PI } from "../utils/Number";

import {
    RIGID_MARGIN,
    RIGID_FRICTION,
    RIGID_RESTITUTION,
    RIGID_LINEAR_FACTOR,
    RIGID_ANGULAR_FACTOR,
    DISABLE_DEACTIVATION,
    RIGID_LINEAR_DAMPING,
    RIGID_ANGULAR_DAMPING
} from "./constants";

class Physics
{
    #Engine = Ammo;

    #friction = RIGID_FRICTION;
    #restitution = RIGID_RESTITUTION;
    #linearDamping = RIGID_LINEAR_DAMPING;
    #angularDamping = RIGID_ANGULAR_DAMPING;

    #left = this.#Engine.btVector3(-1, 0, 0);
    #down = this.#Engine.btVector3(0, -1, 0);
    #transform = new this.#Engine.btTransform();

    /** @type {DynamicBody[]} */ #dynamicBodies = [];
    #broadphase = new this.#Engine.btDbvtBroadphase();

    #collision = new this.#Engine.btDefaultCollisionConfiguration();
    #solver = new this.#Engine.btSequentialImpulseConstraintSolver();
    #dispatcher = new this.#Engine.btCollisionDispatcher(this.#collision);

    #world = new this.#Engine.btDiscreteDynamicsWorld(
        this.#dispatcher, this.#broadphase, this.#solver, this.#collision
    );

    #linearFactor = new Vector3(RIGID_LINEAR_FACTOR, RIGID_LINEAR_FACTOR, RIGID_LINEAR_FACTOR);
    #angularFactor = new Vector3(RIGID_ANGULAR_FACTOR, RIGID_ANGULAR_FACTOR, RIGID_ANGULAR_FACTOR);

    constructor()
    {
        this.#world.setGravity(new this.#Engine.btVector3(0, -9.81, 0));
    }

    /**
     * @param {object} shape
     * @param {import("three").Vector3} position
     * @param {import("three").Quaternion} quaternion
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
        transform.setOrigin(new this.#Engine.btVector3(...position));
        transform.setRotation(new this.#Engine.btQuaternion(...quaternion));

        const body = new this.#Engine.btRigidBody(
            new this.#Engine.btRigidBodyConstructionInfo(
                mass, new this.#Engine.btDefaultMotionState(transform), shape, inertia
            )
        );

        body.setAngularFactor(new this.#Engine.btVector3(...this.#angularFactor));
        body.setLinearFactor(new this.#Engine.btVector3(...this.#linearFactor));
        body.setDamping(this.#linearDamping, this.#angularDamping);

        body.setActivationState(DISABLE_DEACTIVATION);
        body.setRestitution(this.#restitution);
        body.setFriction(this.#friction);

        return body;
    }

    /** @param {import("three").Mesh} mesh @param {object} shape @param {number} mass */
    #addDynamicBody(mesh, shape, mass = 0)
    {
        const body = this.#createRigidBody(shape, mesh.position.clone(), mesh.quaternion.clone(), mass);
        this.#dynamicBodies.push({ mesh, body });
        this.#world.addRigidBody(body);
    }

    /** @param {import("three").Mesh} mesh @param {object} shape */
    #addStaticBody(mesh, shape)
    {
        this.#world.addRigidBody(this.#createRigidBody(shape, mesh.position.clone(), mesh.quaternion.clone()));
    }

    /** @param {import("three").Mesh} mesh @param {number} mass */
    addDynamicBox(mesh, mass = 0)
    {
        const { width, height, depth } = mesh.geometry.parameters;

        this.#addDynamicBody(mesh, new this.#Engine.btBoxShape(
            new this.#Engine.btVector3(width * 0.5, height * 0.5, depth * 0.5)
        ), mass);
    }

    /**
     * @param {object} vehicle
     * @param {object} config
     * @param {import("three").Vector3} position
     * @param {number} radius
     * @param {object} tuning
     * @param {boolean} front
     */
    addWheel(vehicle, config, position, radius, tuning, front)
    {
        const wheel = vehicle.addWheel(
            this.#Engine.btVector3(...position),
            this.#down,
            this.#left,
            config.suspensionRestLength,
            radius,
            tuning,
            front
        );

        wheel.set_m_wheelsDampingCompression(config.dampingCompression);
        wheel.set_m_wheelsDampingRelaxation(config.dampingRelaxation);
        // wheel.set_m_maxSuspensionTravelCm(config.suspensionTravelCm);
        wheel.set_m_suspensionStiffness(config.suspensionStiffness);
        // wheel.set_m_maxSuspensionForce(config.suspensionForce);
        wheel.set_m_rollInfluence(config.rollInfluence);
        wheel.set_m_frictionSlip(config.frictionSlip);
    }

    /** @param {import("three").Mesh} mesh @param {object} tuning @param {number} mass @returns {object} vehicle */
    addVehicle(mesh, tuning, mass)
    {
        this.addDynamicBox(mesh, mass);
        const { body } = this.#dynamicBodies.at(-1);

        const raycaster = new this.#Engine.btDefaultVehicleRaycaster(this.#world);
        const vehicle = new this.#Engine.btRaycastVehicle(tuning, body, raycaster);

        vehicle.setCoordinateSystem(0, 1, 2);
        this.#world.addAction(vehicle);

        return vehicle;
    }

    /** @param {import("three").Mesh} mesh */
    addStaticPlane(mesh)
    {
        this.#addStaticBody(mesh, new this.#Engine.btStaticPlaneShape(
            new this.#Engine.btVector3(0, 0, mesh.rotation.x / -PI.m2), 0
        ));
    }

    /** @param {number} delta */
    update(delta)
    {
        for (let b = 0, l = this.#dynamicBodies.length; b < l; b++)
        {
            const { body, mesh } = this.#dynamicBodies[b];
            body.getMotionState().getWorldTransform(this.#transform);

            const origin = this.#transform.getOrigin();
            const rotation = this.#transform.getRotation();

            mesh.position.set(origin.x(), origin.y(), origin.z());
            mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }

        this.#world.stepSimulation(delta, 10);
    }

    /** @returns {object} */
    get vehicleTuning()
    {
        return new this.#Engine.btVehicleTuning();
    }
}

export default new Physics();
