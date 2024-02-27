import { DirectionalLightHelper } from "three/src/helpers/DirectionalLightHelper";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { DirectionalLight } from "three/src/lights/DirectionalLight";
import { PlaneGeometry } from "three/src/geometries/PlaneGeometry";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { AmbientLight } from "three/src/lights/AmbientLight";
import Stats from "three/examples/jsm/libs/stats.module";

import { Scene } from "three/src/scenes/Scene";
import { Mesh } from "three/src/objects/Mesh";
import { Color } from "three/src/math/Color";
import { Fog } from "three/src/scenes/Fog";
import Ground from "../materials/Ground";
import Viewport from "../utils/Viewport";
import { PI } from "../utils/Number";
import RAF from "../utils/RAF";

import {
    DoubleSide,
    SRGBColorSpace,
    PCFSoftShadowMap,
    ACESFilmicToneMapping
} from "three/src/constants";

export default class Sandbox
{
    /** @type {OrbitControls} */ #orbitControls;
    /** @type {PerspectiveCamera} */ #camera;
    /** @type {WebGLRenderer} */ #renderer;

    #update = this.#render.bind(this);
    /** @type {Stats} */ #stats;
    #scene = new Scene();

    constructor()
    {
        this.#createStats();
        this.#createScene();

        this.#createCamera();
        this.#createLights();
        this.#createGround();

        this.#createRenderer();
        this.#createControls();

        RAF.add(this.#update);
        RAF.pause = false;
    }

    #createScene()
    {
        this.#scene.background = new Color(Color.NAMES.whitesmoke);
        this.#scene.fog = new Fog(Color.NAMES.whitesmoke, 100, 250);
    }

    #createCamera()
    {
        this.#camera = new PerspectiveCamera(50, Viewport.size.ratio, 0.1, 500);
        this.#camera.position.set(0, 25, 50);
    }

    #createLights()
    {
        const ambient = new AmbientLight(Color.NAMES.white, 0.5);
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

        this.#scene.add(directional);
        this.#scene.add(ambient);
        this.#scene.add(helper);
    }

    #createGround()
    {
        const ground = new Mesh(
            new PlaneGeometry(500, 500),
            new Ground({ side: DoubleSide, color: Color.NAMES.white })
        );

        ground.receiveShadow = true;
        ground.rotateX(-PI.d2);

        this.#scene.add(ground);
    }

    #createRenderer()
    {
        this.#renderer = new WebGLRenderer({
            canvas: document.getElementById("application"),
            powerPreference: "high-performance",
            antialias: true
        });

        this.#renderer.debug.checkShaderErrors = import.meta.env.DEV;

        this.#renderer.setSize(Viewport.size.width, Viewport.size.height);
        this.#renderer.setClearColor(Color.NAMES.whitesmoke, 1);
        this.#renderer.setPixelRatio(devicePixelRatio);

        this.#renderer.outputColorSpace = SRGBColorSpace;
        this.#renderer.toneMapping = ACESFilmicToneMapping;
        this.#renderer.toneMappingExposure = 1.5;

        this.#renderer.shadowMap.enabled = true;
        this.#renderer.shadowMap.type = PCFSoftShadowMap;
    }

    #createControls()
    {
        this.#orbitControls = new OrbitControls(this.#camera, this.#canvas);
        this.#orbitControls.enablePan = import.meta.env.DEV;

        Viewport.addResizeCallback(this.#resize.bind(this));

        this.#orbitControls.target.set(0, 0, -25);
        this.#orbitControls.enableDamping = true;

        this.#orbitControls.maxPolarAngle = 1.5;
        this.#orbitControls.minPolarAngle = 0.5;

        this.#orbitControls.rotateSpeed = 0.5;
        this.#orbitControls.enableZoom = true;

        this.#orbitControls.update();
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

    /** @param {number} width @param {number} height @param {number} ratio */
    #resize(width, height, ratio)
    {
        this.#camera.aspect = ratio;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(width, height);
    }

    #render()
    {
        this.#stats?.begin();

        this.#orbitControls.update();
        this.#renderer.render(this.#scene, this.#camera);

        this.#stats?.end();
    }

    /** @param {import("three").Material} material */
    #disposeMaterial(material)
    {
        material.displacementMap?.dispose();
        material.metalnessMap?.dispose();
        material.roughnessMap?.dispose();

        material.emissiveMap?.dispose();
        material.gradientMap?.dispose();
        material.specularMap?.dispose();

        material.normalMap?.dispose();
        material.alphaMap?.dispose();
        material.lightMap?.dispose();

        material.bumpMap?.dispose();
        material.envMap?.dispose();
        material.aoMap?.dispose();
        material.map?.dispose();

        material.dispose();
    }

    /** @param {import("three").Object3D} node */
    #disposeNode(node)
    {
        node.traverse(child =>
        {
            if (child instanceof Mesh)
            {
                !child.material
                    ? (child = undefined)
                    : !Array.isArray(child.material)
                        ? this.disposeMaterial(child.material)
                        : child.material.forEach(this.#disposeMaterial);

                child.geometry?.dispose();
            }

            child = undefined;
        });
    }

    dispose()
    {
        this.#disposeNode(this.#scene);
        this.#orbitControls.dispose();
        this.#stats?.dom.remove();

        RAF.remove(this.#update);

        this.#renderer.dispose();
        this.#canvas.remove();
        this.#scene.clear();
    }

    get #canvas()
    {
        return this.#renderer.domElement;
    }
}
