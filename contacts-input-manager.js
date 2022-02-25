const fs = require('fs');

function readFile(filePath) {
    const FILE_ENCODING = 'utf8';
    return fs.readFileSync(`${__dirname}/${filePath}`, FILE_ENCODING);
}

function writeFile(filePath, content) {
    return fs.writeFileSync(`${__dirname}/${filePath}`, content);
}

function main() {
    const SCHOOLS_RESULT_PATH = 'schools-scraper/apify_storage/key_value_stores/default/SCHOOLS_RESULT.json';
    const CONTACTS_INPUT_PATH = 'contacts-scraper/apify_storage/key_value_stores/default/INPUT.json';
    const CHEERIO_CONTACTS_INPUT_PATH = 'cheerio-contacts-scraper/apify_storage/key_value_stores/default/INPUT.json';

    const schoolsResult = JSON.parse(readFile(SCHOOLS_RESULT_PATH));
    const schoolUrls = schoolsResult
        .map((school) => school.homepage)
        .filter((url) => url);

    const startUrls = schoolUrls.map((url) => ({ url }));

    console.log(`Extracted ${startUrls.length} school urls`);

    const contactsInput = {
        startUrls,
        maxLinkDepth: 1,
        sameDomain: true,
    }

    writeFile(CONTACTS_INPUT_PATH, JSON.stringify(contactsInput, null, 2));
    writeFile(CHEERIO_CONTACTS_INPUT_PATH, JSON.stringify(contactsInput, null, 2));
}

main()