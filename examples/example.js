/* eslint-disable no-console */
const axios = require('axios');
const axiosRetryInterceptor = require('axios-retry-interceptor');

const http = axios.create({
  // options
});

axiosRetryInterceptor(http, {
  maxAttempts: 3,
  waitTime: 1000, // in milliseconds
  statuses: [408, 522] // [] for all errors
});

// all failed http calls will now be retried 3 times
// with a wait time of 1 second between each try
