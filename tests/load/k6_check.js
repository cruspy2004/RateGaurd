import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 200,
    duration: '10s',
};

export default function () {
    const payload = JSON.stringify({
        key: 'k6-test-user',
        rule: 'free-tier'
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post('http://localhost/check', payload, params);
    check(res, {
        'is status 200': (r) => r.status === 200,
    });
}
