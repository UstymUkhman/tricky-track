import Input from "./Input";

export default class Keyboard extends Input
{
    #keydown = this.#keyDown.bind(this);
    #keyup   = this.#keyUp.bind(this);

    constructor()
    {
        super();
        this.#addEvents();
    }

    #addEvents()
    {
        window.addEventListener("keydown", this.#keydown, false);
        window.addEventListener("keyup", this.#keyup, false);
    }

    /** @param {KeyboardEvent} event */
    #keyDown(event)
    {
        event.preventDefault();
        event.stopPropagation();

        return this.#update(event.key, true);
    }

    /** @param {KeyboardEvent} event */
    #keyUp(event)
    {
        event.preventDefault();
        event.stopPropagation();

        return this.#update(event.key, false);
    }

    /** @param {string} key @param {boolean} pressed */
    #update(key, pressed)
    {
        switch (key)
        {
            case "w":
            case "ArrowUp":
                super.accelerate = pressed;
            break;

            case "d":
            case "ArrowRight":
                super.steer = +pressed * 1;
            break;

            case "a":
            case "ArrowLeft":
                super.steer = -pressed * 1;
            break;

            case "s":
            case "ArrowDown":
                super.brake = pressed;
            break;
        }

        return false;
    }

    #removeEvents()
    {
        window.removeEventListener("keydown", this.#keydown, false);
        window.removeEventListener("keyup", this.#keyup, false);
    }

    dispose()
    {
        this.#removeEvents();
    }
}
