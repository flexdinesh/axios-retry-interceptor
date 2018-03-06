/* eslint-disable max-len */
import t from 'typy';

const DEFAULT_OPTIONS = {
  maxAttempts: 3,
  waitTime: 0,
  errorCodes: []
};

const ALLOWED_RETRY_METHODS = ['get', 'put', 'delete', 'head', 'options'];

const shouldRetry = (error) => {
  const { method: httpMethod, errorCodes } = error.config;
  const { maxAttempts, __retryCount: retryCount = 0 } = error.config;
  const { response: { status: statusCode } = {} } = error;

  let shouldRetryForMethod = false;
  let shouldRetryForStatus = false;

  if (ALLOWED_RETRY_METHODS.includes(httpMethod)) shouldRetryForMethod = true;

  if (
    (errorCodes.length === 0 && statusCode >= 500 && statusCode < 600) ||
    errorCodes.includes(statusCode)
  ) {
    shouldRetryForStatus = true;
  }

  if (shouldRetryForMethod && shouldRetryForStatus && retryCount < maxAttempts) {
    return true;
  }

  return false;
};

const axiosRetryInterceptor = (axios, options = {}) => {
  const retryConfig = {
    maxAttempts: t(options.maxAttempts).isNumber
      ? options.maxAttempts
      : DEFAULT_OPTIONS.maxAttempts,
    waitTime: t(options.waitTime).isNumber ? options.waitTime : DEFAULT_OPTIONS.waitTime,
    errorCodes: t(options.errorCodes).isArray ? options.errorCodes : DEFAULT_OPTIONS.errorCodes
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
