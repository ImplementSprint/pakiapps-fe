import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '1s',
};

export default function () {
  http.get('http://127.0.0.1:4173');
  sleep(1);
}
