const Apify = require('apify');
const { SELECTORS, LABELS, RESULTS_PER_PAGE, OFFSET_QUERY_PARAMETER } = require('./constants');

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

const enqueuePaginationPage = async ({ $, request, crawler: { requestQueue } }) => {
    const { userData: { currentPage } } = request;

    const nextUrl = buildNextPageUrl(request);
    const nextOffset = parseInt(nextUrl.searchParams.get(OFFSET_QUERY_PARAMETER), 10);
    const totalSchools = parseInt($(SELECTORS.TOTAL_SCHOOLS).text().trim(), 10);

    if (nextOffset <= totalSchools) {
        await enqueueListPage(nextUrl.toString(), requestQueue, currentPage + 1);
    }
};

const enqueueDetailPages = async ({ $, crawler: { requestQueue } }) => {
    const schoolElements = $(SELECTORS.SCHOOLS);

    const schoolUrls = schoolElements.map((_i, el) => $(el).attr('href')).toArray();
    log.debug(`Extracted ${schoolUrls.length} school urls`);

    for (const url of schoolUrls) {
        const request = {
            url,
            userData: {
                label: LABELS.DETAIL,
            },
        };
        await requestQueue.addRequest(request);
    }
};

const buildNextPageUrl = (currentRequest) => {
    const { url, userData: { currentPage } } = currentRequest;

    const nextUrl = new URL(url);
    const nextPage = currentPage + 1;
    const nextOffset = nextPage * RESULTS_PER_PAGE;

    nextUrl.searchParams.set(OFFSET_QUERY_PARAMETER, nextOffset);
    return nextUrl;
};
