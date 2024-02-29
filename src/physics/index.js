/**
 * @typedef {object} DynamicBody
 * @property {import("three").Mesh} mesh
 * @property {any} body
 */

const Ammo = await (await import("./Ammo")).default();
import { Vector3 } from "three/src/math/Vector3";
import { PI } from "../utils/Number";

import {
    MASK_ALL,
    GROUP_STATIC,
    RIGID_MARGIN,
    GROUP_DYNAMIC,
    RIGID_FRICTION,
    RIGID_RESTITUTION,
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

    #linearFactor = new Vector3(1.0, 1.0, 1.0);
    #angularFactor = new Vector3(1.0, 1.0, 1.0);
    #transform = new this.#Engine.btTransform();

    /** @type {DynamicBody[]} */ #dynamicBodies = [];
    #broadphase = new this.#Engine.btDbvtBroadphase();

    #collision = new this.#Engine.btDefaultCollisionConfiguration();
    #solver = new this.#Engine.btSequentialImpulseConstraintSolver();
    #dispatcher = new this.#Engine.btCollisionDispatcher(this.#collision);

    #world = new this.#Engine.btDiscreteDynamicsWorld(
        this.#dispatcher, this.#broadphase, this.#solver, this.#collision
    );

    constructor()
    {
        this.#world.setGravity(new this.#Engine.btVector3(0, -9.81, 0));
    }

    /**
     * @param {unknown} shape
     * @param {import("three").Vector3} position
     * @param {import("three").Quaternion} quaternion
     * @param {number} mass
     * @param {number} margin
     * @returns {any} body
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
        body.setRestitution(this.#restitution);
        body.setFriction(this.#friction);

        return body;
    }

    /** @param {import("three").Mesh} mesh @param {unknown} shape @param {number} mass */
    #addDynamicBody(mesh, shape, mass = 0)
    {
        const body = this.#createRigidBody(shape, mesh.position.clone(), mesh.quaternion.clone(), mass);
        this.#world.addRigidBody(body, GROUP_DYNAMIC, MASK_ALL);
        this.#dynamicBodies.push({ mesh, body });
    }

    /** @param {import("three").Mesh} mesh @param {unknown} shape */
    #addStaticBody(mesh, shape)
    {
        this.#world.addRigidBody(this.#createRigidBody(
            shape, mesh.position.clone(), mesh.quaternion.clone()
        ), GROUP_STATIC, MASK_ALL);
    }

    /** @param {import("three").Mesh} mesh @param {number} mass */
    addDynamicBox(mesh, mass = 0)
    {
        const { width, height, depth } = mesh.geometry.parameters;

        this.#addDynamicBody(mesh, new this.#Engine.btBoxShape(
            new this.#Engine.btVector3(width * 0.5, height * 0.5, depth * 0.5)
        ), mass);
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
}

export default new Physics();
