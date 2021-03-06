const fs = require('fs');
const domain = require('getdomain');

function readFile(filePath) {
    const FILE_ENCODING = 'utf8';
    return fs.readFileSync(`${__dirname}/${filePath}`, FILE_ENCODING);
}

function writeFile(filePath, content) {
    return fs.writeFileSync(`${__dirname}/${filePath}`, content);
}

function getDomain(url) {
    return domain.get(url);
}

function mergeResults(schoolResults, domainsResult) {
    const results = schoolsResult.map((schoolResult) => {
        const result = schoolResult;

        const { homepage } = schoolResult;
        if (homepage) {
            const domain = getDomain(homepage);
            if (domainsResult[domain]) {
                const { emails, erasmusList } = domainsResult[domain];
                result.emails = emails;
                result.erasmusList = erasmusList;
            }
        }

        return result;
    });

    return results;
}

function main() {
    const SCHOOLS_RESULT_PATH = 'schools-scraper/apify_storage/key_value_stores/default/SCHOOLS_RESULT.json';
    const PUPPETEER_DOMAINS_RESULT_PATH = 'contacts-scraper/apify_storage/key_value_stores/default/DOMAINS_RESULT.json';
    const CHEERIO_DOMAINS_RESULT_PATH = 'cheerio-contacts-scraper/apify_storage/key_value_stores/default/DOMAINS_RESULT.json';

    const PUPPETEER_RESULTS_PATH = 'PUPPETEER_RESULTS.json';
    const CHEERIO_RESULTS_PATH = 'CHEERIO_RESULTS.json';

    const schoolsResult = JSON.parse(readFile(SCHOOLS_RESULT_PATH));
    const puppeteerDomainsResult = JSON.parse(readFile(PUPPETEER_DOMAINS_RESULT_PATH));
    const cheerioDomainsResult = JSON.parse(readFile(CHEERIO_DOMAINS_RESULT_PATH));

    const puppeteerMergedResults = mergeResults(schoolsResult, puppeteerDomainsResult);
    const cheerioMergedResults = mergeResults(schoolsResult, cheerioDomainsResult);

    console.log(`Merged ${results.length} school results`);

    writeFile(PUPPETEER_RESULTS_PATH, JSON.stringify(puppeteerMergedResults, null, 2));
    writeFile(CHEERIO_RESULTS_PATH, JSON.stringify(cheerioMergedResults, null, 2));
}

main()