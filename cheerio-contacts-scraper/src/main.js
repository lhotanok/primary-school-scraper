const Apify = require('apify');
const domain = require('getdomain');
const { storeResult } = require('../../contacts-scraper/src/helpers');

const { utils: { log } } = Apify;

Apify.main(async () => {
    const { startUrls } = await Apify.getInput();

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
            const { $ } = context;
            const { url, userData: { label } } = context.request;
            log.info('Page opened.', { label, url });

            if (!$) return;

            const html = $.html();
            const socialHandles = Apify.utils.social.parseHandlesFromHtml(html);
            const { emails } = socialHandles;

            const links = $('[href]').map((_i, el) => $(el).attr('href')).toArray();
            const urlDomain = domain.get(url);

            const result = {
                url,
                domain: urlDomain,
                erasmus: html.match(/erasmus/gi),
                emails,
            };

            await storeResult(domains, result);

            const sameDomainLinks = links.filter((link) => {
                const sameDomain = urlDomain === domain.get(link);
                const allowedUrl = !link.match(/\.(jp(e)?g|bmp|png|gif|pdf|mp3|m4a|mkv|avi|css)/gi);
                return sameDomain && allowedUrl;
            });

            for (const link of sameDomainLinks) {
                await requestQueue.addRequest({ url: link });
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
