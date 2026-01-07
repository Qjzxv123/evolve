'use strict';

const fs = require('fs/promises');
const path = require('path');

// Environment-driven configuration
const SERP_API_KEY = process.env.SERPAPI_API_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL;
const FROM_NAME = process.env.OUTREACH_FROM_NAME || 'Outreach Bot';
const REPLY_TO = process.env.OUTREACH_REPLY_TO || FROM_EMAIL;
const DRY_RUN = (process.env.OUTREACH_DRY_RUN || 'true').toLowerCase() === 'true';
const MAX_EMAILS = Number(process.env.OUTREACH_MAX_EMAILS || 5);

// Search + scraping setup
const FORUM_SITES = [
    'reddit.com/r/smallbusiness',
    'www.reddit.com/r/smallbusiness',
    'small-business-forum.net',
    'www.small-business-forum.net',
    'warriorforum.com',
    'www.warriorforum.com',
];

const KEYWORDS = [
    'looking for marketing help',
    'need help automating my business',
    'recommend automation agency',
    'looking for website redesign for my business',
    'small business lead generation help',
];

const STATE_FILE = path.join(__dirname, 'prospect-state.json');
const USER_AGENT = 'evolve-prospect-bot/1.0 (+contact: outreach)';

function assertFetch() {
    if (typeof fetch !== 'function') {
        throw new Error('This bot needs Node 18+ with global fetch available.');
    }
}

function ensureEnv(value, name) {
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}

async function readState() {
    try {
        const raw = await fs.readFile(STATE_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        return { contacted: {} };
    }
}

async function writeState(state) {
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

function uniqueLeads(leads) {
    const seen = new Set();
    return leads.filter((lead) => {
        const key = `${lead.threadUrl}|${lead.email}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function extractEmails(html) {
    const matches = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
    return Array.from(new Set(matches));
}

function extractTitle(html) {
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? match[1].trim() : '';
}

function stripAndSummarize(html, limit = 320) {
    const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<\/?[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return cleaned.length > limit ? `${cleaned.slice(0, limit)}...` : cleaned;
}

async function searchSerp(keyword) {
    ensureEnv(SERP_API_KEY, 'SERPAPI_API_KEY');
    const siteFilter = FORUM_SITES.map((site) => `site:${site}`).join(' OR ');
    const query = `${keyword} (${siteFilter})`;

    const url = new URL('https://serpapi.com/search.json');
    url.search = new URLSearchParams({
        engine: 'google',
        q: query,
        api_key: SERP_API_KEY,
        num: '10',
    }).toString();

    const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
    });

    if (!response.ok) {
        throw new Error(`Search failed (${response.status}) for keyword "${keyword}"`);
    }

    const data = await response.json();
    const results = data.organic_results || [];
    return results
        .map((item) => ({
            link: item.link,
            title: item.title,
            snippet: item.snippet || '',
        }))
        .filter((item) => Boolean(item.link));
}

async function scrapeLead(link) {
    try {
        const response = await fetch(link, {
            headers: { 'User-Agent': USER_AGENT },
        });
        if (!response.ok) {
            throw new Error(`Scrape failed (${response.status}) for ${link}`);
        }

        const html = await response.text();
        const emails = extractEmails(html);
        const title = extractTitle(html);
        const summary = stripAndSummarize(html, 420);

        return { emails, title, summary };
    } catch (error) {
        console.warn(`Skipping ${link}: ${error.message}`);
        return { emails: [], title: '', summary: '' };
    }
}

async function gatherLeads(state) {
    const leads = [];

    for (const keyword of KEYWORDS) {
        const searchResults = await searchSerp(keyword);

        for (const result of searchResults) {
            if (state.contacted[result.link]) {
                continue;
            }

            const scraped = await scrapeLead(result.link);
            const email = scraped.emails.find((address) => !address.endsWith('@reddit.com'));
            if (!email) {
                continue;
            }

            leads.push({
                keyword,
                email,
                threadUrl: result.link,
                title: scraped.title || result.title,
                snippet: scraped.summary || result.snippet,
            });
        }
    }

    return uniqueLeads(leads);
}

function buildEmail(lead) {
    const topic = lead.title || lead.snippet || 'your post';
    const subject = `Idea after your forum post about ${topic.slice(0, 48)}`;

    const greeting = 'Hi there,';
    const opener = `I came across your thread "${topic}" and it sounded like you want traction without adding headcount.`;
    const pitch =
        'I run lightweight automations for small businesses: lead capture, follow-ups, and task routing that keep teams moving without manual babysitting.';
    const offer = `If you want, I can draft a quick automation map tailored to what you mentioned (${lead.threadUrl}).`;
    const cta = 'Are you open to a 10-minute teardown this week?';

    const textBody = [greeting, opener, pitch, offer, cta, 'Best,', FROM_NAME].join('\n\n');
    const htmlBody = `
<p>${greeting}</p>
<p>${opener}</p>
<p>${pitch}</p>
<p>${offer}</p>
<p>${cta}</p>
<p>Best,<br />${FROM_NAME}</p>
`.trim();

    return { subject, textBody, htmlBody };
}

async function sendEmail(to, content) {
    ensureEnv(SENDGRID_API_KEY, 'SENDGRID_API_KEY');
    ensureEnv(FROM_EMAIL, 'OUTREACH_FROM_EMAIL');

    const body = {
        personalizations: [
            {
                to: [{ email: to }],
                subject: content.subject,
            },
        ],
        from: {
            email: FROM_EMAIL,
            name: FROM_NAME,
        },
        reply_to: REPLY_TO ? { email: REPLY_TO } : undefined,
        content: [
            { type: 'text/plain', value: content.textBody },
            { type: 'text/html', value: content.htmlBody },
        ],
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`SendGrid error (${response.status}): ${message}`);
    }
}

async function run() {
    assertFetch();
    ensureEnv(SERP_API_KEY, 'SERPAPI_API_KEY');

    if (!DRY_RUN) {
        ensureEnv(SENDGRID_API_KEY, 'SENDGRID_API_KEY');
        ensureEnv(FROM_EMAIL, 'OUTREACH_FROM_EMAIL');
    }

    const state = await readState();
    const leads = await gatherLeads(state);

    if (!leads.length) {
        console.log('No new leads found.');
        return;
    }

    let processed = 0;
    for (const lead of leads) {
        if (processed >= MAX_EMAILS) {
            break;
        }

        const emailContent = buildEmail(lead);
        if (DRY_RUN) {
            console.log('--- DRY RUN: email preview ---');
            console.log(`To: ${lead.email}`);
            console.log(`Subject: ${emailContent.subject}`);
            console.log(emailContent.textBody);
        } else {
            await sendEmail(lead.email, emailContent);
            console.log(`Sent to ${lead.email} (${lead.threadUrl})`);
        }

        state.contacted[lead.threadUrl] = {
            email: lead.email,
            keyword: lead.keyword,
            sentAt: new Date().toISOString(),
        };
        processed += 1;
    }

    await writeState(state);
    console.log(`Processed ${processed} lead(s).`);
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
