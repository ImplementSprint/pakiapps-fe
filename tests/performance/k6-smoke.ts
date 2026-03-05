import http from 'k6/http';
import { check, sleep } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
const systemName = __ENV.SYSTEM_NAME || 'generic-web';
const paths = (__ENV.SMOKE_PATHS || '/')
  .split(',')
  .map((path: string) => path.trim())
  .filter(Boolean);
const expectedStatus = Number(__ENV.EXPECTED_STATUS || 200);
const maxDurationMs = Number(__ENV.MAX_DURATION_MS || 1000);
const expectedText = __ENV.EXPECTED_TEXT;

type SmokeResponse = {
  status: number;
  timings: {
    duration: number;
  };
  body?: string;
};

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
    checks: ['rate>0.99'],
  },
  scenarios: {
    smoke_endpoints: {
      executor: 'constant-vus',
      vus: Number(__ENV.K6_VUS || 1),
      duration: __ENV.K6_DURATION || '30s',
      tags: {
        scenario: 'smoke_endpoints',
        system: systemName,
      },
    },
  },
};

function smoke() {
  for (const path of paths) {
    const response = http.get(`${baseUrl}${path}`, {
      tags: {
        endpoint: path,
        system: systemName,
      },
    });

    const checks = {
      [`${path} status is ${expectedStatus}`]: (result: SmokeResponse) => result.status === expectedStatus,
      [`${path} response time < ${maxDurationMs}ms`]:
        (result: SmokeResponse) => result.timings.duration < maxDurationMs,
    };

    if (expectedText?.length) {
      checks[`${path} contains expected text`] = (result: SmokeResponse) =>
        result.body?.includes(expectedText) ?? false;
    }

    check(response, checks);
  }

  sleep(1);
}

export default smoke;