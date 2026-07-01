"""Tests for the intranet change-password validation rules.

These exercise the pure-validation branches that reject a password before the
user store is ever read, so they need no DATA.xlsx: a rejected change re-renders
the form (HTTP 200) instead of redirecting to the dashboard (HTTP 302).
"""

import pytest

import app as intranet


@pytest.fixture
def client():
    intranet.app.config.update(TESTING=True)
    with intranet.app.test_client() as c:
        with c.session_transaction() as sess:
            sess['employee_id'] = 'E123'
            sess['first_login'] = True
        yield c


def _post(client, current, new, confirm):
    return client.post('/change-password', data={
        'current_password': current,
        'new_password': new,
        'confirm_password': confirm,
    })


@pytest.mark.parametrize('current,new,confirm', [
    ('',        'Abcd1234', 'Abcd1234'),   # missing current
    ('old',     '',         'Abcd1234'),   # missing new
    ('old',     'Abcd1234', 'Zzzz9999'),   # mismatch
    ('old',     'Ab1',      'Ab1'),        # too short
    ('old',     'abcdefgh', 'abcdefgh'),   # no digit
    ('old',     '12345678', '12345678'),   # no letter
])
def test_invalid_password_is_rejected(client, current, new, confirm):
    resp = _post(client, current, new, confirm)
    # Rejected inputs re-render the form (200); they never redirect (302).
    assert resp.status_code == 200


def test_requires_authentication():
    """Without a session the route redirects to the SSO login, not the form."""
    intranet.app.config.update(TESTING=True)
    with intranet.app.test_client() as c:
        resp = c.get('/change-password')
    assert resp.status_code == 302
    assert 'sso' in resp.headers.get('Location', '').lower()
