import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
};

const BASE_URL = 'http://localhost';

export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'test@test.com',
      password: 'testpassword123',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const body = JSON.parse(loginRes.body);
  return { token: body.token };
}

export default function (data) {
  const headers = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  const listRes = http.get(`${BASE_URL}/applications/`, headers);
  check(listRes, {
    'list status is 200': (r) => r.status === 200,
  });

  const createRes = http.post(
    `${BASE_URL}/applications/`,
    JSON.stringify({
      company: 'Load Test GmbH',
      position: 'Backend Engineer',
      status: 'applied',
    }),
    headers
  );
  check(createRes, {
    'create status is 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  sleep(1);
}