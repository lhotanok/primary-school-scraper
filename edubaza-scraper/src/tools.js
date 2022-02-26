const Apify = require('apify');

const { utils: { log } } = Apify;

/**
 *
 * @param {{
 *  url : string
 * }[]} startUrls
 * @returns {Promise<Apify.RequestQueue>}
 */
exports.initializeRequestQueue = async (startUrls) => {
    const requestQueue = await Apify.openRequestQueue();

    for (const url of startUrls) {
        await requestQueue.addRequest(url);
    }

    return requestQueue;
};
