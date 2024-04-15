import { DirectionalLightHelper } from "three/src/helpers/DirectionalLightHelper";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { SSAARenderPass } from "three/examples/jsm/postprocessing/SSAARenderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass";
import { DirectionalLight } from "three/src/lights/DirectionalLight";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry";
// import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";

import { PMREMGenerator } from 'three/src/extras/PMREMGenerator';
import { PlaneHelper } from "three/src/helpers/PlaneHelper";
import { Water } from "three/examples/jsm/objects/Water";
import { RepeatWrapping } from "three/src/constants";
import { MathUtils } from "three/src/math/MathUtils";
import { Sky } from "three/examples/jsm/objects/Sky";
import { Vector3 } from "three/src/math/Vector3";
import { Plane } from "three/src/math/Plane";
import { Color } from "three/src/math/Color";
import { Clock } from "three/src/core/Clock";

import { Loader } from '../utils/Assets';
import Viewport from "../utils/Viewport";
import { HPI } from "../utils/Number";
import Mouse from "../controls/Mouse";
import Worker from "../utils/worker";
import Car from "../cars/SkylineR32";
import Physics from "../physics";
import RAF from "../utils/RAF";
import SAB from "../utils/SAB";
import Track from "../track";
import Level from "./Level";

export default class extends Level
{
    #physicsInit = this.#setCamera.bind(this);
    #waterPlane = new Plane(new Vector3(0, 1, 0));
    #directionalLight = new DirectionalLight(Color.NAMES.white, 5);

    /** @type {SSAARenderPass | undefined} */ #smaa;
    /** @type {ShaderPass | undefined} */ #fxaa;
    /** @type {EffectComposer} */ #composer;
    /** @type {PMREMGenerator} */ #pmrem;

    #scale = this.#resize.bind(this);
    #tick = this.#update.bind(this);

    /** @type {Water} */ #water;
    /** @type {Track} */ #track;
    /** @type {Mouse} */ #mouse;

    /** @type {Car} */ #car;
    #clock = new Clock();
    #sky = new Sky();

    constructor()
    {
        super();

        this.scene.background = new Color(Color.NAMES.skyblue);
        this.#pmrem = new PMREMGenerator(this.renderer);
        Viewport.addResizeCallback(this.#scale);
        const sun = this.#createSky();

        this.#setEffectComposer();
        this.#createLights(sun);
        this.#createWater(sun);

        RAF.add(this.#tick);
        this.#setPhysics();
    }

    #setCamera()
    {
        this.#car = new Car((chassis) =>
        {
            chassis.add(this.camera);
            this.#mouse = new Mouse(this.camera);

            this.camera.position.set(0, 10, -35);
            this.camera.rotation.set(0.25, Math.PI, 0);

            this.#track = new Track(() =>
            {
                SAB.supported && Worker.post("Physics::Start");
                RAF.pause = false;
            });
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

    #setEffectComposer()
    {
        const { width, height } = Viewport.size;
        this.#composer = new EffectComposer(this.renderer);
        this.#composer.addPass(new RenderPass(this.scene, this.camera));

        {
            this.#smaa = new SSAARenderPass(this.scene, this.camera);

            this.#smaa.sampleLevel = 2;
            this.#smaa.setSize(width, height);
            this.#composer.addPass(this.#smaa);
        }

        this.#composer.addPass(
            new BokehPass(this.scene, this.camera,
            {
                maxblur: 0.002,
                aperture: 1.0,
                focus: 35.0
            })
        );

        this.#composer.addPass(new OutputPass());
        this.#composer.setSize(width, height);

        /* {
            this.#fxaa = new ShaderPass(FXAAShader);
            const ratio = this.renderer.getPixelRatio();

            this.#fxaa.material.uniforms.resolution.value.x = 1 / (width * ratio);
            this.#fxaa.material.uniforms.resolution.value.y = 1 / (height * ratio);

            this.#composer.addPass(this.#fxaa);
        } */
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

        this.#water.position.y = -0.95;
        this.#water.rotation.x = -HPI;
        this.scene.add(this.#water);
    }

    #setPhysics()
    {
        !SAB.supported
            ? this.#setCamera()
            : Worker.add("Physics::Init", this.#physicsInit).post("Physics::Init");
    }

    /** @override @param {number} width @param {number} height */
    #resize(width, height)
    {
        this.#composer.setSize(width, height);
        this.#smaa?.setSize(width, height);

        if (this.#fxaa)
        {
            const ratio = this.renderer.getPixelRatio();

            this.#fxaa.material.uniforms.resolution.value.x = 1 / (width * ratio);
            this.#fxaa.material.uniforms.resolution.value.y = 1 / (height * ratio);
        }
    }

    /** @param {number} delta */
    #update(delta)
    {
        this.stats?.begin();

        const position = this.#car.update(this.#waterPlane, this.#track.tile);
        const { x, z } = this.#directionalLight.userData.position;
        const { rotation, direction, speed } = this.#car;
        const deltaTime = this.#clock.getDelta();

        this.#water.material.uniforms.time.value += deltaTime;

        this.#directionalLight.position.x = position.x + x;
        this.#directionalLight.position.z = position.z + z;

        this.#sky.position.set(position.x, 0, position.z);
        this.#mouse.update(position, rotation, direction);

        this.#water.position.x = position.x;
        this.#water.position.z = position.z;

        this.#track.update(delta, speed);

        !SAB.supported &&
            Physics.update(deltaTime);

        this.#composer.render();
        this.stats?.end();
    }

    /** @override */
    dispose()
    {
        Viewport.removeResizeCallback(this.#scale);
        Worker.post("Physics::Dispose");
        this.#composer.dispose();
        RAF.remove(this.#tick);

        this.#pmrem.dispose();
        this.#smaa?.dispose();
        this.#fxaa?.dispose();

        this.#track.dispose();
        this.#mouse.dispose();
        this.#car.dispose();

        Worker.dispose();
        super.dispose();
    }
}
