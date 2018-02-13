/* eslint-disable no-console */
const axios = require('axios');
const addRetryInterceptor = require('axios-retry-interceptor');

addRetryInterceptor(axios, {
  maxAttempts: 3,
  waitTime: 1000 // in milliseconds
});

// all failed http calls will now be retried 3 times
// with a wait time of 1 second between each try
