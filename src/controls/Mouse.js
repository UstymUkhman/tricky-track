import { Object3D } from "three/src/core/Object3D";
import { PI, clamp } from "../utils/Number";
import { Emitter } from "../utils/Events";

export default class Mouse
{
    #pointerlockchange = this.#pointerLockChange.bind(this);

    #mousedown = this.#mouseDown.bind(this);
    #mousemove = this.#mouseMove.bind(this);

    #pitch = new Object3D();
    #yaw = new Object3D();

    #sensitivity = 2e-3;
    #maxX = PI.d2 - 1;
    #minX = 0 - 0.25;
    #locked = false;

    /** @param {import("three").PerspectiveCamera} camera */
    constructor (camera, height = 5)
    {
        this.#addEvents();
        this.#pitch.add(camera);
        this.#yaw.add(this.#pitch);
        this.#yaw.position.y = height;

        Emitter.dispatch("Scene::Add", this.#yaw);
    }

    #addEvents()
    {
        document.addEventListener('pointerlockchange', this.#pointerlockchange, false);
        window.addEventListener("mousedown", this.#mousedown, false);
        window.addEventListener("mousemove", this.#mousemove, false);
    }

    #pointerLockChange()
    {
        this.#locked = !this.#locked;
    }

    /** @param {MouseEvent} event */
    #mouseDown({ button })
    {
        if (button || document.pointerLockElement) return;
        document.body.requestPointerLock();
    }

    /** @param {MouseEvent} event */
    #mouseMove(event)
    {
        if (!this.#locked) return;

        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        this.#yaw.rotation.y -= movementX * this.#sensitivity;
        this.#pitch.rotation.x += movementY * this.#sensitivity;
        this.#pitch.rotation.x = clamp(this.#pitch.rotation.x, this.#minX, this.#maxX);
    }

    #removeEvents()
    {
        document.removeEventListener('pointerlockchange', this.#pointerlockchange, false);
        window.removeEventListener("mousedown", this.#mousedown, false);
        window.removeEventListener("mousemove", this.#mousemove, false);
    }

    dispose()
    {
        this.#removeEvents();
        this.#locked = false;
    }
}
