const https = require('https');

function fetchAccount(customerId, callback) {
  https
    .get(`https://api.supporthub.internal/accounts/${customerId}`, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          callback(null, JSON.parse(body));
        } catch (err) {
          callback(err);
        }
      });
    })
    .on('error', callback);
}

function submitRefund(customerId, amount, callback) {
  const req = https.request(
    {
      hostname: 'api.supporthub.internal',
      path: `/accounts/${customerId}/refunds`,
      method: 'POST',
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          callback(null, JSON.parse(body));
        } catch (err) {
          callback(err);
        }
      });
    }
  );
  req.on('error', callback);
  req.end(JSON.stringify({ amount }));
}

module.exports = { fetchAccount, submitRefund };
