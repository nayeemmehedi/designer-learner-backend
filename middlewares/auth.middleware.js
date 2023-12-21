const request = require('request')
const jwkToPem = require('jwk-to-pem')
const jwt = require('jsonwebtoken')

const CONFIG = require('../config/config')

module.exports = (options) => {
  return async (req, res, next) => {
    try {
      const token = req.header("Authorization").replace("Bearer ", "")
      let decodedPayload
      request(
        {
          url: `https://cognito-idp.${CONFIG.AWS_COGNITO_REGION}.amazonaws.com/${CONFIG.AWS_COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
          json: true
        }, 
        (error, response, body) => {
          if (!error && response.statusCode === 200) {
            var pems = {};
            var keys = body['keys'];
            for(var i = 0; i < keys.length; i++) {
              var key_id = keys[i].kid;
              var modulus = keys[i].n;
              var exponent = keys[i].e;
              var key_type = keys[i].kty;
              var jwk = { kty: key_type, n: modulus, e: exponent}
              var pem = jwkToPem(jwk);
              pems[key_id] = pem;
            }
            var decodedJwt = jwt.decode(token, {complete: true})
            if (!decodedJwt) {
              return res.status(401).send({ error: "Access denied" })
            }
    
            var kid = decodedJwt.header.kid;
            var pem = pems[kid];
            if (!pem) {
              return res.status(401).send({error: 'Access denied'})
            }
    
            jwt.verify(token, pem, (err, payload) => {
              if(err) {
                return res.status(401).send({error: 'Access denied'})
              } else {
                req.uid = payload['sub']
                if(payload['cognito:groups']) {
                  req.role = payload['cognito:groups'][0]
                }
                if (!options) {
                  return next()
                }
                var allow = options.hasRole.some((elem) => elem == payload['cognito:groups'][0])
                if (!allow) {
                  return res.status(401).send({ error: "Invalid role" })
                }
                next()
              }
            })
          } else {
            return res.status(401).send({ error: "Access denied" })
          }
      })
    } catch (e) {
      console.log(e)
      res.status(401).send({ error: "Access denied" })
    }
  }
}