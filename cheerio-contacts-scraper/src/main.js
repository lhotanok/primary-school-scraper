const Apify = require('apify');
const { storeResult } = require('../../contacts-scraper/src/helpers');
const { getDomain, enqueueLinks } = require('./tools');

const { utils: { log } } = Apify;

Apify.main(async () => {
    const { startUrls, sameDomain, maxLinkDepth } = await Apify.getInput();

    const requestList = await Apify.openRequestList('start-urls', startUrls);
    const requestQueue = await Apify.openRequestQueue();
    // const proxyConfiguration = await Apify.createProxyConfiguration();

    const domains = await Apify.getValue('DOMAINS_RESULT') || {};
    Apify.events.on('persistState', async () => Apify.setValue('DOMAINS_RESULT', domains));

    const crawler = new Apify.CheerioCrawler({
        requestList,
        requestQueue,
        // proxyConfiguration,
        handlePageFunction: async (context) => {
            const { $, request } = context;
            const { url, userData: { label } } = request;
            log.info('Page opened.', { label, url });

            if (!$) return;

            const html = $.html();
            const socialHandles = Apify.utils.social.parseHandlesFromHtml(html);
            const { emails } = socialHandles;

            const result = {
                url,
                domain: getDomain(url),
                erasmus: html.match(/erasmus/gi),
                emails,
            };

            await storeResult(domains, result);
            await enqueueLinks($, request, requestQueue, sameDomain, maxLinkDepth);
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
