import Input from "./Input";

export default class Keyboard extends Input
{
    #keydown = this.#keyDown.bind(this);
    #keyup   = this.#keyUp.bind(this);

    #accelerate = "w";
    #steerRight = "d";
    #steerLeft  = "a";
    #brake      = "s";

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
            case this.#accelerate:
                super.accelerate = pressed;
            break;

            case this.#steerRight:
                super.steer = +pressed * 1;
            break;

            case this.#steerLeft:
                super.steer = -pressed * 1;
            break;

            case this.#brake:
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
