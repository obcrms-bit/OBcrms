const legacyLeadController = require('../../../controllers/lead.controller');
const { runLegacyHandler } = require('../../shared/http/runLegacyHandler');

async function executeLegacyLeadHandler(handlerName, req, res, next) {
  return runLegacyHandler(legacyLeadController[handlerName], req, res, next);
}

module.exports = {
  executeLegacyLeadHandler,
};
