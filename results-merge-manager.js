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

function main() {
    const SCHOOLS_RESULT_PATH = 'schools-scraper/apify_storage/key_value_stores/default/SCHOOLS_RESULT.json';
    const DOMAINS_RESULT_PATH = 'contacts-scraper/apify_storage/key_value_stores/default/DOMAINS_RESULT.json';
    const CHEERIO_DOMAINS_RESULT_PATH = 'cheerio-contacts-scraper/apify_storage/key_value_stores/default/DOMAINS_RESULT.json';

    const RESULTS_PATH = 'RESULTS.json';
    const CHEERIO_RESULTS_PATH = 'CHEERIO_RESULTS.json';

    const schoolsResult = JSON.parse(readFile(SCHOOLS_RESULT_PATH));
    const domainsResult = JSON.parse(readFile(DOMAINS_RESULT_PATH));
    const cheerioDomainsResult = JSON.parse(readFile(CHEERIO_DOMAINS_RESULT_PATH));

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

            if (cheerioDomainsResult[domain]) {
                const { emails, erasmusList } = cheerioDomainsResult[domain];
                result.emails = emails;
                result.erasmusList = erasmusList;
            }

            result.emails = Array.from(new Set(result.emails))
            result.erasmusList = Array.from(new Set(result.erasmusList))
        }

        return result;
    });

    console.log(`Merged ${results.length} school results`);

    writeFile(RESULTS_PATH, JSON.stringify(results, null, 2));
    writeFile(CHEERIO_RESULTS_PATH, JSON.stringify(results, null, 2));
}

main()