const gameIdIsValid = id => /[a-z0-9-]+/.test(String(id))

module.exports = {
  gameIdIsValid
}
