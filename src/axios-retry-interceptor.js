/* eslint-disable max-len */
import t from 'typy';

const ALLOWED_RETRY_METHODS = ['get', 'put', 'delete', 'head', 'options'];

const shouldRetry = (error) => {
  const { method: httpMethod, statuses } = error.config;
  const { maxAttempts, __retryCount: retryCount = 0 } = error.config;
  const { response: { status: statusCode } = {} } = error;

  let shouldRetryForMethod = false;
  let shouldRetryForStatus = false;

  if (ALLOWED_RETRY_METHODS.includes(httpMethod)) shouldRetryForMethod = true;

  if (
    (statuses.length === 0 && statusCode >= 500 && statusCode < 600) ||
    statuses.includes(statusCode)
  ) {
    shouldRetryForStatus = true;
  }

  if (
    shouldRetryForMethod && shouldRetryForStatus &&
    retryCount < maxAttempts
  ) {
    return true;
  }

  return false;
};

const axiosRetryInterceptor = (axios, options = {}) => {
  const defaultOptions = {
    maxAttempts: 3,
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
      const { __retryCount: retryCount = 0 } = error.config;
      error.config.__retryCount = retryCount + 1;
      error.config.__isRetryRequest = true;
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
