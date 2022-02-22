exports.LABELS = {
    START: 'START',
    LIST: 'LIST',
    DETAIL: 'DETAIL',
};

exports.SELECTORS = {
    SUBREGIONS: '.okres [href]',
    TOTAL_SCHOOLS: '.searched b',
    SCHOOLS: '.doc_entry .school_name [href]',
    SCHOOL_NAME: 'h1',
    SCHOOL_HOMEPAGE: '.profil_basic_info .green[href]',
    ADDRESS: '[id="address"]',
    TELEPHONE: '[itemprop="telephone"]',
    EMAILS: '.my_modal_open',
};

exports.AT_SIGN = '@';
exports.AT_SIGN_REGEX = /<img src="\/\/applicationv2.just4web.cz\/img\/icon_at.png" alt="E-mail".*>/gi;

exports.RESULTS_PER_PAGE = 20;
exports.OFFSET_QUERY_PARAMETER = 'start';

exports.SCHOOLS_RESULT = 'SCHOOLS_RESULT';
