/* eslint-disable max-len */
import t from 'typy';

const retryInterceptor = (axios, options) => {
  const defaultOptions = {
    maxAttempts: 0,
    waitTime: 0
  };

  const retryConfig = {
    maxAttempts: t(options.maxAttempts).isDefined ? options.maxAttempts : defaultOptions.maxAttempts,
    waitTime: t(options.waitTime).isDefined ? options.waitTime : defaultOptions.waitTime
  };

  axios.interceptors.request.use(
    config => Object.assign(config, retryConfig),
    error => Promise.reject(error)
  );

  axios.interceptors.response.use(null, (error) => {
    if (t(error.config).isDefined) {
      const retryCount = error.config.__retryCount || 0; // eslint-disable-line prefer-destructuring
      const { maxAttempts } = error.config;
      const waitTime = t(error.config.waitTime).isDefined ? error.config.waitTime : 0;
      error.config.__isRetryRequest = true;
      error.config.__retryCount = retryCount + 1;
      if (retryCount < maxAttempts) {
        if (waitTime > 0) {
          // eslint-disable-next-line no-unused-vars
          return new Promise((resolve, reject) => {
            setTimeout(() => resolve(axios(error.config)), waitTime);
          });
        }
        return axios(error.config);
      }
    }
    return Promise.reject(error);
  });
};

export default retryInterceptor;
