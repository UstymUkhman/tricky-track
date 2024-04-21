import Car from "./";
import SAB from "../utils/SAB";
import Config from "./config.json";
import Controls from "../controls";
import { Loader } from "../utils/Assets";
import { Emitter } from "../utils/Events";
import { Color } from "three/src/math/Color";
import { Mesh } from "three/src/objects/Mesh";
import { Vector3 } from "three/src/math/Vector3";
import { Quaternion } from "three/src/math/Quaternion";
import { BoxGeometry } from "three/src/geometries/BoxGeometry";
import { PositionalAudio } from "three/src/audio/PositionalAudio";
import { MeshBasicMaterial } from "three/src/materials/MeshBasicMaterial";

export default class SkylineR32 extends Car
{
    #active = true;
    #controls = Controls;
    #position = new Vector3();

    #tileScale = new Vector3();
    #tilePosition = new Vector3();
    #tileRotation = new Quaternion();
    /** @type {PositionalAudio} */ #engine;

    /** @param {import("three").AudioListener} listener @param {(chassis: Mesh) => void} onLoad */
    constructor(listener, onLoad)
    {
        super(Config.SkylineR32, onLoad);
        this.#engine = new PositionalAudio(listener);
        this.#load();
    }

    /** @override */
    async #load()
    {
        const [models, buffer] = await Promise.all(
        [
            super.load("R32/chassis.glb", "R32/wheel.glb"),
            Loader.loadAudio("engine.mp3")
        ]);

        models[0].add(this.#engine
            .setDistanceModel("exponential")
            .setBuffer(buffer)
            .setLoopStart(0.2)
            .setLoopEnd(1.2)
            .setLoop(true)
        );

        return this.#add(models);
    }

    /** @param {import("three").Group[]} models */
    #add([chassis, wheel])
    {
        const colliderMaterial = DEBUG && new MeshBasicMaterial({ wireframe: true, color: Color.NAMES.magenta });
        const chassisCollider = new Mesh(new BoxGeometry(13.569, 8.58, 33.25354), colliderMaterial);
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
    }

    /** @override @param {import("three").Plane} water */
    update(water)
    {
        const speed = Math.abs(super.update(
            this.#controls.accelerate,
            this.#controls.steer,
            this.#controls.brake
        )) * 2e-3;

        this.#engine.setPlaybackRate(Math.max(speed * 3, 1));
        this.#engine.setVolume(Math.max(speed * 15, 1));

        if (this.#active && super.intersects(water))
        {
            Emitter.dispatch("Camera::StopFollow");
            this.#active = false;
        }

        return !SAB.supported
            ? this.#position
            : this.#position.set(
                SAB.transformBuffer[0],
                SAB.transformBuffer[1],
                SAB.transformBuffer[2]
            );
    }

    /** @override @param {import("three").Matrix4} tile */
    reset(tile)
    {
        tile.decompose(this.#tilePosition, this.#tileRotation, this.#tileScale);
        this.#tilePosition.y = 5.14;

        setTimeout(() => this.#active = true, 500);
        super.reset(this.#tilePosition, this.#tileRotation);
    }

    /** @param {boolean} start */
    set engine(start)
    {
             if (start && !this.#engine.isPlaying) this.#engine.play();
        else if (this.#engine.isPlaying && !start) this.#engine.pause();
    }

    get length()
    {
        return 33.25354 / 4.545;
    }

    get active()
    {
        return this.#active;
    }

    /** @override */
    dispose()
    {
        super.dispose();
        this.#controls.dispose();
    }
}
