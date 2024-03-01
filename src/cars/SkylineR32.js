import Car from "./Car";
import { Emitter } from "../utils/Events";

export default class SkylineR32 extends Car
{
    constructor()
    {
        super(800);
    }

    /** @param {import("three").Group[]} models */
    #add([chassis, wheel])
    {
        chassis.position.y = -5.3;
        chassis.rotation.y = Math.PI;
        chassis.scale.setScalar(10);
        Emitter.dispatch("Scene::Add", chassis);

        const frontRight = wheel.clone();
        frontRight.rotation.y = Math.PI;
        frontRight.scale.setScalar(10);
        frontRight.position.set(-11.9, -5.3, 0);
        Emitter.dispatch("Scene::Add", frontRight);

        const backRight = frontRight.clone();
        backRight.position.z = 19.2;
        Emitter.dispatch("Scene::Add", backRight);

        const backLeft = wheel.clone();
        backLeft.rotation.x = -2.5;
        backLeft.scale.setScalar(10);
        backLeft.position.set(11.5, 3.85, 22.2);
        Emitter.dispatch("Scene::Add", backLeft);

        const frontLeft = backLeft.clone();
        frontLeft.position.z = 3;
        Emitter.dispatch("Scene::Add", frontLeft);

        super.add(chassis, [frontLeft, frontRight, backLeft, backRight]);
    }

    /** @override */
    async load()
    {
        this.#add(await super.load("chassis.glb", "wheel.glb"));
    }

    /** @override */
    update()
    {
        super.update();
    }
}
