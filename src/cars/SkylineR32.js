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

    constructor()
    {
        super(Config.SkylineR32);
    }

    /** @param {import("three").Group[]} models */
    #add([chassis, wheel])
    {
        const colliderMaterial = DEBUG && new MeshBasicMaterial({ wireframe: true, color: Color.NAMES.magenta });
        const chassisCollider = new Mesh(new BoxGeometry(13.569, 8.58, 33.25354), colliderMaterial);
        const wheelCollider = new Mesh(new BoxGeometry(2.078, 4.773, 4.773), colliderMaterial);

        chassisCollider.userData = { position: this.#position };
        chassis.position.set(0, -3.84, -1.42);
        chassisCollider.position.y = 5.14;
        chassis.scale.setScalar(10);
        chassisCollider.add(chassis);
        Emitter.dispatch("Scene::Add", chassisCollider);

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

        super.add(chassisCollider, [frontLeftCollider, frontRightCollider, backLeftCollider, backRightCollider]);
    }

    /** @override */
    async load()
    {
        const models = await super.load("R32/chassis.glb", "R32/wheel.glb");
        this.#add(models);
        return models[0];
    }

    /** @override */
    update()
    {
        super.update(this.#controls.accelerate, this.#controls.steer, this.#controls.brake);
        if (this.#position.y < 0) super.reset(5.14);
        return this.#position;
    }

    /** @override */
    dispose()
    {
        super.dispose();
        this.#controls.dispose();
    }
}
