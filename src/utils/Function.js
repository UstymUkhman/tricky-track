/**
 * @callback Callback
 * @param {...unknown} args
 * @returns {void}
 */

/**
 *
 * @param {Callback} cb
 * @param {number} delay
 * @returns {Callback}
 */
export function debounce(cb, delay, leading = true)
{
	let timeout;

	return (...args) =>
    {
        clearTimeout(timeout);
        leading && !timeout && cb(...args);

        timeout = setTimeout(() =>
        {
            !leading && cb(...args);
            timeout = undefined;
        }, delay);
	};
}

/**
 *
 * @param {Callback} cb
 * @param {number} limit
 * @returns {Callback}
 */
export function throttle(cb, limit)
{
    let last, timeout;

    return (...args) =>
    {
        const now = Date.now();

        if (!last) { cb(...args); last = now; }

        else {
            clearTimeout(timeout);
            const delay = limit - (now - last);

            timeout = setTimeout(() =>
            {
                const delay = Date.now() - last;
                if (delay < limit) return;

                last = Date.now();
                cb(...args);
            }, delay);
        }
    };
}
