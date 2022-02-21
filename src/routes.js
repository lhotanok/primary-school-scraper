const Apify = require('apify');
const { enqueueListPage, enqueuePaginationPage, enqueueDetailPages } = require('./tools');
const { SELECTORS } = require('./constants');

const { utils: { log } } = Apify;

exports.handleStart = async (context, subRegionNames) => {
    const { $, request, crawler: { requestQueue } } = context;
    const subRegionElements = $(SELECTORS.SUBREGIONS);

    const subRegions = subRegionElements.map((_i, el) => {
        const url = $(el).attr('href');
        const name = $(el).text().trim();
        return { url, name };
    }).toArray();

    const requiredSubRegionUrls = subRegions
        .filter((subRegion) => (subRegionNames ? subRegionNames.includes(subRegion.name) : true))
        .map((subRegion) => subRegion.url);

    const totalSchools = $(SELECTORS.TOTAL_SCHOOLS).text().trim();
    log.debug(`Found ${totalSchools} schools`, { url: request.url });

    for (const subRegionUrl of requiredSubRegionUrls) {
        await enqueueListPage(subRegionUrl, requestQueue, 0);
    }
};

exports.handleList = async (context) => {
    await enqueueDetailPages(context);
    await enqueuePaginationPage(context);
};

exports.handleDetail = async ({ request, $ }) => {
    // Handle details
};
