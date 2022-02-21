const Apify = require('apify');

exports.initializeRequestQueue = async (startRegions) => {
    const requestQueue = await Apify.openRequestQueue();

    for (const region of startRegions) {
        const request = typeof region === 'string' ? { url: region } : region;
        await requestQueue.addRequest(request);
    }

    return requestQueue;
};
