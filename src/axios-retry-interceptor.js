/* eslint-disable max-len */
import t from 'typy';

const shouldRetry = (error) => {
  const retryCount = error.config.__retryCount || 0; // eslint-disable-line prefer-destructuring
  const { maxAttempts } = error.config;

  let shouldRetryForStatus = false;
  if (
    error.config.statuses.length === 0 ||
    error.config.statuses.includes(t(error, 'response.status').safeObject)
  ) {
    shouldRetryForStatus = true;
  }

  if (retryCount < maxAttempts && shouldRetryForStatus) {
    error.config.__isRetryRequest = true;
    error.config.__retryCount = retryCount + 1;
    return true;
  }
  return false;
};

const axiosRetryInterceptor = (axios, options) => {
  const defaultOptions = {
    maxAttempts: 0,
    waitTime: 0,
    statuses: []
  };

  const retryConfig = {
    maxAttempts: t(options.maxAttempts).isNumber ? options.maxAttempts : defaultOptions.maxAttempts,
    waitTime: t(options.waitTime).isNumber ? options.waitTime : defaultOptions.waitTime,
    statuses: t(options.statuses).isArray ? options.statuses : defaultOptions.statuses
  };

  axios.interceptors.request.use(
    config => Object.assign(config, retryConfig),
    error => Promise.reject(error)
  );

  axios.interceptors.response.use(null, (error) => {
    if (t(error.config).isDefined && shouldRetry(error)) {
      const waitTime = t(error.config.waitTime).isNumber ? error.config.waitTime : 0;
      if (waitTime > 0) {
        // eslint-disable-next-line no-unused-vars
        return new Promise((resolve, reject) => {
          setTimeout(() => resolve(axios(error.config)), waitTime);
        });
      }
      return axios(error.config);
    }
    return Promise.reject(error);
  });
};

export default axiosRetryInterceptor;
