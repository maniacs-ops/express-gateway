const express = require('express');
const logger = require('../logger').policy;
const schemas = require('../schemas');
const predefined = require('./predefined');
const conditions = {};

function register ({ name, handler, schema }) {
  const validate = schemas.register('condition', name, schema);

  conditions[name] = (req, config) => {
    const validationResult = validate(config);
    if (validationResult.isValid) {
      return handler(req, config);
    }

    logger.warn(`warning: condition ${name} config validation failed`, validationResult.error);
    return null;
  };
}

function init () {
  predefined.forEach(register);

  // extending express.request
  express.request.matchEGCondition = function (conditionConfig) {
    logger.debug('matchEGCondition for %o', conditionConfig);
    const func = conditions[conditionConfig.name];
    if (!func) {
      logger.debug(`warning: condition not found for ${conditionConfig.name}`);
      return null;
    }

    return func(this, conditionConfig);
  };

  return {
    register
  };
}

module.exports = {
  init
};
