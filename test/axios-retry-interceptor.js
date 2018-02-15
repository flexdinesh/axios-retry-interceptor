/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import nock from 'nock';
import axiosRetryInterceptor from '../src/axios-retry-interceptor';

describe('Axios Interceptors', () => {
  describe('Retry Interceptor', () => {
    const BASE_URL = 'http://localhost:1313';
    const ENDPOINT = '/';
    let http;
    let options;

    beforeEach(() => {
      nock(BASE_URL)
        .persist()
        .get(ENDPOINT)
        .reply(408);

      http = axios.create({ baseURL: BASE_URL });

      options = {
        maxAttempts: 3
      };
    });

    it('should retry {maxAttempts} times in config', () => {
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

    it('should retry only for {statuses} in config', () => {
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
        statuses: [500]
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
  });

  afterEach(() => {
    nock.cleanAll();
  });
});
