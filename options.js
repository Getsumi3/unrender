module.exports = combineOptions;

const normalizeColor = require('./lib/normalize-color.js');

function combineOptions(options) {
    options = options || Object.create(null);

    const clearColor = normalizeColor(options.clearColor);

    /**
     * Background of the scene in hexadecimal form. Default value is 0x000000 (black);
     */
    options.clearColor = typeof clearColor === 'number' ? clearColor : 0x000000;

    return options;
}
