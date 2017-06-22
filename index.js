const request = require("request-promise-native");
const cheerio = require("cheerio");
const urlLib = require("url");
const Twit = require("twit");
require("dotenv").config();

const ALLOWED_TYPES = [
    "Video Game",
    "Film",
    "Series"
];

const getPage = async (url) => {
    const $ = await request.get({
        url: url,
        transform: (body) => cheerio.load(body)
    });

    return $;
};

const getType = ($) => $(".page-title strong").text().trim();

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
};

const processEntry = async (url) => {
    const $ = await getPage(url);
    const type = getType($);
    console.warn(type);
    if (ALLOWED_TYPES.some((el) => type.includes(el))) {
        const title = getTitle($);
        tweet(`PlayerUnknown's ${title}`);
    } else {
        const next = getNext($, url);
        processEntry(next);
    }
};

const generateUnknownPlayer = async () => {
    const url = "http://tvtropes.org/";
    const $ = await getPage(url);
    const next = getNext($, url);
    processEntry(next);
};


generateUnknownPlayer();
