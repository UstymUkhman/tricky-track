import { DirectionalLightHelper } from "three/src/helpers/DirectionalLightHelper";
import { DirectionalLight } from "three/src/lights/DirectionalLight";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry";
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator';
import { PlaneHelper } from "three/src/helpers/PlaneHelper";
import { Water } from "three/examples/jsm/objects/Water";
import { RepeatWrapping } from "three/src/constants";
import { MathUtils } from "three/src/math/MathUtils";
import { Sky } from "three/examples/jsm/objects/Sky";

import { Vector3 } from "three/src/math/Vector3";
import { Plane } from "three/src/math/Plane";
import { Color } from "three/src/math/Color";
import { Loader } from '../utils/Assets';
import Mouse from "../controls/Mouse";
import { PI } from "../utils/Number";
import Car from "../cars/SkylineR32";
import RAF from "../utils/RAF";
import Track from "../track";
import Level from "./Level";

export default class extends Level
{
    #sky = new Sky();

    /** @type {Mouse} */ #mouse;
    /** @type {Track} */ #track;
    /** @type {Water} */ #water;

    #tick = this.#update.bind(this);
    /** @type {PMREMGenerator} */ #pmrem;
    #car = new Car(this.#setCamera.bind(this));
    #waterPlane = new Plane(new Vector3(0, 1, 0));

    #carRotation = this.#car.getRotation.bind(this.#car);
    #directionalLight = new DirectionalLight(Color.NAMES.white, 5);

    constructor()
    {
        super();

        this.scene.background = new Color(Color.NAMES.skyblue);
        this.#pmrem = new PMREMGenerator(this.renderer);

        const sun = this.#createSky();
        this.#createLights(sun);
        this.#createWater(sun);

        RAF.add(this.#tick);
    }

    /** @param {import("three").Mesh} chassis */
    #setCamera(chassis)
    {
        chassis.add(this.camera);
        this.#mouse = new Mouse(this.camera);

        this.camera.position.set(0, 10, -35);
        this.camera.rotation.set(0.25, Math.PI, 0);

        this.#track = new Track(() =>
        {
            RAF.pause = false;
        });
    }

    #createSky()
    {
        this.#sky.scale.setScalar(1e3);
        const { uniforms } = this.#sky.material;

        uniforms.rayleigh.value = 3;
        uniforms.turbidity.value = 10;
        uniforms.mieDirectionalG.value = 0.7;
        uniforms.mieCoefficient.value = 0.005;

        const sun = new Vector3().setFromSphericalCoords(
            1, MathUtils.degToRad(90 - 2), MathUtils.degToRad(0)
        );

        uniforms.sunPosition.value.copy(sun);

        this.scene.add(this.#sky).environment = this.#pmrem.fromScene(
            this.scene, 0, this.camera.near, this.camera.far
        ).texture;

        return sun;
    }

    /** @param {Vector3} sun */
    #createLights(sun)
    {
        this.#directionalLight.userData.position = sun.clone().multiplyScalar(1e3).clone();
        this.#directionalLight.position.copy(this.#directionalLight.userData.position);

        DEBUG && this.scene.add(new DirectionalLightHelper(
            this.#directionalLight, 10, Color.NAMES.yellow
        ));

        this.#directionalLight.shadow.camera.near = 8;
        this.#directionalLight.shadow.camera.far = 1024;
        this.#directionalLight.shadow.mapSize.setScalar(1024);

        this.#directionalLight.shadow.camera.top = 8;
        this.#directionalLight.shadow.camera.right = 64;
        this.#directionalLight.shadow.camera.bottom = -64;
        this.#directionalLight.shadow.camera.left = -64;

        this.#directionalLight.rotation.set(1, 0, 0);
        this.#directionalLight.castShadow = true;
        this.scene.add(this.#directionalLight);
    }

    /** @param {Vector3} sun */
    async #createWater(sun)
    {
        const water = await Loader.loadTexture("water.jpg");
        this.#waterPlane.translate(new Vector3(0, -50, 0));
        const { white, lightseagreen } = Color.NAMES;
        water.wrapS = water.wrapT = RepeatWrapping;

        DEBUG && this.scene.add(new PlaneHelper(
            this.#waterPlane, 1e3, Color.NAMES.blueviolet
        ));

        this.#water = new Water(new PlaneGeometry(1e3, 1e3),
        {
            sunDirection: sun.clone().normalize(),
            waterColor: lightseagreen,

            fog: !!this.scene.fog,
            distortionScale: 3.7,
            waterNormals: water,

            textureHeight: 512,
            textureWidth: 512,
            sunColor: white
        });

        this.#water.rotation.x = -PI.d2;
        this.#water.position.y = -0.95;
        this.scene.add(this.#water);
    }

    /** @param {number} delta */
    #update(delta)
    {
        this.stats?.begin();

        const position = this.#car.update(this.#waterPlane, this.#track.tile);
        const { x, z } = this.#directionalLight.userData.position;

        this.#water.material.uniforms.time.value += delta * 0.001;

        this.#directionalLight.position.x = position.x + x;
        this.#directionalLight.position.z = position.z + z;

        this.#sky.position.set(position.x, 0, position.z);

        this.#mouse.update(position, this.#carRotation);
        this.#track.update(delta, this.#car.speed);

        this.#water.position.x = position.x;
        this.#water.position.z = position.z;

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
        this.#car.dispose();
        super.dispose();
    }
}
