const Apify = require('apify');
const { LABELS, SCHOOLS_RESULT } = require('./constants');
const { handleStart, handleList, handleDetail } = require('./routes');
const { initializeRequestQueue } = require('./tools');

const { utils: { log } } = Apify;

log.setLevel(log.LEVELS.DEBUG);

Apify.main(async () => {
    const input = await Apify.getInput();
    log.debug(`Input: ${JSON.stringify(input, null, 2)}`);

    const schoolsResult = await Apify.getValue(SCHOOLS_RESULT) || [];
    Apify.events.on('persistState', async () => Apify.setValue(SCHOOLS_RESULT, schoolsResult));

    const { regionUrls, subRegionNames } = input;

    const requestQueue = await initializeRequestQueue(regionUrls);
    // const proxyConfiguration = await Apify.createProxyConfiguration();

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        // proxyConfiguration,
        maxConcurrency: 50,
        handlePageFunction: async (context) => {
            const { $, request: { url, userData: { label } } } = context;
            log.info('Page opened.', { label, url });

            await Apify.setValue(`${label || LABELS.START}_PAGE`, $.html(), { contentType: 'text/html' });

            switch (label) {
                case LABELS.LIST:
                    return handleList(context);
                case LABELS.DETAIL:
                    return handleDetail(context, schoolsResult);
                default:
                    return handleStart(context, subRegionNames);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
