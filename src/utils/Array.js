import { randomInt, random as randomFloat } from "./Number";

/** @param {number[]} a */
export function fisherYates(a, c = a.length, r = 0)
{
    while (c)
    {
        r = (randomFloat(0, 1) * c--) | 0;
        [a[c], a[r]] = [a[r], a[c]];
    }
}

/** @param {number[]} a */
export function durstenfeld(a)
{
    for (let c = a.length; c--; )
    {
        const r = Math.floor(randomFloat(0, 1) * (c + 1));
        [a[c], a[r]] = [a[r], a[c]];
    }
}

/** @param {number[]} a */
export function shuffle(a)
{
    return a.sort(() => randomFloat(0, 1) - 0.5);
}

/** @param {number[]} a */
export function random(a)
{
    return a[randomInt(0, a.length - 1)];
}

/** @param {number[]} a */
export function min(a)
{
    let l = a.length, m = Infinity;
    while (l--) if (a[l] < m) m = a[l];
    return m;
}

/** @param {number[]} a */
export function max(a)
{
    let l = a.length, m = -Infinity;
    while (l--) if (a[l] > m) m = a[l];
    return m;
}
