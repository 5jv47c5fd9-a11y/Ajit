/**
 * Sample preview dataset. Used when external APIs are unavailable (demo mode)
 * and as the authoritative fixture for UI previews and tests.
 */
const defaultFor = (company) => ({
  company_summary: `${company} is a large enterprise with distributed operations, accelerating investment in AI and automation, and increasing reliance on third-party service providers across CX, back-office, and trust & safety.`,
  competitors: {
    direct: [`${company} Competitor A`, `${company} Competitor B`, `${company} Competitor C`],
    indirect: ['Adjacent SaaS platform', 'Regional incumbent', 'AI-native insurgent'],
  },
  outsourcing_partners: ['Accenture (inferred)', 'Teleperformance', 'Genpact'],
  vendor_opportunities: [
    'AI-augmented CX expansion across EMEA and LATAM',
    'Trust & safety workflow modernization',
    'Finance operations consolidation with GenAI copilot layer',
  ],
  vendor_threats: [
    'Incumbent vendor renewal cycle shifting toward automation',
    'Rising RPA + GenAI in-house build',
  ],
  strategic_horizon: 'Expect measurable outsourcing expansion in CX and AI training ops over 6–18 months, with selective vendor consolidation pressure after month 12.',
  outsourcing_signals: [
    'Published RFI for multilingual CX platform',
    'New VP of Global Operations hired with BPO background',
  ],
  automation_risk_signals: [
    'Productivity mandates tied to AI adoption',
    'Public references to agentic AI in call center',
  ],
  cost_optimization_signals: [
    'Cost take-out program referenced in last earnings call',
    'Shared services consolidation in APAC',
  ],
  technology_stack_indicators: ['Salesforce', 'Snowflake', 'AWS', 'OpenAI', 'Zendesk'],
  hiring_signals: [
    'Ramping AI / ML engineers in India GCC',
    'Hiring Trust & Safety leadership in Manila',
  ],
  geographic_strategy_signals: [
    'Nearshoring pilot in Mexico City',
    'GCC expansion in Bengaluru',
  ],
  recommended_vendor_strategy: {
    if_already_vendor: 'Anchor a multi-year AI transformation narrative with measurable automation savings; proactively neutralize displacement risk with agentic co-pilots.',
    if_not_currently_vendor: 'Lead with an AI-native CX beachhead pilot in a high-growth region; co-design a 90-day proof of value with the COO office.',
  },
  executive_summary: 'Strong vendor opportunity window within 6–12 months, concentrated in CX and AI-training ops. Displacement risk for incumbents is elevated. Recommend immediate executive outreach and pilot proposal delivery.',
  digital_transformation_indicators: [
    'Cloud migration complete (>80%)',
    'AI Center of Excellence operational',
    'Data platform consolidated on Snowflake',
  ],
  cx_outsourcing_maturity: 'mature',
  vendor_replacement_risk_indicators: [
    'Incumbent contract expiring within 9 months',
    'Reported SLA disputes in trade press',
  ],
});

export const previewDataset = {
  default: defaultFor,
  acme: {
    ...defaultFor('Acme Corporation'),
    company_summary: 'Acme Corporation is a Fortune 500 diversified manufacturer and services firm piloting GenAI agents in customer support and investing in global capability centers to consolidate back-office operations.',
  },
  shopify: {
    ...defaultFor('Shopify'),
    company_summary: 'Shopify is a commerce platform aggressively embedding AI across merchant tooling, scaling its merchant trust & safety operations, and selectively expanding multilingual CX partnerships.',
  },
};
