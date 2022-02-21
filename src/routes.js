const Apify = require('apify');
const { SELECTORS, LABELS } = require('./constants');

const { utils: { log } } = Apify;

exports.handleStart = async (context, subRegionNames) => {
    const { $, crawler: { requestQueue } } = context;
    const subRegionElements = $(SELECTORS.SUBREGIONS);

    const subRegions = subRegionElements.map((_i, el) => {
        const url = $(el).attr('href');
        const name = $(el).text().trim();

        log.debug(`Extracted subregion ${name} (${url})`);
        return { url, name };
    }).toArray();

    const requiredSubRegionUrls = subRegions
        .filter((subRegion) => (subRegionNames ? subRegionNames.includes(subRegion.name) : true))
        .map((subRegion) => subRegion.url);

    for (const subRegionUrl of requiredSubRegionUrls) {
        await enqueueListPage(subRegionUrl, requestQueue, 0);
    }
};

exports.handleList = async ({ request, $ }) => {
    // Handle pagination
};

exports.handleDetail = async ({ request, $ }) => {
    // Handle details
};

const enqueueListPage = async (url, requestQueue, nextPage) => {
    const request = {
        url,
        userData: {
            label: LABELS.LIST,
            currentPage: nextPage,
        },
    };

    await requestQueue.addRequest(request);
    log.debug(`Enqueued request: ${JSON.stringify(request, null, 2)}`);
};
