/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import axios from 'axios';
import nock from 'nock';
import retryInterceptor from '../src/axios-retry-interceptor';

describe('Axios Interceptors', () => {
  describe('Retry Interceptor', () => {
    const BASE_URL = 'http://localhost:1313';
    const ENDPOINT = '/';
    let http;
    let options;

    beforeEach(() => {
      nock(BASE_URL)
        .get(ENDPOINT)
        .reply(401);

      http = axios.create({ baseURL: BASE_URL });

      options = {
        maxAttempts: 3
      };
    });

    it('should retry {maxAttempts} times in config', () => {
      retryInterceptor(http, options);

      http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          // do nothing
        })
        .catch((err) => {
          expect(err.config.__isRetryRequest).to.be.true;
          expect(err.config.__retryCount).to.be.equal((3 + 1));
        });
    });

    it('should wait {waitTime} between each retry', () => {
      const start = new Date().getTime();
      options = {
        maxAttempts: 3,
        waitTime: 1000
      };
      retryInterceptor(http, options);

      http.get(ENDPOINT)
        .then((res) => { // eslint-disable-line no-unused-vars
          // do nothing
        })
        .catch((err) => {
          const end = new Date().getTime();
          const timeTaken = end - start;
          expect(timeTaken).to.be.above(3000);
          expect(timeTaken).to.be.below(3500);
          expect(err.config.waitTime).to.be.equal(1000);
        });
    });
  });
});
