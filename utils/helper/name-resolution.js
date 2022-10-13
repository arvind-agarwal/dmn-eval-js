/*
 *
 *  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 *  Bangalore, India. All Rights Reserved.
 *
 */
const nameResolutionOrder = ['kwargs', 'context', 'decisionMap', 'plugin'];

const resolveName = (name, args) => {
  let index = 0;
  for (const key of nameResolutionOrder) {
    let value;
    if (key === 'plugin') {
      value = args.context && args.context.plugin && args.context.plugin[name];
    } else {
      value = args[key] && args[key][name];
    }

    if (typeof value !== 'undefined') {
      if (key === 'kwargs' || key === 'context') {
        return value;
      } if (key === 'decisionMap') {
        if (!isResult) {
          const result = value
            .build({ ...args.context, ...args.kwargs }, {
              decisionMap: args.decisionMap,
              plugin: args.plugin,
            });
          const decisionValue = typeof result === 'object'
            ? Object.keys(result).map((key) => result[key])[0]
            : result;
          return decisionValue;
        }
        const decision = {
          expr: value,
          isDecision: true,
        };
        return decision;
      } if (key === 'plugin') {
        if (typeof value === 'function') {
          // Assumption: functions added to plugins return a promise
          const result = value();
          return { context: result };
        }
        return value;
      }
      return true;
    }
    if (index === nameResolutionOrder.length - 1) {
      return value;
    }
    index++;
  }
  // return args.context && args.context[name];
};

module.exports = resolveName;
