"""Unit tests for the SSO open-redirect / callback allow-list guards.

``_host_allowed`` is the anti-open-redirect boundary: it must accept the apex
domain and its subdomains while rejecting look-alike hosts such as
``kneuralabs.com.evil.com`` and ``evilkneuralabs.com``.
"""

import pytest

import sso_app


REDIRECT_HOSTS = sso_app._parse_hosts(
    '*.kneuralabs.com,kneuralabs.com,kneuralabs.github.io'
)


@pytest.mark.parametrize('netloc,expected', [
    ('intranet.kneuralabs.com', True),      # subdomain
    ('app.kneuralabs.com', True),           # subdomain
    ('a.b.c.kneuralabs.com', True),         # deep subdomain
    ('kneuralabs.com', True),               # apex
    ('kneuralabs.github.io', True),         # exact legacy host
    ('user@app.kneuralabs.com:443', True),  # userinfo + port stripped
    ('KNEURALABS.COM', True),               # case-insensitive
    ('kneuralabs.com.evil.com', False),     # suffix look-alike
    ('evilkneuralabs.com', False),          # prefix look-alike
    ('notkneuralabs.github.io', False),     # look-alike of exact host
    ('evil.com', False),                    # unrelated
    ('', False),                            # empty
])
def test_host_allowed(netloc, expected):
    assert sso_app._host_allowed(netloc, REDIRECT_HOSTS) is expected


@pytest.mark.parametrize('url,expected', [
    ('https://app.kneuralabs.com/dashboard', True),
    ('https://kneuralabs.com/', True),
    ('http://app.kneuralabs.com/dashboard', False),   # http is rejected
    ('https://kneuralabs.com.evil.com/', False),
    ('https://evil.com/', False),
    ('javascript:alert(1)', False),
    ('', False),
])
def test_is_valid_redirect(url, expected):
    assert sso_app._is_valid_redirect(url) is expected


@pytest.mark.parametrize('url,expected', [
    ('https://intranet.kneuralabs.com/sso/callback', True),
    ('http://intranet.kneuralabs.com/sso/callback', False),  # http rejected
    ('https://intranet.kneuralabs.com.evil.com/x', False),
    ('https://evil.com/sso/callback', False),
])
def test_is_valid_callback(url, expected):
    assert sso_app._is_valid_callback(url) is expected
