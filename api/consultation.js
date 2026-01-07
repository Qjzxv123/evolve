const { createClient } = require('@supabase/supabase-js');

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

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Supabase credentials not configured' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { error } = await supabase
            .from('consultations')
            .insert({
                name,
                email,
                company,
                details,
            });

        if (error) {
            throw error;
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Consultation API error', error);
        return res.status(500).json({ error: 'Failed to submit consultation request' });
    }
};
