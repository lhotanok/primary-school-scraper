const Apify = require('apify');

exports.storeResult = async (domains, result) => {
    if (!result.emails.length) return;

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

    await Apify.pushData(result);
    await Apify.setValue('DOMAINS_RESULT', domains);
};
