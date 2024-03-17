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

export default class extends Level
{
    /** @type {import("three").Uniform} */ #waterTime;
    /** @type {PMREMGenerator} */ #pmrem;
    /** @type {number} */ #size = 1e4;

    #tick = this.#update.bind(this);
    /** @type {Mouse} */ #mouse;
    /** @type {Track} */ #track;

    constructor()
    {
        super();

        this.#pmrem = new PMREMGenerator(this.renderer);
        this.#createWater(this.#createSky());

        this.#track = new Track(
            this.scene.environment
        );

        RAF.add(this.#tick);
        this.#setCamera();
    }

    #createSky()
    {
        const sky = new Sky();
        sky.scale.setScalar(this.#size);
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

        const water = new Water(new PlaneGeometry(this.#size, this.#size),
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

        water.material.uniforms.sunDirection.value.copy(sun).normalize();
        this.#waterTime = water.material.uniforms.time;

        water.rotation.x = -PI.d2;
        water.position.y = -1.0;

        this.scene.add(water);
        RAF.pause = false;
    }

    #setCamera()
    {
        this.camera.rotation.y = Math.PI;
        this.#mouse = new Mouse(this.camera);
    }

    /** @param {number} delta */
    #update(delta)
    {
        this.stats?.begin();

        this.#waterTime.value += delta * 0.001;

        super.update();

        this.stats?.end();
    }

    /** @override */
    dispose()
    {
        RAF.remove(this.#tick);
        this.#pmrem.dispose();
        this.#mouse.dispose();
        this.#track.dispose();
        super.dispose();
    }
}
