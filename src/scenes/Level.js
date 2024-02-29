import { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera";
import { WebGLRenderer } from "three/src/renderers/WebGLRenderer";
import { AmbientLight } from "three/src/lights/AmbientLight";

import { Scene } from "three/src/scenes/Scene";
import { Clock } from "three/src/core/Clock";
import { Color } from "three/src/math/Color";
import { Emitter } from "../utils/Events";
import Viewport from "../utils/Viewport";
import Physics from "../physics";

import {
    SRGBColorSpace,
    PCFSoftShadowMap,
    ACESFilmicToneMapping
} from "three/src/constants";

export default class Level
{
    /** @type {WebGLRenderer} */ #renderer;
    /** @type {PerspectiveCamera} */ #camera;

    #removeGameObject = this.#remove.bind(this);
    #addGameObject = this.#add.bind(this);
    #scale = this.#resize.bind(this);

    #scene = new Scene();
    #clock = new Clock();

    constructor()
    {
        this.#createCamera();
        this.#createLights();
        this.#createEvents();
        this.#createRenderer();
    }

    #createCamera()
    {
        this.#camera = new PerspectiveCamera(50, Viewport.size.ratio, 0.1, 500);
    }

    #createLights()
    {
        this.#scene.add(new AmbientLight(Color.NAMES.white, 0.5));
    }

    #createEvents()
    {
        Emitter.add("Scene::Remove", this.#removeGameObject);
        Emitter.add("Scene::Add", this.#addGameObject);
        Viewport.addResizeCallback(this.#scale);
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

    /** @param {number} width @param {number} height @param {number} ratio */
    #resize(width, height, ratio)
    {
        this.#camera.aspect = ratio;
        this.#camera.updateProjectionMatrix();
        this.#renderer.setSize(width, height);
    }

    /** @param {import("../utils/Events").Event} event */
    #add(event)
    {
        this.#scene.add(event.data);
    }

    /** @param {import("../utils/Events").Event} event */
    #remove(event)
    {
        this.#disposeNode(event.data);
        this.#scene.remove(event.data);
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
            if (child.material)
                !Array.isArray(child.material)
                    ? this.#disposeMaterial(child.material)
                    : child.material.forEach(this.#disposeMaterial);

            child.geometry?.dispose();
            child = undefined;
        });
    }

    #removeEvents()
    {
        Emitter.remove("Scene::Remove", this.#removeGameObject);
        Emitter.remove("Scene::Add", this.#addGameObject);
        Viewport.removeResizeCallback(this.#scale);
    }

    update()
    {
        Physics.update(this.#clock.getDelta());
        this.#renderer.render(this.#scene, this.#camera);
    }

    dispose()
    {
        this.#disposeNode(this.#scene);
        this.#renderer.dispose();
        this.canvas.remove();
        this.#removeEvents();
        this.#scene.clear();
    }

    get canvas()
    {
        return this.#renderer.domElement;
    }

    get camera()
    {
        return this.#camera;
    }

    get scene()
    {
        return this.#scene;
    }
}
