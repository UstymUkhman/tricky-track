import { DirectionalLightHelper } from "three/src/helpers/DirectionalLightHelper";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DirectionalLight } from "three/src/lights/DirectionalLight";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry";

import GroundMaterial from "../materials/Ground";
import { Vector3 } from "three/src/math/Vector3";
import { FrontSide } from "three/src/constants";
import { Mesh } from "three/src/objects/Mesh";
import { Plane } from "three/src/math/Plane";
import { Color } from "three/src/math/Color";
import { Fog } from "three/src/scenes/Fog";

import { PI } from "../utils/Number";
import Car from "../cars/SkylineR32";
import Physics from "../physics";
import RAF from "../utils/RAF";
import Level from "./Level";

export default class extends Level
{
    #groundPlane = new Plane(new Vector3(0, 1, 0));
    #car = new Car(() => RAF.pause = false);
    /** @type {OrbitControls} */ #controls;
    #tick = this.#update.bind(this);

    constructor()
    {
        super();

        this.#setScene();
        this.#setCamera();
        this.#createLights();
        this.#createGround();
        this.#createControls();

        RAF.add(this.#tick);
    }

    #setScene()
    {
        this.scene.background = new Color(Color.NAMES.whitesmoke);
        this.scene.fog = new Fog(Color.NAMES.whitesmoke, 100, 250);
    }

    #setCamera()
    {
        this.camera.position.set(0, 25, -50);
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
        directional.position.set(0, 35, -70);
        directional.rotation.set(-1, 0, 0);
        directional.intensity = 2;

        this.scene.add(directional);
        this.scene.add(helper);
    }

    #createGround()
    {
        const ground = new Mesh(
            new PlaneGeometry(500, 500),
            new GroundMaterial({ side: FrontSide, color: Color.NAMES.white })
        );

        ground.rotateX(-PI.d2);
        ground.receiveShadow = true;

        this.#groundPlane.translate(
            new Vector3(0, -1, 0)
        );

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
        this.stats?.begin();

        this.#car.update(this.#groundPlane);
        this.#controls.update();

        super.update();
        this.stats?.end();
    }

    /** @override */
    dispose()
    {
        this.#controls.dispose();
        RAF.remove(this.#tick);
        this.#car.dispose();
        super.dispose();
    }
}
