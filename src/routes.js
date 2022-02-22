const Apify = require('apify');
const { enqueueListPage, enqueuePaginationPage, enqueueDetailPages, extractSchoolDetailEmails } = require('./tools');
const { SELECTORS } = require('./constants');

const { utils: { log } } = Apify;

exports.handleStart = async (context, subRegionNames) => {
    const { $, request, crawler: { requestQueue } } = context;
    const subRegionElements = $(SELECTORS.SUBREGIONS);

    const subRegions = subRegionElements.map((_i, el) => {
        const url = $(el).attr('href');
        const name = $(el).text().trim();
        return { url, name };
    }).toArray();

    const requiredSubRegions = subRegions
        .filter((subRegion) => (subRegionNames ? subRegionNames.includes(subRegion.name) : true));

    const totalSchools = $(SELECTORS.TOTAL_SCHOOLS).text().trim();
    log.debug(`Found ${totalSchools} schools`, { url: request.url });

    for (const subRegion of requiredSubRegions) {
        const { url, name } = subRegion;
        const userData = {
            regionName: name,
            currentPage: 0,
        };
        await enqueueListPage(url, requestQueue, userData);
    }
};

exports.handleList = async (context) => {
    await enqueueDetailPages(context);
    await enqueuePaginationPage(context);
};

exports.handleDetail = async ({ request, $ }) => {
    const { url, userData: { regionName } } = request;

    const { SCHOOL_NAME, ADDRESS, TELEPHONE } = SELECTORS;

    const name = $(SCHOOL_NAME).text().trim();
    const homepage = $(SELECTORS.SCHOOL_HOMEPAGE).attr('href') || null;
    const address = $(ADDRESS).attr('value') || null;
    const telephone = $(TELEPHONE).text().trim() || null;
    const emails = extractSchoolDetailEmails($);

    const schoolDetail = {
        name,
        url,
        homepage,
        regionName,
        address,
        telephone,
        emails,
    };

    await Apify.pushData(schoolDetail);
};
