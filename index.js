const request = require("request-promise-native");
const cheerio = require("cheerio");
const urlLib = require("url");
const Twit = require("twit");
require("dotenv").config();

const getPage = async (url) => {
    const $ = await request.get({
        url: url,
        transform: (body) => cheerio.load(body)
    });

    return $;
};

const getType = ($) => {
    const type = $(".page-title strong").text().trim();
    return type;
};

const getTitle = ($) => {
    const full = $(".page-title").text().trim();
    const type = getType($);
    const title = full.replace(type, "").trim();
    return title;
};

const getNext = ($, url) => {
    const href = $("a:contains('Random Media')").first().attr("href");
    return urlLib.resolve(url, href);
};

const allowedTypes = [
    "Video Game",
    "Film",
    "Series"
];

const processEntry = async (url) => {
    const $ = await getPage(url);
    const type = getType($);
    console.warn(type);
    if (allowedTypes.some((el) => type.includes(el))) {
        const title = getTitle($);
        tweet(`PlayerUnknown's ${title}`);
    } else {
        const next = getNext($, url);
        processEntry(next);
    }
};

const generateUnknownPlayer = async () => {
    const url = "http://tvtropes.org/pmwiki/pmwiki.php/Series/LawAndOrder";
    const $ = await getPage(url);
    const next = getNext($, url);
    processEntry(next);
};

const tweet = async (text) => {
    const t = new Twit({
        consumer_key:         process.env.TWITTER_CONSUMER_KEY,
        consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
        access_token:         process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET
    });
    console.log(text);
    try {
        await t.post('statuses/update', { status: text });
        console.log("success");
    } catch (e) {
        console.warn(e);
    }
}

generateUnknownPlayer();
