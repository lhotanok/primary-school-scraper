const Apify = require('apify');
const { SELECTORS, LABELS, RESULTS_PER_PAGE, OFFSET_QUERY_PARAMETER, AT_SIGN_REGEX, AT_SIGN } = require('./constants');

const { utils: { log } } = Apify;

const initializeRequestQueue = async (startRegions) => {
    const requestQueue = await Apify.openRequestQueue();

    for (const region of startRegions) {
        const request = typeof region === 'string' ? { url: region } : region;
        await requestQueue.addRequest(request);
    }

    return requestQueue;
};

const enqueueListPage = async (url, requestQueue, userData) => {
    const request = {
        url,
        userData: {
            ...userData,
            label: LABELS.LIST,
        },
    };

    await requestQueue.addRequest(request);
    log.debug(`Enqueued request: ${JSON.stringify(request, null, 2)}`);
};

const enqueuePaginationPage = async ({ $, request, crawler: { requestQueue } }) => {
    const nextUrl = buildNextPageUrl(request);
    const nextOffset = parseInt(nextUrl.searchParams.get(OFFSET_QUERY_PARAMETER), 10);
    const totalSchools = parseInt($(SELECTORS.TOTAL_SCHOOLS).text().trim(), 10);

    const nextUserData = request.userData;
    nextUserData.currentPage++;

    if (nextOffset <= totalSchools) {
        await enqueueListPage(nextUrl.toString(), requestQueue, nextUserData);
    }
};

const enqueueDetailPages = async ({ $, request: { userData }, crawler: { requestQueue } }) => {
    const schoolElements = $(SELECTORS.SCHOOLS);

    const schoolUrls = schoolElements.map((_i, el) => $(el).attr('href')).toArray();
    log.debug(`Extracted ${schoolUrls.length} school urls`);

    for (const url of schoolUrls) {
        const request = {
            url,
            userData: {
                label: LABELS.DETAIL,
                regionName: userData.regionName,
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

const extractSchoolDetailEmails = ($) => {
    const emailElements = $(SELECTORS.EMAILS);

    const emails = emailElements.map((_i, el) => {
        const emailHtml = $(el).html();
        const email = emailHtml.replace(AT_SIGN_REGEX, AT_SIGN);
        return email;
    }).toArray();

    const uniqueEmails = Array.from(new Set(emails));
    return uniqueEmails;
};

module.exports = {
    initializeRequestQueue,
    enqueueListPage,
    enqueuePaginationPage,
    enqueueDetailPages,
    extractSchoolDetailEmails,
};
