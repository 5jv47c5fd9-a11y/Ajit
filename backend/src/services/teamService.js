import { v4 as uuid } from 'uuid';

const orgs = new Map(); // orgId -> { shares: [{id, type, ref, ownerId, assignedTo}], dashboards: {...} }

function getOrg(orgId) {
  if (!orgs.has(orgId)) orgs.set(orgId, { shares: [], assignments: {} });
  return orgs.get(orgId);
}

export const teamService = {
  share(orgId, { type, ref, ownerId, assignedTo = null }) {
    const org = getOrg(orgId);
    const entry = { id: uuid(), type, ref, ownerId, assignedTo, createdAt: Date.now() };
    org.shares.push(entry);
    return entry;
  },
  list(orgId) {
    return getOrg(orgId).shares;
  },
  assign(orgId, company, userId) {
    const org = getOrg(orgId);
    org.assignments[company.toLowerCase()] = userId;
    return org.assignments;
  },
  assignments(orgId) {
    return getOrg(orgId).assignments;
  },
};
