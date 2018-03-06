# Axios Retry interceptor
[![Build Status](https://travis-ci.org/flexdinesh/axios-retry-interceptor.svg?branch=master)](https://travis-ci.org/flexdinesh/axios-retry-interceptor)
[![dependencies Status](https://david-dm.org/flexdinesh/axios-retry-interceptor/status.svg)](https://david-dm.org/flexdinesh/axios-retry-interceptor)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Configurable Axios Interceptor to retry failed http calls.

## Install

```
npm install --save axios-retry-interceptor
```

## Usage

Import
```js
import retryInterceptor from 'axios-retry-interceptor';
// or
const retryInterceptor = require('axios-retry-interceptor');
```

Set the interceptor for your axios instance. Voila! ✨
```js
retryInterceptor(axios, {
  maxAttempts: 3,
  waitTime: 1000
});

```

## API

### retryInterceptor(axiosInstance, options)

- axiosInstance - your axios instance
- options - config for retry interceptor

### Options

#### maxAttempts

Max number of times the interceptor should retry the failed http call.

_Type_: Number

_Default_: 3

_Example_: `maxAttempts: 5`

#### waitTime

Duration between each retry attempt in milliseconds(1s=1000ms).

_Type_: Number

_Default_: 0

_Example_: `waitTime: 3000`

#### statuses

Response statuses for which the interceptor should retry.

Ideally any implementation should retry only 5xx status(server errors) and should not retry 4xx status(client errors). The reason is, if a http call fails with a client error, then the retry call will have the same headers/params and will obviously fail. So **by default all 5xx errors will be retried**. If you want to customize the status for which the retries should be made, use this config.

_Type_: Array

_Default_: []

_Example_: `[500, 501, 401]`

## Author's note

Ideally only idempotent http methods (GET, PUT, DELETE, HEAD, OPTIONS) should be retried on failed http calls. Non-idempotent methods like POST should **NOT** be retried and that's why this library will not permit retry of non-idempotent methods.

## License

MIT © Dinesh Pandiyan
