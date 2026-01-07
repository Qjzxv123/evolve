const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

const requiredFields = ['name', 'email', 'company', 'details'];

function validate(body = {}) {
    const missing = requiredFields.filter((field) => !body[field]);
    return {
        valid: missing.length === 0,
        missing,
    };
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, company, details } = req.body || {};
    const { valid, missing } = validate({ name, email, company, details });

    if (!valid) {
        return res.status(400).json({ error: 'Missing required fields', missing });
    }

    const mailTo = process.env.MAIL_TO || 'evolveteamaidan@gmail.com';
    const mailFrom = process.env.MAIL_FROM || process.env.MAIL_TO || 'noreply@evolve.local';
    const smsTo = process.env.ALERT_SMS_TO || '8289998100';
    const {
        SENDGRID_API_KEY,
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_FROM,
    } = process.env;

    try {
        if (!SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY missing');
        }

        sgMail.setApiKey(SENDGRID_API_KEY);
        await sgMail.send({
            to: mailTo,
            from: mailFrom,
            replyTo: email,
            subject: `New Consultation Request from ${name}`,
            text: [
                `Name: ${name}`,
                `Email: ${email}`,
                `Company: ${company}`,
                `Details: ${details}`,
            ].join('\n'),
        });

        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
            const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
            const smsBody = `Consultation request - ${name} (${email}, ${company}): ${details}`;
            await client.messages.create({
                body: smsBody.slice(0, 1500),
                from: TWILIO_FROM,
                to: smsTo,
            });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Consultation API error', error);
        return res.status(500).json({ error: 'Failed to submit consultation request' });
    }
};
