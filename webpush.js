const webpush = require("web-push");
const { PUBLIC_VAPID_KEY, PRIVATE_VAPID_KEY } = process.env;

webpush.setVapidDetails(
  "mailto:ominam@estudiante.uniajc.edu.co",
  "BEyTAdeeDZzxzcAhiRbYQ5dbkYZA8m7n78TPzizfhwSDrqr-1CUGY97WoGw8NdhdSOkE0Gol9fsCz0mz0o8kig8",
  "W7tnz7o_sHFlP27BTJ52ctlnZ_nf7JUL78zUK6zMDzs"
);

module.exports = webpush;