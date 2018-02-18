/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import nock from 'nock';
import axiosRetryInterceptor from '../src/axios-retry-interceptor';

describe('Axios Retry Interceptor', () => {
  const BASE_URL = 'http://localhost:1313';
  const ENDPOINT = '/';
  let http;
  let options;

  beforeEach(() => {
    nock(BASE_URL)
      .persist()
      .get(ENDPOINT)
      .reply(500, {});

    http = axios.create({ baseURL: BASE_URL });
  });

  describe('Retry Checks', () => {
    options = {
      maxAttempts: 2
    };

    it('should retry http call when request fails', () => {
      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.be.true;
        });
    });

    it('should retry http call only for 5xx status', () => {
      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.be.true;
          expect(err.response.status).to.be.equal(500);
        });
    });

    it('should not retry http call if status is not 5xx', () => {
      nock.cleanAll();
      nock(BASE_URL)
        .persist()
        .get(ENDPOINT)
        .reply(401, {});

      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.equal(undefined);
          expect(err.response.status).to.be.equal(401);
        });
    });

    it('should not attempt retry checks for successful response', () => {
      nock.cleanAll();
      nock(BASE_URL)
        .persist()
        .get(ENDPOINT)
        .reply(200, {});

      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => {
          expect(res.status).to.be.equal(200);
        })
        .catch((err) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should not have been rejected');
        });
    });
  });

  describe('Config Checks', () => {
    it('should retry {maxAttempts} times in config', () => {
      axiosRetryInterceptor(http, {
        maxAttempts: 2
      });

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.be.true;
          expect(err.config.__retryCount).to.be.equal(2);
        });
    });

    it('should retry default-3 times when {maxAttempts} is not specified', () => {
      axiosRetryInterceptor(http, {});

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.be.true;
          expect(err.config.__retryCount).to.be.equal(3);
        });
    });

    it('should wait {waitTime} between each retry', () => {
      const start = new Date().getTime();
      options = {
        maxAttempts: 2,
        waitTime: 500
      };
      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__retryCount).to.be.equal(2);
          const end = new Date().getTime();
          const timeTaken = end - start;
          expect(timeTaken).to.be.above(options.maxAttempts * options.waitTime);
          expect(timeTaken).to.be.below((options.maxAttempts * options.waitTime) + 500);
          expect(err.config.waitTime).to.be.equal(500);
        });
    }).timeout(5000);

    it('should not wait between retries when {waitTime} is not specified', () => {
      const start = new Date().getTime();
      options = {
        maxAttempts: 2,
      };
      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__retryCount).to.be.equal(2);
          const end = new Date().getTime();
          const timeTaken = end - start;
          expect(timeTaken).to.be.below(200);
          expect(err.config.waitTime).to.be.equal(0);
        });
    });

    it('should retry only for {statuses} in config', () => {
      nock.cleanAll();
      nock(BASE_URL)
        .persist()
        .get(ENDPOINT)
        .reply(408, {});

      options = Object.assign(options, {
        maxAttempts: 3,
        statuses: [408]
      });

      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.be.true;
          expect(err.config.__retryCount).to.be.equal(3);
        });
    });

    it('should not retry for status not in {statuses} config', () => {
      options = Object.assign(options, {
        maxAttempts: 1, // TODO - test with more
        statuses: [505]
      });

      axiosRetryInterceptor(http, options);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.equal(undefined);
        });
    });

    it('should work with default config, when options are not passed', () => {
      axiosRetryInterceptor(http);

      return http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          throw new Error('promise should have been rejected');
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.be.true;
          expect(err.config.__retryCount).to.be.equal(3);
          expect(err.config.waitTime).to.be.equal(0);
        });
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
