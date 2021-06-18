var randomstring = require("randomstring");

module.exports = {
    get: function() {
        return randomstring.generate({
            length: 5,
            capitalization: "uppercase"
        });
    }
}
