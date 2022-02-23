const Apify = require('apify');
const _ = require('underscore');
const domain = require('getdomain');

const { log } = Apify.utils;

const { Request } = Apify;

async function extractUrlsFromPage(page, selector, sameDomain, urlDomain) {
    /* istanbul ignore next */
    const allLinks = await page.$$eval(selector, (linkEls) => linkEls
        .map((link) => link.href)
        .filter((href) => !!href));

    const filteredLinks = allLinks.filter((url) => (sameDomain ? module.exports.getDomain(url) === urlDomain : true));
    log.info(`Found ${filteredLinks.length} links on ${page.url()}`);
    return filteredLinks;
}

function createRequestOptions(sources, userData = {}) {
    return sources
        .map((src) => (typeof src === 'string' ? { url: src } : src))
        .filter(({ url }) => {
            try {
                return new URL(url).href;
            } catch (err) {
                return false;
            }
        })
        .map((rqOpts) => {
            const rqOptsWithData = rqOpts;
            rqOptsWithData.userData = { ...rqOpts.userData, ...userData };
            return rqOptsWithData;
        });
}

function createRequests(requestOptions, pseudoUrls) {
    if (!(pseudoUrls && pseudoUrls.length)) {
        return requestOptions.map((opts) => new Request(opts));
    }

    const requests = [];
    requestOptions.forEach((opts) => {
        pseudoUrls
            .filter((purl) => purl.matches(opts.url))
            .forEach((purl) => {
                const request = purl.createRequest(opts);
                requests.push(request);
            });
    });
    return requests;
}

async function addRequestsToQueue({ requests, requestQueue, maxRequestsPerStartUrl, requestsPerStartUrlCounter, startUrl }) {
    for (const request of requests) {
        if (maxRequestsPerStartUrl) {
            if (requestsPerStartUrlCounter[startUrl].counter < maxRequestsPerStartUrl) {
                request.userData.startUrl = startUrl;
                const { wasAlreadyPresent } = await requestQueue.addRequest(request);
                if (!wasAlreadyPresent) {
                    requestsPerStartUrlCounter[startUrl].counter++;
                }
            } else if (!requestsPerStartUrlCounter[startUrl].wasLogged) {
                log.warning(`Enqueued max pages for start URL: ${startUrl}, will not enqueue any more`);
                requestsPerStartUrlCounter[startUrl].wasLogged = true;
            }
        } else {
            await requestQueue.addRequest(request);
        }
    }
}

module.exports = {
    async getAttribute(element, attr) {
        try {
            const prop = await element.getProperty(attr);
            return (await prop.jsonValue()).trim();
        } catch (e) {
            return null;
        }
    },

    getDomain(url) {
        return domain.get(url);
    },

    crawlFrames: async (page) => {
        const socialMedia = [
            'emails',
            'phones',
            'phonesUncertain',
            'linkedIns',
            'twitters',
            'instagrams',
            'facebooks',
            'youtubes',
            'tiktoks',
            'pinterests',
            'discords'
        ];
        const socialHandles = {};
        
        const frames = page.mainFrame().childFrames();
        frames.forEach(async (item) => {
            try {
                const html = await item.content();
                let childSocialHandles = null;
                const childParseData = {};
                childSocialHandles = Apify.utils.social.parseHandlesFromHtml(html, childParseData);

                socialMedia.forEach((field) => {
                    socialHandles[field] = childSocialHandles[field];
                });
            } catch (e) {
                log.warning('One of the child frames failed to load', { message: e.toString(), url: page.url() });
            }
        });


        socialMedia.forEach((field) => {
            socialHandles[field] = _.uniq(socialHandles[field]);
        });

        return socialHandles;
    },

    mergeSocial(frames, main) {
        const output = main;

        Object.keys(output).forEach((key) => {
            // If frames[key] is undefined, we get [item, null] from concatenation.
            const keyResult = frames[key] ? main[key].concat(frames[key]) : main[key];
            output[key] = _.uniq(keyResult);
        });

        return output;
    },

    enqueueUrls: async (options = {}) => {
        const {
            page,
            requestQueue,
            selector = 'a',
            sameDomain,
            urlDomain,
            depth,
            startUrl,
            maxRequestsPerStartUrl,
            requestsPerStartUrlCounter,
        } = options;

        const urls = await extractUrlsFromPage(page, selector, sameDomain, urlDomain);

        const requestOptions = createRequestOptions(urls, { depth: depth + 1 });

        const requests = createRequests(requestOptions);
        await addRequestsToQueue({ requests, requestQueue, startUrl, maxRequestsPerStartUrl, requestsPerStartUrlCounter });
    },

    normalizeUrls: (urls) => {
        const PROTOCOL_REGEX = /^((.)+:\/\/)/;
        const BASE_URL_PATTERN = 'http://example.com';

        return urls.map(({ url }) => {
            const urlWithoutProtocol = url.replace(PROTOCOL_REGEX, '');
            const relativeUrl = `//${urlWithoutProtocol}`;
            const normalizedUrl = new URL(relativeUrl, BASE_URL_PATTERN)
    
            return normalizedUrl.toString();
        });
    },

    async storeResult(domains, result) {
        if (!result.emails.length) return;
    
        const { domain, erasmus } = result;
        domains[domain] = domains[domain] || {
            erasmus,
            emails: [],
        };
        Object.keys(result).forEach((key) => {
            const contacts = domains[domain][key];
            if (contacts) {
                result[key].forEach((contact) => {
                    domains[domain][key].push(contact);
                    domains[domain][key] = Array.from(new Set(domains[domain][key]))
                })
            }
        });

        await Apify.pushData(result);
        await Apify.setValue('DOMAINS_RESULT', domains);
    },
};
