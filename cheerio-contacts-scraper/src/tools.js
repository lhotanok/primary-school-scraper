const Apify = require('apify');
const getdomain = require('getdomain');

// const { utils: { log } } = Apify;

exports.getDomain = (url) => getdomain.get(url);

exports.enqueueLinks = async ($, request, requestQueue, stayWithinDomain, maxLinkDepth) => {
    const { url, userData } = request;

    const currentDepth = userData.currentDepth || 0;

    if (currentDepth >= maxLinkDepth) {
        // log.info(`Current depth: ${currentDepth}, not enqueing more links`);
        return;
    }

    let links = $('[href]').map((_i, el) => $(el).attr('href')).toArray();

    if (stayWithinDomain) {
        links = filterSameDomainLinks(links, url);
    }

    for (const link of links) {
        await requestQueue.addRequest({
            url: link,
            userData: {
                currentDepth: currentDepth + 1,
            },
        });
    }
};

exports.storeResult = async (domains, result) => {
    //if (result.emails.length === 0) {

      //  return;
    //}
    const { domain, erasmus, url } = result;
    domains[domain] = domains[domain] || {
        erasmusList: [],
        emails: [],
    };

    if (erasmus) {
        domains[domain].erasmusList.push(url);
        domains[domain].erasmusList = Array.from(new Set(domains[domain].erasmusList));
    }

    const { emails } = domains[domain];
    if (emails) {
        result.emails.forEach((email) => {
            domains[domain].emails.push(email);
            domains[domain].emails = Array.from(new Set(domains[domain].emails));
        });
    }

    // await Apify.pushData(result);
    // await Apify.setValue('DOMAINS_RESULT', domains);
};

const filterSameDomainLinks = (links, url) => {
    const urlDomain = getdomain.get(url);

    return links.filter((link) => {
        const sameDomain = urlDomain === getdomain.get(link);
        const allowedUrl = !link.match(/\.(jp(e)?g|bmp|png|gif|pdf|mp3|m4a|mkv|avi|css)/gi);
        return sameDomain && allowedUrl;
    });
};
