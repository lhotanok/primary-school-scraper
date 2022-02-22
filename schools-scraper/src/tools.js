const Apify = require('apify');

// eslint-disable-next-line no-unused-vars
const cheerio = require('cheerio');

const { SELECTORS, LABELS, RESULTS_PER_PAGE, OFFSET_QUERY_PARAMETER, AT_SIGN_REGEX, AT_SIGN } = require('./constants');

const { utils: { log } } = Apify;

/**
 *
 * @param {{ url: String }[]} startRegions
 * @returns {Promise<Apify.RequestQueue>}
 */
const initializeRequestQueue = async (startRegions) => {
    const requestQueue = await Apify.openRequestQueue();

    for (const region of startRegions) {
        const request = typeof region === 'string' ? { url: region } : region;
        await requestQueue.addRequest(request);
    }

    return requestQueue;
};

/**
 *
 * @param {String} url
 * @param {Apify.RequestQueue} requestQueue
 * @param {any} userData
 */
const enqueueListPage = async (url, requestQueue, userData) => {
    const nextUserData = userData;
    nextUserData.label = LABELS.LIST;

    const request = {
        url,
        userData: nextUserData,
    };

    await requestQueue.addRequest(request);
    log.debug(`Enqueued request: ${JSON.stringify(request, null, 2)}`);
};

/**
 *
 * @param {Apify.CheerioHandlePageInputs} context
 */
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

/**
 *
 * @param {Apify.CheerioHandlePageInputs} context
 */
const enqueueDetailPages = async ({ $, request: { userData }, crawler: { requestQueue } }) => {
    const schoolElements = $(SELECTORS.SCHOOLS);

    const schoolUrls = schoolElements.map((_i, el) => $(el).attr('href')).toArray();
    log.debug(`Extracted ${schoolUrls.length} school urls`);
    log.debug(`User data in enqueueDetailPages: ${JSON.stringify(userData)}`);

    for (const url of schoolUrls) {
        const nextUserData = userData;
        nextUserData.label = LABELS.DETAIL;

        const request = {
            url,
            userData: nextUserData,
        };
        await requestQueue.addRequest(request);
    }
};

/**
 *
 * @param {Apify.Request} currentRequest
 */
const buildNextPageUrl = (currentRequest) => {
    const { url, userData: { currentPage } } = currentRequest;

    const nextUrl = new URL(url);
    const nextPage = currentPage + 1;
    const nextOffset = nextPage * RESULTS_PER_PAGE;

    nextUrl.searchParams.set(OFFSET_QUERY_PARAMETER, nextOffset);
    return nextUrl;
};

/**
 *
 * @param {cheerio.CheerioAPI} $
 */
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
