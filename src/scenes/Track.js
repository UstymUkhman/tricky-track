import { PlaneGeometry } from "three/src/geometries/PlaneGeometry";
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator';
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { MathUtils } from "three/src/math/MathUtils";
import { RepeatWrapping } from "three/src/constants";
import { Vector3 } from "three/src/math/Vector3";
import { Color } from "three/src/math/Color";
import { Loader } from '../utils/Assets';
import Mouse from "../controls/Mouse";
import { PI } from "../utils/Number";
import RAF from "../utils/RAF";
import Track from "../track";
import Level from "./Level";
import Cars from "../cars";

export default class extends Level
{
    #cars = new Cars(this.#setCamera.bind(this));
    /** @type {PMREMGenerator} */ #pmrem;
    #tick = this.#update.bind(this);

    /** @type {Water} */ #water;
    /** @type {Track} */ #track;
    /** @type {Mouse} */ #mouse;

    constructor()
    {
        super();

        this.#pmrem = new PMREMGenerator(this.renderer);
        this.#createWater(this.#createSky());

        this.#track = new Track(
            this.scene.environment
        );

        RAF.add(this.#tick);
    }

    /** @param {import("three").Mesh} chassis */
    #setCamera(chassis)
    {
        chassis.add(this.camera);
        this.#mouse = new Mouse(this.camera);

        this.camera.position.set(0, 10, -35);
        this.camera.rotation.set(0.25, Math.PI, 0);

        RAF.pause = false;
    }

    #createSky()
    {
        const sky = new Sky();
        sky.scale.setScalar(1e4);
        const { uniforms } = sky.material;

        uniforms.rayleigh.value = 3;
        uniforms.turbidity.value = 10;
        uniforms.mieDirectionalG.value = 0.7;
        uniforms.mieCoefficient.value = 0.005;

        const sun = new Vector3().setFromSphericalCoords(
            1, MathUtils.degToRad(90 - 2), MathUtils.degToRad(0)
        );

        uniforms.sunPosition.value.copy(sun);

        this.scene.add(sky).environment = this.#pmrem.fromScene(
            this.scene, 0, this.camera.near, this.camera.far
        ).texture;

        return sun;
    }

    /** @param {Vector3} sun */
    async #createWater(sun)
    {
        const normals = await Loader.loadTexture("water.jpg");
        normals.wrapS = normals.wrapT = RepeatWrapping;
        const { white, lightseagreen } = Color.NAMES;

        this.#water = new Water(new PlaneGeometry(1e3, 1e3),
        {
            sunDirection: new Vector3(),
            waterColor: lightseagreen,

            fog: !!this.scene.fog,
            waterNormals: normals,
            distortionScale: 3.7,

            textureHeight: 512,
            textureWidth: 512,
            sunColor: white
        });

        this.#water.material.uniforms.sunDirection.value.copy(sun).normalize();

        this.#water.rotation.x = -PI.d2;
        this.#water.position.y = -0.5;
        this.scene.add(this.#water);
    }

    /** @param {number} delta */
    #update(delta)
    {
        this.stats?.begin();

        this.#water.material.uniforms.time.value += delta * 0.001;

        const { x, z } = this.#cars.update();

        this.#water.position.x = x;
        this.#water.position.z = z;

        super.update();

        this.stats?.end();
    }

    /** @override */
    dispose()
    {
        RAF.remove(this.#tick);
        this.#pmrem.dispose();
        this.#track.dispose();
        this.#mouse.dispose();
        this.#cars.dispose();
        super.dispose();
    }
}
