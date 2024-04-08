import { HPI, clamp, lerp } from "../utils/Number";
import { Object3D } from "three/src/core/Object3D";
import { Emitter } from "../utils/Events";

export default class Mouse
{
    #rotation = 0;
    #direction = 1;
    #locked = false;

    #maxX = HPI - 1;
    #minX = 0 - 0.25;
    #sensitivity = 2e-3;

    #yaw = new Object3D();
    #pitch = new Object3D();
    #reset = Date.now() + 3e3;

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

        this.#rotation = +!(this.#reset = Date.now() + 2e3);
        this.#pitch.rotation.x += movementY * this.#sensitivity;
        this.#pitch.rotation.x = clamp(this.#pitch.rotation.x, this.#minX, this.#maxX);
        this.#yaw.rotation.y -= movementX * this.#sensitivity * ((this.#direction > 0) * 2 - 1);
    }

    #removeEvents()
    {
        document.removeEventListener('pointerlockchange', this.#pointerlockchange, false);
        window.removeEventListener("mousedown", this.#mousedown, false);
        window.removeEventListener("mousemove", this.#mousemove, false);
    }

    /** @param {number} delta */
    #cubicInOut(delta)
    {
        return ((delta *= 2) < 1 ? delta * delta * delta : (delta -= 2) * delta * delta + 2) * 0.5;
    }

    /** @param {import("three").Vector3} position @param {import("three").Quaternion} rotation @param {number} direction */
    update(position, rotation, direction)
    {
        this.#yaw.position.set(position.x, Math.max(position.y, 0), position.z);
        const delta = Math.min((Date.now() - this.#reset) * 2e-3, 1);

        this.#direction = direction;
        if (delta < 0) return;

        const time = this.#cubicInOut(delta);

        if (!this.#rotation)
        {
            this.#rotation = this.#pitch.rotation.x;
        }

        if (time === 1)
        {
            this.#rotation = 0;
            this.#reset = Date.now() + 1e3;
        }

        this.#yaw.quaternion.slerp(rotation, time * 0.25);
        this.#yaw.quaternion.x = this.#yaw.quaternion.z = 0;
        this.#pitch.rotation.x = lerp(this.#rotation, 0, time);
    }

    dispose()
    {
        this.#removeEvents();
        this.#locked = false;
    }
}
