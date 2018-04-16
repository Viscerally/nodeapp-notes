require('dotenv').config();

var request = require('request');

function translate(text, done) {
  request({
    url: `https://${process.env.WATSON_USERNAME}:${process.env.WATSON_PASSWORD}@gateway.watsonplatform.net/language-translator/api/v2/translate`,
    method: 'POST',
    json: {
      text,
      model_id: 'en-es-conversational'
    }
  },
  function(error, response, body) {
    done(error || body.error || null, body.translations);
  });
}

translate([
  'hello',
  'goodbye',
  'we are learning',
  'what is for dinner?',
  'time for a coffee'
], function(error, translations) {
  if(error) {
    console.log(error);
  } else {
    translations.forEach(function(t) {
      console.log(t.translation);
    });
  }
});
