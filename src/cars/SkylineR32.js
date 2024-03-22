import Car from "./Car";
import Config from "./config.json";
import Controls from "../controls";
import { Emitter } from "../utils/Events";
import { Color } from "three/src/math/Color";
import { Mesh } from "three/src/objects/Mesh";
import { Vector3 } from "three/src/math/Vector3";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";

export default class SkylineR32 extends Car
{
    #controls = Controls;
    #position = new Vector3();

    /** @param {(chassis: import("three").Mesh) => void} onLoad */
    constructor(onLoad)
    {
        super(Config.SkylineR32);
        this.#load().then(onLoad);
    }

    /** @param {import("three").Group[]} models */
    #add([chassis, wheel])
    {
        const colliderMaterial = DEBUG && new MeshBasicMaterial({ wireframe: true, color: Color.NAMES.magenta });
        const chassisCollider = new Mesh(new BoxGeometry(13.569, 8.58, 33.25354), colliderMaterial);
        const collider = new Mesh(new BoxGeometry(13.569, 9.15 + 0.5, 33.25354), colliderMaterial);
        const wheelCollider = new Mesh(new BoxGeometry(2.078, 4.773, 4.773), colliderMaterial);

        chassisCollider.userData = { position: this.#position };
        chassis.traverse(child => child.castShadow = true);
        chassis.position.set(0, -3.84, -1.42);
        chassisCollider.position.y = 5.14;
        chassis.scale.setScalar(10);
        chassisCollider.add(chassis);
        Emitter.dispatch("Scene::Add", chassisCollider);

        wheel.traverse(child => child.castShadow = true);
        const wheelMesh = wheel.clone();
        wheelMesh.scale.setScalar(10);

        const frontLeftWheel = wheelMesh.clone();
        frontLeftWheel.position.set(0.555, 0, 0.05);
        frontLeftWheel.rotation.set(-0.6, 0, Math.PI);

        const frontLeftCollider = wheelCollider.clone();
        frontLeftCollider.position.set(5.515, -2.3865, 9.52);
        frontLeftCollider.add(frontLeftWheel);
        Emitter.dispatch("Scene::Add", frontLeftCollider);

        const frontRightWheel = wheelMesh.clone();
        frontRightWheel.position.set(-0.555, 0, 0.05);

        const frontRightCollider = wheelCollider.clone();
        frontRightCollider.position.set(-5.475, -2.3865, 9.52);
        frontRightCollider.add(frontRightWheel);
        Emitter.dispatch("Scene::Add", frontRightCollider);

        const backLeftWheel = wheelMesh.clone();
        backLeftWheel.position.set(0.555, 0, 0.05);
        backLeftWheel.rotation.set(-0.6, 0, Math.PI);

        const backLeftCollider = wheelCollider.clone();
        backLeftCollider.position.set(5.515, -2.3865, -9.68);
        backLeftCollider.add(backLeftWheel);
        Emitter.dispatch("Scene::Add", backLeftCollider);

        const backRightWheel = wheelMesh.clone();
        backRightWheel.position.set(-0.555, 0, 0.05);

        const backRightCollider = wheelCollider.clone();
        backRightCollider.position.set(-5.475, -2.3865, -9.68);
        backRightCollider.add(backRightWheel);
        Emitter.dispatch("Scene::Add", backRightCollider);

        super.add(chassisCollider, [
            frontLeftCollider,
            frontRightCollider,
            backLeftCollider,
            backRightCollider
        ]);

        collider.position.y -= 0.285 + 0.25;
        super.createBoundingBox(collider);
    }

    /** @override */
    async #load()
    {
        const models = await super.load("R32/chassis.glb", "R32/wheel.glb");
        this.#add(models);
        return models[0];
    }

    /** @override @param {Vector3} tile */
    update(tile)
    {
        super.update(this.#controls.accelerate, this.#controls.steer, this.#controls.brake);

        // TODO: `super.reset` when `this.bbox` intersects `Water.PlaneGeometry`:
        if (this.#position.y < 0)
        {
            tile.y = 5.14;
            super.reset(tile);
        }

        return this.#position;
    }

    /** @override */
    dispose()
    {
        super.dispose();
        this.#controls.dispose();
    }
}
