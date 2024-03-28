import { Object3D } from "three/src/core/Object3D";
import { PI, clamp, lerp } from "../utils/Number";
import { Vector2 } from "three/src/math/Vector2";
import { Emitter } from "../utils/Events";

export default class Mouse
{
    #reset = 0;
    #timeout = 0;
    #locked = false;

    #minX = 0 - 0.25;
    #maxX = PI.d2 - 1;
    #sensitivity = 2e-3;

    #yaw = new Object3D();
    #pitch = new Object3D();
    #rotation = new Vector2();

    #mousedown = this.#mouseDown.bind(this);
    #mousemove = this.#mouseMove.bind(this);

    #pointerlockchange = this.#pointerLockChange.bind(this);

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

        this.#reset = +!!clearTimeout(this.#timeout);

        this.#yaw.rotation.y -= movementX * this.#sensitivity;
        this.#pitch.rotation.x += movementY * this.#sensitivity;
        this.#pitch.rotation.x = clamp(this.#pitch.rotation.x, this.#minX, this.#maxX);

        this.#timeout = setTimeout(() =>
        {
            this.#rotation.set(this.#pitch.rotation.x, this.#yaw.rotation.y);
            this.#reset = Date.now();
        }, 2500);
    }

    #removeEvents()
    {
        document.removeEventListener('pointerlockchange', this.#pointerlockchange, false);
        window.removeEventListener("mousedown", this.#mousedown, false);
        window.removeEventListener("mousemove", this.#mousemove, false);
    }

    /** @param {import("three").Vector3} position @param {(yaw: number) => number} getCarRotation */
    update(position, getCarRotation)
    {
        this.#yaw.position.set(position.x, Math.max(position.y, 0), position.z);

        if (this.#reset)
        {
            const time = Date.now() - this.#reset;
            const delta = Math.min(time * 2e-3, 1);

            const rotation = getCarRotation(this.#rotation.y);

            this.#pitch.rotation.x = lerp(this.#rotation.x, 0, delta);
            this.#yaw.rotation.y = lerp(this.#rotation.y, rotation, delta);

            delta === 1 && this.#rotation.setScalar(this.#reset = 0);
        }
    }

    dispose()
    {
        this.#removeEvents();
        this.#locked = false;
    }
}
