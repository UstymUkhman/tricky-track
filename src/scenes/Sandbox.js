import { DirectionalLightHelper } from "three/src/helpers/DirectionalLightHelper";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DirectionalLight } from "three/src/lights/DirectionalLight";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry";
import Stats from "three/examples/jsm/libs/stats.module";

import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import { Color } from "three/src/math/Color";
import { Fog } from "three/src/scenes/Fog";
import Ground from "../materials/Ground";

import { PI } from "../utils/Number";
import Physics from "../physics";
import RAF from "../utils/RAF";
import Level from "./Level";
import Cars from "../cars";

export default class Sandbox extends Level
{
    /** @type {OrbitControls} */ #controls;
    #tick = this.#update.bind(this);
    /** @type {Stats} */ #stats;
    #cars = new Cars();

    constructor()
    {
        super();

        this.#setScene();
        this.#setCamera();
        this.#createStats();

        this.#createLights();
        this.#createGround();
        this.#createControls();

        RAF.add(this.#tick);
        RAF.pause = false;
    }

    #setScene()
    {
        this.scene.background = new Color(Color.NAMES.whitesmoke);
        this.scene.fog = new Fog(Color.NAMES.whitesmoke, 100, 250);
    }

    #setCamera()
    {
        this.camera.position.set(0, 25, 50);
    }

    #createStats()
    {
        if (document.body.lastElementChild?.id !== "stats")
        {
            this.#stats = new Stats();
            this.#stats.showPanel(0);
            this.#stats.dom.id = "stats";
            document.body.appendChild(this.#stats.dom);
        }
    }

    #createLights()
    {
        const directional = new DirectionalLight(Color.NAMES.white, 2);
        const helper = new DirectionalLightHelper(directional, 10, Color.NAMES.yellow);

        helper.visible = DEBUG;

        directional.castShadow = true;
        directional.shadow.camera.near = 1;
        directional.shadow.camera.far = 200;

        directional.shadow.camera.top = 60;
        directional.shadow.camera.right = 100;
        directional.shadow.camera.bottom = -50;
        directional.shadow.camera.left = -100;

        directional.shadow.mapSize.set(1024, 1024);

        directional.color.set(Color.NAMES.white);
        directional.position.set(0, 35, 70);
        directional.rotation.set(1, 0, 0);
        directional.intensity = 2;

        this.scene.add(directional);
        this.scene.add(helper);
    }

    #createGround()
    {
        const ground = new Mesh(
            new PlaneGeometry(500, 500),
            new Ground({ side: FrontSide, color: Color.NAMES.white })
        );

        ground.rotateX(-PI.d2);
        ground.receiveShadow = true;

        Physics.addStaticPlane(ground);
        this.scene.add(ground);
    }

    #createControls()
    {
        this.#controls = new OrbitControls(this.camera, this.canvas);
        this.#controls.enablePan = import.meta.env.DEV;

        this.#controls.enableDamping = true;
        this.#controls.maxPolarAngle = 1.5;
        this.#controls.minPolarAngle = 0.5;

        this.#controls.rotateSpeed = 0.5;
        this.#controls.enableZoom = true;
    }

    #update()
    {
        this.#stats?.begin();
        this.#controls.update();

        super.update();
        this.#stats?.end();
    }

    /** @override */
    dispose()
    {
        this.#stats?.dom.remove();
        this.#controls.dispose();
        RAF.remove(this.#tick);
        super.dispose();
    }
}
