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
    #vehicle;
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

    /** @type {object[]} */ #kinematicBodies = new Array(32);

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

    /** @param {import("three").Mesh} mesh */
    addStaticPlane(mesh)
    {
        this.#world.addRigidBody(this.#createRigidBody(new this.#Engine.btStaticPlaneShape(
            new this.#Engine.btVector3(0, 0, mesh.rotation.x / -TAU), 0
        ), mesh.position.clone(), mesh.quaternion.clone()));
    }

    /** @param {import("three").Mesh} mesh @param {number} index */
    addKinematicBox(mesh, index)
    {
        const { width, height, depth } = mesh.geometry.parameters;

        const body = this.#createRigidBody(new this.#Engine.btBoxShape(
            new this.#Engine.btVector3(width * 0.5, height * 0.5, depth * 0.5)
        ), mesh.position.clone(), mesh.quaternion.clone());

        body.setCollisionFlags(body.getCollisionFlags() | KINEMATIC_COLLISION);
        this.#kinematicBodies[index] = body;
        this.#world.addRigidBody(body);
    }

    /** @param {import("three").Vector3} position @param {number} index */
    moveKinematicBody(position, index)
    {
        const body = this.#kinematicBodies[index];
        if (!body) return;

        const motionState = body.getMotionState();
        motionState.getWorldTransform(this.#transform);
        this.#transform.getOrigin().setValue(...position);
        motionState.setWorldTransform(this.#transform);
    }

    /** @param {number} index */
    removeKinematicBody(index)
    {
        const body = this.#kinematicBodies[index];
        if (!body) return;

        body.forceActivationState(DISABLE_SIMULATION);
        this.#Engine.destroy(body);
        this.#world.removeRigidBody(body);
    }

    /** @param {import("three").Mesh} chassis @param {object} tuning @param {number} mass @returns {object} vehicle */
    addVehicle(chassis, tuning, mass)
    {
        const { width, height, depth } = chassis.geometry.parameters;

        const shape = new this.#Engine.btBoxShape(new this.#Engine.btVector3(
            width * 0.5, height * 0.5, depth * 0.5
        ));

        const body = this.#createRigidBody(shape, chassis.position.clone(), chassis.quaternion.clone(), mass);
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
     * @param {import("three").Vector3} position
     * @param {number} radius
     * @param {number} index
     */
    addWheel(tuning, config, position, radius, index)
    {
        const wheel = this.#vehicle.addWheel(
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

    /** @param {import("three").Mesh} chassis */
    resetVehicle(chassis)
    {
        const transform = this.#vehicle.getChassisWorldTransform();
        transform.setOrigin(new this.#Engine.btVector3(...chassis.position));
        transform.setRotation(new this.#Engine.btQuaternion(...chassis.quaternion));

        this.#vehicle.getRigidBody().setWorldTransform(transform);
    }

    /** @param {number} delta */
    update(delta)
    {
        this.#world.stepSimulation(delta, 10);
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
