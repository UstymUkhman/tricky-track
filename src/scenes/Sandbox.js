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
import { Clock } from "three/src/core/Clock";
import { Fog } from "three/src/scenes/Fog";

import { HPI } from "../utils/Number";
import Worker from "../utils/worker";
import Car from "../cars/SkylineR32";
import Physics from "../physics";
import RAF from "../utils/RAF";
import SAB from "../utils/SAB";
import Level from "./Level";

export default class extends Level
{
    #groundPlane = new Plane(new Vector3(0, 1, 0));
    #physicsInit = this.#initPhysics.bind(this);

    /** @type {OrbitControls} */ #controls;
    /** @type {OrbitControls} */ #car;
    #tick = this.#update.bind(this);
    #clock = new Clock();

    constructor()
    {
        super();

        this.#setScene();
        this.#setCamera();
        this.#setPhysics();
        this.#createLights();
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

    #setPhysics()
    {
        if (SAB.supported)
        {
            Worker.add("Physics::Init", this.#physicsInit).post("Physics::Init");
        }
        else
        {
            this.#car = new Car(() => RAF.pause = false);
            this.#createGround();
        }
    }

    #initPhysics()
    {
        const { uuid, position, quaternion, rotation } = this.#createGround();

        Worker.post("Physics::Add::StaticPlane",
        {
            quaternion: quaternion.toJSON(),
            rotation: rotation.x,
            position,
            uuid
        });

        this.#car = new Car(() =>
        {
            Worker.post("Physics::Start");
            RAF.pause = false;
        });
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

        ground.rotateX(-HPI);
        ground.receiveShadow = true;

        this.#groundPlane.translate(
            new Vector3(0, -1, 0)
        );

        !SAB.supported && Physics.addStaticPlane(ground);
        this.scene.add(ground);
        return ground;
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

        !SAB.supported && Physics.update(this.#clock.getDelta());
        this.#car.update(this.#groundPlane);

        this.#controls.update();
        super.render();

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
