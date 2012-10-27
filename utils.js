// utils
// by Daniel Rodríguez
// MIT Licensed

var utils = module.exports = {}

// Shortcode function
// a slightly modified version of
// the original shortcode function
// for JS Bin written by Remy Sharp
utils.shortcode = function() {
  var vowels        = 'aeiou'
    , consonants    = 'bcdfghjklmnpqrstvwxyz'
    , i             = 0
    , l             = 5
    , word          = ''
    , letter
    , set

  for (; i < l; i += 1) {
    set    = (i%2 === 0) ? consonants : vowels
    letter = set[(Math.random() * set.length) >> 0]
    if (Math.random() * 2 >> 0) {
      letter = letter.toUpperCase()
    }
    word += letter
  }

  return word
}
