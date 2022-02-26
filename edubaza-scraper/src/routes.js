const Apify = require('apify');

const { utils: { log } } = Apify;

/**
 *
 * @param {Apify.CheerioHandlePageInputs} context
 */
exports.handleStart = async (context) => {
    const { $, request: { url }, crawler: { requestQueue } } = context;
    // Handle Start URLs
    const html = $.html();
    await Apify.setValue('START_PAGE', html, { contentType: 'text/html' });

    const nextButtonImageElement = $('[title="Następne"]');
    const parentElement = $(nextButtonImageElement).parent();
    const nextPageUrl = $(parentElement).attr('href');
    const nextUrl = new URL(`${url}/${nextPageUrl}`);

    const schoolsTotalText = $('.znalezionych').text().trim();
    const schoolsTotal = parseInt(schoolsTotalText.replace(/[^0-9]/g, ''), 10);

    await enqueueListPageRequests(requestQueue, nextUrl, schoolsTotal);
};

/**
 *
 * @param {Apify.RequestQueue} requestQueue
 * @param {URL} url
 * @param {number} schoolsTotal
 */
const enqueueListPageRequests = async (requestQueue, url, schoolsTotal) => {
    for (let i = 0; i < schoolsTotal; i += 20) {
        url.searchParams.set('l', i);
        log.info(url.toString());

        const nextRequest = {
            url: url.toString(),
            userData: {
                label: 'LIST',
            },
        };

        await requestQueue.addRequest(nextRequest);
    }
};

/**
 *
 * @param {Apify.CheerioHandlePageInputs} context
 */
exports.handleList = async (context) => {
    // Handle pagination
    const { request } = context;
};

/**
 *
 * @param {Apify.CheerioHandlePageInputs} context
 */
exports.handleDetail = async (context) => {
    // Handle details
};
