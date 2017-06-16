const keySpace = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ1234567890'
const idLength = 15;

module.exports = function() {
    let id = '';

    for(let i = 0; i < idLength; i++) {
        id += keySpace[Math.floor(Math.random() * keySpace.length)];
    }

    return id;
};