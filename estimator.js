// Cost Estimator Calculator
const basePrices = {
    quick: 500,
    optimization: 2000,
    overhaul: 5000
};

const complexityMultiplier = {
    simple: 0.8,
    moderate: 1.0,
    complex: 1.4
};

const timelineMultiplier = {
    urgent: 1.5,
    standard: 1.0,
    flexible: 0.9
};

const employeeBase = 100; // per employee after first 5
const integrationCost = 300; // per integration
const trainingCost = 500;
const supportCost = 400;

function calculateEstimate() {
    // Get selected tier
    const tier = document.querySelector('input[name="tier"]:checked').value;
    let baseCost = basePrices[tier];
    
    const scaleCost = 0;
    
    // Count integrations
    const integrations = document.querySelectorAll('input[name="integration"]:checked').length;
    const integrationTotal = integrations * integrationCost;
    
    // Get complexity
    const complexity = document.getElementById('complexity').value;
    const complexityFactor = complexityMultiplier[complexity];
    
    // Get timeline
    const timeline = document.getElementById('timeline').value;
    const timelineFactor = timelineMultiplier[timeline];
    
    // Check add-ons
    const training = document.getElementById('training').checked ? trainingCost : 0;
    const support = document.getElementById('support').checked ? supportCost : 0;
    const addonsTotal = training + support;
    
    // Calculate complexity cost (applied to base + scale + integrations)
    const baseTotal = baseCost + scaleCost + integrationTotal;
    const complexityTotal = baseTotal * (complexityFactor - 1);
    
    // Calculate timeline cost
    const timelineTotal = (baseTotal + complexityTotal) * (timelineFactor - 1);
    
    // Calculate total
    const total = baseTotal + complexityTotal + timelineTotal + addonsTotal;
    
    // Update display
    document.getElementById('estimate-amount').textContent = '$' + Math.round(total).toLocaleString();
    
    const rangeMin = Math.round(total * 0.85);
    const rangeMax = Math.round(total * 1.15);
    document.getElementById('estimate-range').textContent = `Range: $${rangeMin.toLocaleString()} - $${rangeMax.toLocaleString()}`;
    
    // Update breakdown
    document.getElementById('base-cost').textContent = '$' + baseCost.toLocaleString();
    document.getElementById('scale-cost').textContent = '$' + Math.round(scaleCost).toLocaleString();
    document.getElementById('integration-cost').textContent = '$' + integrationTotal.toLocaleString();
    document.getElementById('complexity-cost').textContent = complexityFactor !== 1.0 ? 
        (complexityFactor > 1 ? '+$' : '-$') + Math.abs(Math.round(complexityTotal)).toLocaleString() : '$0';
    document.getElementById('timeline-cost').textContent = timelineFactor !== 1.0 ? 
        (timelineFactor > 1 ? '+$' : '-$') + Math.abs(Math.round(timelineTotal)).toLocaleString() : '$0';
    document.getElementById('addons-cost').textContent = '$' + addonsTotal.toLocaleString();
}

// Add event listeners to all form inputs
document.querySelectorAll('input[name="tier"]').forEach(input => {
    input.addEventListener('change', calculateEstimate);
});

document.querySelectorAll('input[name="integration"]').forEach(input => {
    input.addEventListener('change', calculateEstimate);
});

document.getElementById('complexity').addEventListener('change', calculateEstimate);
document.getElementById('timeline').addEventListener('change', calculateEstimate);
document.getElementById('training').addEventListener('change', calculateEstimate);
document.getElementById('support').addEventListener('change', calculateEstimate);

// Initial calculation
calculateEstimate();
