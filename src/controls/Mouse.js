import { HPI, clamp, lerp } from "../utils/Number";
import { Object3D } from "three/src/core/Object3D";
import { Vector2 } from "three/src/math/Vector2";
import { Emitter } from "../utils/Events";

export default class Mouse
{
    #reset = 0;
    #timeout = 0;
    #locked = false;
    // #interval = 0;

    #maxX = HPI - 1;
    #minX = 0 - 0.25;
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
        // (this.#locked = !this.#locked) ? this.#resetRotation() : clearInterval(this.#interval);
    }

    #resetRotation()
    {
        // this.#interval = setInterval(() =>
        this.#timeout = setTimeout(() =>
        {
            this.#rotation.set(this.#pitch.rotation.x, this.#yaw.rotation.y);
            this.#reset = Date.now();
        }, 1e3);
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
        if (Math.abs(this.#yaw.rotation.y) > Math.PI) this.#yaw.rotation.y *= -1;

        this.#pitch.rotation.x += movementY * this.#sensitivity;
        this.#pitch.rotation.x = clamp(this.#pitch.rotation.x, this.#minX, this.#maxX);

        // this.#reset = +!!clearInterval(this.#interval);
        this.#reset = +!!clearTimeout(this.#timeout);
        this.#resetRotation();
    }

    #removeEvents()
    {
        document.removeEventListener('pointerlockchange', this.#pointerlockchange, false);
        window.removeEventListener("mousedown", this.#mousedown, false);
        window.removeEventListener("mousemove", this.#mousemove, false);
    }

    #sineInOut()
    {
        const delta = Math.min((Date.now() - this.#reset) * 2e-3, 1);
        return (1 - Math.cos(Math.PI * delta)) * 0.5;
    }

    /** @param {import("three").Vector3} position @param {number} rotation */
    update(position, rotation)
    {
        this.#yaw.position.set(position.x, Math.max(position.y, 0), position.z);

        if (this.#reset)
        {
            const time = this.#sineInOut();

            /* if (this.#yaw.rotation.y < -HPI && rotation > HPI)
            {
                this.#rotation.setScalar(this.#reset = 0);
                return this.#yaw.rotation.y = Math.PI;
            }

            else if (this.#yaw.rotation.y > HPI && rotation < -HPI)
            {
                this.#rotation.setScalar(this.#reset = 0);
                return this.#yaw.rotation.y = -Math.PI;
            } */

            this.#yaw.rotation.y = lerp(this.#rotation.y, rotation, time);
            this.#pitch.rotation.x = lerp(this.#rotation.x, 0, time);
            time === 1 && this.#rotation.setScalar(this.#reset = 0);
        }
    }

    dispose()
    {
        // clearInterval(this.#interval);
        clearTimeout(this.#timeout);
        this.#removeEvents();
        this.#locked = false;
    }
}
