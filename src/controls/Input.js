export default class Input
{
    #accelerate = false;
    #brake      = false;
    #steer      = 0;

    /** @param {accelerate} boolean */
    set accelerate(accelerate)
    {
        this.#accelerate = accelerate;
    }

    get accelerate()
    {
        return this.#accelerate;
    }

    /** @param {steer} number */
    set steer(steer)
    {
        this.#steer = steer;
    }

    get steer()
    {
        return this.#steer;
    }

    /** @param {brake} boolean */
    set brake(brake)
    {
        this.#brake = brake;
    }

    get brake()
    {
        return this.#brake;
    }
}
