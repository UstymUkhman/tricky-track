/** @type {Worker} */ export const Worker = self;

Worker.onerror = error => console.error(error);

Worker.onmessage = message =>
{
    const { event, params } = message.data;

    console.info("Worker Event:", event);
    console.table(params);

    Worker.postMessage({
        response: params,
        name: event
    });
};
