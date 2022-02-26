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
    const nextUrl = new URL(`${url}${nextPageUrl}`);

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
    const { $, request, crawler: { requestQueue } } = context;

    const links = $('.wo_l_tytul [href]');
    const url = new URL(request.url);

    for (const link of links) {
        const relativeLink = $(link).attr('href');
        const nextLink = `${url.origin}/${relativeLink}`;

        await requestQueue.addRequest({
            url: nextLink,
            userData: {
                label: 'DETAIL',
            },
        });
    }
};

/**
 *
 * @param {Apify.CheerioHandlePageInputs} context
 * @param {{
 *  name: string,
 *  homepage: string,
 * }[]} edubazaSchools
 */
exports.handleDetail = async (context, edubazaSchools) => {
    // Handle details
    const { $ } = context;

    const homepage = $('.wo_www [href]').attr('href');

    if (homepage) {
        const name = $('.tytul').text().trim();
        const school = {
            name,
            homepage,
        };
        // await Apify.pushData(school);
        await Apify.setValue('EDUBAZA_DOMAIN_LIST', edubazaSchools);
        edubazaSchools.push(school);
    }
};
