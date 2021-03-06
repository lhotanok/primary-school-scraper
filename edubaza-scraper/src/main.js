const Apify = require('apify');
const { handleStart, handleList, handleDetail } = require('./routes');
const { initializeRequestQueue } = require('./tools');

const { utils: { log } } = Apify;

Apify.main(async () => {
    const { startUrls } = await Apify.getInput();

    const requestQueue = await initializeRequestQueue(startUrls);
    // const proxyConfiguration = await Apify.createProxyConfiguration();

    const edubazaSchools = await Apify.getValue('EDUBAZA_DOMAIN_LIST') || [];
    Apify.events.on('persistState', async () => Apify.setValue('EDUBAZA_DOMAIN_LIST', edubazaSchools));

    const crawler = new Apify.CheerioCrawler({
        requestQueue,
        // proxyConfiguration,
        maxConcurrency: 50,
        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;
            log.info('Page opened.', { label, url });
            switch (label) {
                case 'LIST':
                    return handleList(context);
                case 'DETAIL':
                    return handleDetail(context, edubazaSchools);
                default:
                    return handleStart(context);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
