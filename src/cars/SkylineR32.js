import { Emitter } from "../utils/Events";
import { Loader } from '../utils/Assets';
import Car from "./Car";

export default class SkylineR32 extends Car
{
    constructor()
    {
        super();
        this.#load();
    }

    async #load()
    {
        const [chasee, wheel] = await Promise.all(
        [
            Loader.loadGLTF("chasee.glb"),
            Loader.loadGLTF("wheel.glb")
        ]);

        chasee.scene.position.y = -5.3;
        chasee.scene.rotation.y = Math.PI;
        chasee.scene.scale.setScalar(10);
        Emitter.dispatch("Scene::Add", chasee.scene);

        const topRight = wheel.scene.clone();
        topRight.rotation.y = Math.PI;
        topRight.scale.setScalar(10);
        topRight.position.set(-11.9, -5.3, 0);
        Emitter.dispatch("Scene::Add", topRight);

        const bottomRight = topRight.clone();
        bottomRight.position.z = 19.2;
        Emitter.dispatch("Scene::Add", bottomRight);

        const bottomLeft = wheel.scene.clone();
        bottomLeft.rotation.x = -2.5;
        bottomLeft.scale.setScalar(10);
        bottomLeft.position.set(11.5, 3.85, 22.2);
        Emitter.dispatch("Scene::Add", bottomLeft);

        const topLeft = bottomLeft.clone();
        topLeft.position.z = 3;
        Emitter.dispatch("Scene::Add", topLeft);
    }
}
