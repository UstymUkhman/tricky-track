import { CubeTextureLoader } from "three/src/loaders/CubeTextureLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { LoadingManager } from "three/src/loaders/LoadingManager";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { CubeTexture } from "three/src/textures/CubeTexture";
import { AudioLoader } from "three/src/loaders/AudioLoader";
import { RGBAFormat } from "three/src/constants";
import { Emitter } from "./Events";

class Manager extends LoadingManager
{
    #gltf = new GLTFLoader(this);
    #audio = new AudioLoader(this);
    #texture = new TextureLoader(this);
    #cubeTexture = new CubeTextureLoader(this);

    #textures = ["px", "nx", "py", "ny", "pz", "nz"];

    #getPromiseCallbacks(resolve, reject)
    {
        return {
            onLoad: asset =>
            {
                if (asset instanceof CubeTexture)
                    asset.format = RGBAFormat;

                resolve(asset);
            },

            onProgress: event => this.onProgress(
                event.target?.responseURL,
                event.loaded,
                event.total
            ),

            onError: error => reject(error)
        };
    }

    /** @param {string | string[]} images @param {string[] | undefined} textures */
    async loadCubeTexture(images, textures, ext = "png")
    {
        return await new Promise((resolve, reject) =>
        {
            if (Array.isArray(images))
                textures = images;

            else
            {
                this.#cubeTexture.setPath(`./images/${images}/`);
                textures ??= this.#textures.map(name => `${name}.${ext}`);
            }

            const promise = this.#getPromiseCallbacks(resolve, reject);

            this.#cubeTexture.load(
                textures,
                promise.onLoad,
                promise.onProgress,
                promise.onError
            );
        });
    }

    /** @param {string} file */
    async loadGLTF(file)
    {
        return await new Promise((resolve, reject) =>
        {
            const promise = this.#getPromiseCallbacks(resolve, reject);

            this.#gltf.setPath("./models/").load(
                file,
                promise.onLoad,
                promise.onProgress,
                promise.onError
            );
        });
    }

    /** @param {string} file */
    async loadTexture(file)
    {
        return await new Promise((resolve, reject) =>
        {
            const promise = this.#getPromiseCallbacks(resolve, reject);

            this.#texture.setPath("./images/").load(
                file,
                promise.onLoad,
                promise.onProgress,
                promise.onError
            );
        });
    }

    /** @param {string} file */
    async loadAudio(file)
    {
        return await new Promise((resolve, reject) =>
        {
            const promise = this.#getPromiseCallbacks(resolve, reject);

            this.#audio.setPath("./sounds/").load(
                file,
                promise.onLoad,
                promise.onProgress,
                promise.onError
            );
        });
    }

    /** @override @param {number} loaded @param {number} total */
    onProgress(_, loaded, total)
    {
        Emitter.dispatch(Loading.Progress, loaded * 100 / total);
    };

    /** @override @param {string} url */
    onError(url)
    {
        console.error(`Error occurred loading ${url}.`);
    };

    /** @override */
    onStart()
    {
        Emitter.dispatch(Loading.Start);
    };

    /** @override */
    onLoad()
    {
        Emitter.dispatch(Loading.Complete);
    };
}

export const Loader = new Manager();

export const Loading =
{
    Complete : "Loading::Complete",
    Progress : "Loading::Progress",
    Start    : "Loading::Start"
}
