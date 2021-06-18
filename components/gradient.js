var gradients = require("./gradients.json");

// Returns a random number between 0 and upperBound-1
function randomNumber(upperBound) {
    return Math.floor(Math.random()*upperBound);
}
module.exports = {
    get: function() {
        return gradients[randomNumber(gradients.length)];
    }
}