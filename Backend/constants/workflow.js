/**
 * Workflow Transition Validation
 * Defines allowed status transitions for Leads, Students, and Applicants
 */

const WORKFLOW_TRANSITIONS = {
    LEAD: {
        new: ["contacted", "qualified", "lost", "junk"],
        contacted: ["qualified", "converted", "lost", "junk"],
        qualified: ["converted", "lost", "junk"],
        converted: [], // Once converted, it becomes a student
        lost: ["new", "contacted"],
        junk: ["new"],
    },
    STUDENT: {
        prospect: ["counseling", "rejected", "withdrawn"],
        counseling: ["document-collection", "rejected", "withdrawn"],
        "document-collection": ["application-submitted", "rejected", "withdrawn"],
        "application-submitted": ["visa-processing", "rejected", "withdrawn"],
        "visa-processing": ["visa-approved", "rejected", "withdrawn"],
        "visa-approved": ["enrolled"],
        enrolled: [],
        rejected: ["prospect", "counseling"],
        withdrawn: ["prospect"],
    },
    APPLICANT: {
        draft: ["submitted", "withdrawn"],
        submitted: ["offer-received", "rejected", "withdrawn"],
        "offer-received": ["conditioned", "unconditioned", "rejected"],
        conditioned: ["unconditioned", "rejected"],
        unconditioned: ["cas-issued", "rejected"],
        "cas-issued": ["visa-applied", "rejected"],
        "visa-applied": ["visa-granted", "visa-rejected"],
        "visa-granted": ["enrolled"],
        "visa-rejected": ["visa-applied", "rejected"],
        enrolled: [],
    },
};

/**
 * Validates if a transition is allowed
 * @param {string} resourceType - LEAD, STUDENT, or APPLICANT
 * @param {string} currentStatus 
 * @param {string} nextStatus 
 * @returns {boolean}
 */
const isValidTransition = (resourceType, currentStatus, nextStatus) => {
    const transitions = WORKFLOW_TRANSITIONS[resourceType];
    if (!transitions) return false;

    const allowed = transitions[currentStatus];
    if (!allowed) return false;

    return allowed.includes(nextStatus);
};

module.exports = {
    WORKFLOW_TRANSITIONS,
    isValidTransition,
};
