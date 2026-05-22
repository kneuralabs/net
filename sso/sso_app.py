import os
import io
import base64
import bcrypt
import openpyxl
import requests
from urllib.parse import urlparse
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from itsdangerous import URLSafeTimedSerializer
from flask import Flask, render_template, request, redirect, flash

app = Flask(__name__)
app.secret_key = os.environ.get('SSO_APP_SECRET', 'kneura-sso-app-secret-change-in-prod')

SSO_SHARED_SECRET = os.environ.get('SSO_SHARED_SECRET', 'kneura-sso-shared-secret-change-in-prod')
EXCEL_PASSWORD = os.environ.get('EXCEL_PASSWORD', 'KneuraExcel@2026')
EMPLOYEE_DATA_URL = 'https://raw.githubusercontent.com/kneuralabs/ID/main/EmployeeData.xlsx'
DEFAULT_PASSWORD = 'Kneuralabs@2026'

# DATA.xlsx is shared with the intranet; configure the path via env var
DATA_FILE = os.environ.get(
    'DATA_FILE',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'DATA.xlsx')
)

# Only redirect back to these hosts (comma-separated)
_ALLOWED_HOSTS = set(
    h.strip() for h in
    os.environ.get('ALLOWED_CALLBACK_HOSTS', 'intranet.kneuralabs.com').split(',')
    if h.strip()
)

# Hosts allowed for direct (no-token) post-login redirects
_ALLOWED_REDIRECT_HOSTS = set(
    h.strip() for h in
    os.environ.get('ALLOWED_REDIRECT_HOSTS', 'kneuralabs.github.io').split(',')
    if h.strip()
)


def _is_valid_redirect(url):
    """Allow HTTPS redirects to whitelisted widget hosts."""
    try:
        p = urlparse(url)
        return p.scheme == 'https' and p.netloc in _ALLOWED_REDIRECT_HOSTS
    except Exception:
        return False

_SALT = b'kneura_labs_2026'


def _fernet():
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=_SALT, iterations=390000)
    return Fernet(base64.urlsafe_b64encode(kdf.derive(EXCEL_PASSWORD.encode())))


def _load_wb():
    if not os.path.exists(DATA_FILE) or os.path.getsize(DATA_FILE) == 0:
        return None
    try:
        with open(DATA_FILE, 'rb') as f:
            raw = f.read()
        decrypted = _fernet().decrypt(raw)
        return openpyxl.load_workbook(io.BytesIO(decrypted))
    except Exception:
        return None


def _get_user(employee_id):
    wb = _load_wb()
    if wb is None:
        return None
    for row in wb.active.iter_rows(min_row=2, values_only=True):
        if row[0] is not None and str(row[0]).strip() == str(employee_id).strip():
            return {'id': row[0], 'password_hash': row[1], 'status': row[2]}
    return None


def _check_roster(employee_id):
    try:
        resp = requests.get(EMPLOYEE_DATA_URL, timeout=10)
        resp.raise_for_status()
        wb = openpyxl.load_workbook(io.BytesIO(resp.content))
        revoke_kw = {'revok', 'inactive', 'terminat', 'disabled', 'suspended'}
        for row in wb.active.iter_rows(min_row=2, values_only=True):
            if not row or row[0] is None:
                continue
            if str(row[0]).strip() == str(employee_id).strip():
                for cell in row[1:]:
                    if cell and any(k in str(cell).lower() for k in revoke_kw):
                        return 'revoked'
                return 'found'
        return 'not_found'
    except Exception:
        return 'error'


def _is_valid_callback(url):
    """Only allow HTTPS callbacks to whitelisted intranet hosts."""
    try:
        p = urlparse(url)
        return p.scheme == 'https' and p.netloc in _ALLOWED_HOSTS
    except Exception:
        return False


def _make_token(employee_id):
    s = URLSafeTimedSerializer(SSO_SHARED_SECRET)
    return s.dumps({'employee_id': str(employee_id)}, salt='sso-callback')


@app.route('/')
def index():
    callback = request.args.get('callback', '')
    redirect_url = request.args.get('redirect', '')
    if redirect_url:
        return redirect(f'/login?redirect={redirect_url}')
    return redirect(f'/login?callback={callback}' if callback else '/login')


@app.route('/login', methods=['GET', 'POST'])
def login():
    callback = request.args.get('callback', '').strip()
    redirect_url = request.args.get('redirect', '').strip()

    if request.method == 'POST':
        employee_id = request.form.get('employee_id', '').strip()
        password = request.form.get('password', '').strip()
        callback = request.form.get('callback', '').strip()
        redirect_url = request.form.get('redirect_url', '').strip()

        if not employee_id or not password:
            flash('Please enter both Employee ID and password.', 'error')
            return render_template('login.html', callback=callback)

        authenticated = False
        user = _get_user(employee_id)

        if user:
            if bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
                authenticated = True
        else:
            # First-time user — check against external employee roster
            status = _check_roster(employee_id)
            if status == 'revoked':
                flash('Your account has been deactivated. Contact IT.', 'error')
                return render_template('login.html', callback=callback)
            if status == 'not_found':
                flash('Employee ID not found.', 'error')
                return render_template('login.html', callback=callback)
            if status == 'error':
                flash('Unable to verify employee. Please try again later.', 'error')
                return render_template('login.html', callback=callback)
            # status == 'found': accept the default password only
            if password == DEFAULT_PASSWORD:
                authenticated = True

        if not authenticated:
            flash('Invalid credentials.', 'error')
            return render_template('login.html', callback=callback)

        if redirect_url and _is_valid_redirect(redirect_url):
            return render_template('sso_success.html', redirect_url=redirect_url)

        if callback and _is_valid_callback(callback):
            token = _make_token(employee_id)
            sep = '&' if '?' in callback else '?'
            return redirect(f'{callback}{sep}token={token}')

        # No valid callback — show confirmation in place
        flash('Sign-in successful. Return to the intranet.', 'success')
        return render_template('login.html', callback=callback, redirect_url='')

    return render_template('login.html', callback=callback, redirect_url=redirect_url)


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5001)
