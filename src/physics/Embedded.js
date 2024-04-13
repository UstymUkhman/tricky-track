const Ammo = await (await import("./Ammo")).default();
import { TAU } from "../utils/Number";

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
    #Engine = Ammo;

    #friction = RIGID_FRICTION;
    #restitution = RIGID_RESTITUTION;
    #linearDamping = RIGID_LINEAR_DAMPING;
    #angularDamping = RIGID_ANGULAR_DAMPING;

    #transform = new this.#Engine.btTransform();
    #left = new this.#Engine.btVector3(-1, 0, 0);
    #down = new this.#Engine.btVector3(0, -1, 0);

    #broadphase = new this.#Engine.btDbvtBroadphase();
    #collision = new this.#Engine.btDefaultCollisionConfiguration();
    #solver = new this.#Engine.btSequentialImpulseConstraintSolver();
    #dispatcher = new this.#Engine.btCollisionDispatcher(this.#collision);

    #world = new this.#Engine.btDiscreteDynamicsWorld(
        this.#dispatcher, this.#broadphase, this.#solver, this.#collision
    );

    /** @type {Map<string, object>} */ #kinematicBodies = new Map();
    /** @type {Map<string, object>} */ #staticBodies = new Map();

    /** @type {{ mesh: import("three").Mesh, body: object }[]} */
    #dynamicBodies = [];

    constructor()
    {
        this.#world.setGravity(new this.#Engine.btVector3(0, -9.81, 0));
    }

    /**
     * @param {object} shape
     * @param {import("three").Vector3Like} position
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

    /** @param {import("three").Mesh} mesh @param {object} shape */
    #addStaticBody(mesh, shape)
    {
        const body = this.#createRigidBody(shape, mesh.position.clone(), mesh.quaternion.clone());
        this.#staticBodies.set(mesh.uuid, body);
        this.#world.addRigidBody(body);
    }

    /** @param {import("three").Mesh} mesh */
    addStaticPlane(mesh)
    {
        this.#addStaticBody(mesh, new this.#Engine.btStaticPlaneShape(
            new this.#Engine.btVector3(0, 0, mesh.rotation.x / -TAU), 0
        ));
    }

    /** @param {import("three").Mesh} mesh */
    addStaticBox(mesh)
    {
        const { width, height, depth } = mesh.geometry.parameters;

        this.#addStaticBody(mesh, new this.#Engine.btBoxShape(
            new this.#Engine.btVector3(width * 0.5, height * 0.5, depth * 0.5)
        ));
    }

    /** @param {import("three").Mesh} mesh */
    removeStaticBody(mesh)
    {
        const body = this.#staticBodies.get(mesh.uuid);
        if (!body) return;
        body.forceActivationState(DISABLE_SIMULATION);

        this.#Engine.destroy(body);
        this.#world.removeRigidBody(body);
        this.#staticBodies.delete(mesh.uuid);
    }

    /** @param {import("three").Mesh} mesh @param {object} shape */
    #addKinematicBody(mesh, shape)
    {
        const body = this.#createRigidBody(shape, mesh.position.clone(), mesh.quaternion.clone());
        body.setCollisionFlags(body.getCollisionFlags() | KINEMATIC_COLLISION);
        this.#kinematicBodies.set(mesh.uuid, body);
        this.#world.addRigidBody(body);
    }

    /** @param {import("three").Mesh} mesh */
    addKinematicBox(mesh)
    {
        const { width, height, depth } = mesh.geometry.parameters;

        this.#addKinematicBody(mesh, new this.#Engine.btBoxShape(
            new this.#Engine.btVector3(width * 0.5, height * 0.5, depth * 0.5)
        ));
    }

    /** @param {import("three").Mesh} mesh */
    moveKinematicBody(mesh)
    {
        const body = this.#kinematicBodies.get(mesh.uuid);
        if (!body) return;

        const motionState = body.getMotionState();
        this.#transform.getOrigin().setValue(...mesh.position);
        motionState && motionState.setWorldTransform(this.#transform);
    }

    /** @param {import("three").Mesh} mesh */
    removeKinematicBody(mesh)
    {
        const body = this.#kinematicBodies.get(mesh.uuid);
        if (!body) return;
        body.forceActivationState(DISABLE_SIMULATION);

        this.#Engine.destroy(body);
        this.#world.removeRigidBody(body);
        this.#kinematicBodies.delete(mesh.uuid);
    }

    /** @param {import("three").Mesh} mesh @param {object} shape @param {number} mass */
    #addDynamicBody(mesh, shape, mass = 0)
    {
        const body = this.#createRigidBody(shape, mesh.position.clone(), mesh.quaternion.clone(), mass);
        this.#dynamicBodies.push({ mesh, body });
        this.#world.addRigidBody(body);
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
    teleportDynamicBody(mesh)
    {
        const index = this.#dynamicBodies.findIndex(({ mesh: { uuid }}) => mesh.uuid === uuid);
        if (index === -1) return;
        const { position, quaternion } = mesh;

        this.#transform.setRotation(new Ammo.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
        this.#transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
        this.#dynamicBodies[index].body.setWorldTransform(this.#transform);
    }

    /** @param {import("three").Mesh} mesh */
    removeDynamicBody(mesh)
    {
        const index = this.#dynamicBodies.findIndex(({ mesh: { uuid } }) => mesh.uuid === uuid);

        if (index === -1) return;
        const { body } = this.#dynamicBodies[index];
        body.forceActivationState(DISABLE_SIMULATION);

        this.#Engine.destroy(body);
        this.#world.removeRigidBody(body);
        this.#dynamicBodies.splice(index, 1);
    }

    /** @param {import("three").Mesh} chassis @param {object} tuning @param {number} mass @returns {object} vehicle */
    addVehicle(chassis, tuning, mass)
    {
        this.addDynamicBox(chassis, mass);
        const { body } = this.#dynamicBodies.at(-1);

        const raycaster = new this.#Engine.btDefaultVehicleRaycaster(this.#world);
        const vehicle = new this.#Engine.btRaycastVehicle(tuning, body, raycaster);

        vehicle.setCoordinateSystem(0, 1, 2);
        this.#world.addAction(vehicle);

        return vehicle;
    }

    /**
     * @param {object} vehicle
     * @param {object} tuning
     * @param {object} config
     * @param {import("three").Vector3} position
     * @param {number} radius
     * @param {number} index
     */
    addWheel(vehicle, tuning, config, position, radius, index)
    {
        const wheel = vehicle.addWheel(
            new this.#Engine.btVector3(...position),
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

    /** @param {number} delta */
    update(delta)
    {
        for (let b = this.#dynamicBodies.length; b--; )
        {
            const { body, mesh } = this.#dynamicBodies[b];
            body.getMotionState().getWorldTransform(this.#transform);

            const origin = this.#transform.getOrigin();
            const rotation = this.#transform.getRotation();
            const x = origin.x(), y = origin.y(), z = origin.z();

            mesh.userData.x = x;
            mesh.userData.y = y;
            mesh.userData.z = z;

            mesh.position.set(x, y, z);
            mesh.userData.position?.set(x, y, z);
            mesh.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
        }

        this.#world.stepSimulation(delta, 10);
    }

    /** @returns {object} */
    get vehicleTuning()
    {
        return new this.#Engine.btVehicleTuning();
    }

    dispose()
    {
        this.#kinematicBodies.clear();
        this.#dynamicBodies.splice(0);
        this.#staticBodies.clear();
        this.#world.__destroy__();
    }
}
