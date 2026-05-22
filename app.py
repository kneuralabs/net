import os
import io
import base64
import subprocess
import bcrypt
import openpyxl
import requests
from datetime import datetime
from functools import wraps
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from flask import Flask, render_template, request, redirect, url_for, session, flash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'kneura-secret-change-in-prod-2026')

EXCEL_PASSWORD = os.environ.get('EXCEL_PASSWORD', 'KneuraExcel@2026')
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'DATA.xlsx')
EMPLOYEE_DATA_URL = 'https://raw.githubusercontent.com/kneuralabs/ID/main/EmployeeData.xlsx'
DEFAULT_PASSWORD = 'Kneuralabs@2026'

# SSO configuration
SSO_URL = os.environ.get('SSO_URL', 'https://sso.kneuralabs.com')
SSO_SHARED_SECRET = os.environ.get('SSO_SHARED_SECRET', 'kneura-sso-shared-secret-change-in-prod')
_SSO_TOKEN_MAX_AGE = 300  # seconds

_SALT = b'kneura_labs_2026'


def _fernet():
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_SALT,
        iterations=390000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(EXCEL_PASSWORD.encode()))
    return Fernet(key)


# ── Excel helpers ──────────────────────────────────────────────────────────────

def _load_wb():
    if not os.path.exists(DATA_FILE) or os.path.getsize(DATA_FILE) == 0:
        return _blank_wb()
    try:
        with open(DATA_FILE, 'rb') as f:
            raw = f.read()
        decrypted = _fernet().decrypt(raw)
        return openpyxl.load_workbook(io.BytesIO(decrypted))
    except Exception:
        return _blank_wb()


def _blank_wb():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = 'Users'
    ws.append(['EmployeeID', 'PasswordHash', 'Status', 'LastLogin', 'CreatedAt'])
    return wb


def _save_wb(wb):
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    encrypted = _fernet().encrypt(buf.read())
    with open(DATA_FILE, 'wb') as f:
        f.write(encrypted)
    _git_commit()


def _git_commit():
    try:
        base = os.path.dirname(DATA_FILE)
        subprocess.run(['git', 'add', 'DATA.xlsx'], cwd=base, capture_output=True, timeout=10)
        subprocess.run(
            ['git', 'commit', '-m', 'chore: update credentials store'],
            cwd=base, capture_output=True, timeout=10
        )
    except Exception:
        pass


# ── User operations ────────────────────────────────────────────────────────────

def get_user(employee_id):
    wb = _load_wb()
    ws = wb.active
    for row in ws.iter_rows(min_row=2, values_only=True):
        if row[0] is not None and str(row[0]).strip() == str(employee_id).strip():
            return {
                'id': row[0],
                'password_hash': row[1],
                'status': row[2],
                'last_login': row[3],
                'created_at': row[4],
            }
    return None


def upsert_user(employee_id, password_hash, status='active'):
    wb = _load_wb()
    ws = wb.active
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    for row in ws.iter_rows(min_row=2):
        if row[0].value is not None and str(row[0].value).strip() == str(employee_id).strip():
            row[1].value = password_hash
            row[2].value = status
            row[3].value = now
            _save_wb(wb)
            return
    ws.append([str(employee_id), password_hash, status, now, now])
    _save_wb(wb)


def update_last_login(employee_id):
    wb = _load_wb()
    ws = wb.active
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    for row in ws.iter_rows(min_row=2):
        if row[0].value is not None and str(row[0].value).strip() == str(employee_id).strip():
            row[3].value = now
            _save_wb(wb)
            return


# ── Employee validation ────────────────────────────────────────────────────────

def check_employee_roster(employee_id):
    """Returns 'found', 'revoked', or 'not_found'."""
    try:
        resp = requests.get(EMPLOYEE_DATA_URL, timeout=10)
        resp.raise_for_status()
        wb = openpyxl.load_workbook(io.BytesIO(resp.content))
        ws = wb.active
        revoke_keywords = {'revok', 'inactive', 'terminat', 'disabled', 'suspended'}
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not row or row[0] is None:
                continue
            if str(row[0]).strip() == str(employee_id).strip():
                for cell in row[1:]:
                    if cell and any(k in str(cell).lower() for k in revoke_keywords):
                        return 'revoked'
                return 'found'
        return 'not_found'
    except Exception:
        return 'error'


# ── SSO helpers ────────────────────────────────────────────────────────────────

def _sso_login_url():
    callback = url_for('sso_callback', _external=True)
    return f'{SSO_URL}/login?callback={callback}'


def _verify_sso_token(token):
    """Returns employee_id string or raises BadSignature/SignatureExpired."""
    s = URLSafeTimedSerializer(SSO_SHARED_SECRET)
    data = s.loads(token, salt='sso-callback', max_age=_SSO_TOKEN_MAX_AGE)
    return data['employee_id']


# ── Auth decorator ─────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'employee_id' not in session:
            return redirect(_sso_login_url())
        return f(*args, **kwargs)
    return decorated


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route('/', methods=['GET'])
def index():
    if 'employee_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(_sso_login_url())


@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'employee_id' in session:
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        employee_id = request.form.get('employee_id', '').strip()
        password = request.form.get('password', '').strip()

        if not employee_id or not password:
            flash('Please enter both Employee ID and password.', 'error')
            return render_template('login.html')

        user = get_user(employee_id)

        if user:
            # Existing user in DATA.xlsx
            if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
                flash('Invalid credentials.', 'error')
                return render_template('login.html')
            update_last_login(employee_id)
            session['employee_id'] = employee_id
            session['first_login'] = False
            return redirect(url_for('dashboard'))
        else:
            # First-time user — check employee roster
            roster_status = check_employee_roster(employee_id)

            if roster_status in ('not_found', 'revoked'):
                flash('Employee not found.', 'error')
                return render_template('login.html')
            elif roster_status == 'error':
                flash('Unable to verify employee. Please try again later.', 'error')
                return render_template('login.html')

            if password != DEFAULT_PASSWORD:
                flash('Invalid credentials.', 'error')
                return render_template('login.html')

            hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
            upsert_user(employee_id, hashed)
            update_last_login(employee_id)
            session['employee_id'] = employee_id
            session['first_login'] = True
            flash('Welcome! Please change your default password.', 'info')
            return redirect(url_for('change_password'))

    return render_template('login.html')


@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', employee_id=session['employee_id'])


@app.route('/change-password', methods=['GET', 'POST'])
@login_required
def change_password():
    employee_id = session['employee_id']
    first_login = session.get('first_login', False)

    if request.method == 'POST':
        current_pw = request.form.get('current_password', '').strip()
        new_pw = request.form.get('new_password', '').strip()
        confirm_pw = request.form.get('confirm_password', '').strip()

        if not current_pw or not new_pw or not confirm_pw:
            flash('All fields are required.', 'error')
            return render_template('change_password.html', first_login=first_login)

        if new_pw != confirm_pw:
            flash('New passwords do not match.', 'error')
            return render_template('change_password.html', first_login=first_login)

        if len(new_pw) < 8:
            flash('Password must be at least 8 characters.', 'error')
            return render_template('change_password.html', first_login=first_login)

        user = get_user(employee_id)
        if not user:
            flash('User not found.', 'error')
            return render_template('change_password.html', first_login=first_login)

        if not bcrypt.checkpw(current_pw.encode(), user['password_hash'].encode()):
            flash('Current password is incorrect.', 'error')
            return render_template('change_password.html', first_login=first_login)

        if new_pw == DEFAULT_PASSWORD:
            flash('You cannot reuse the default password.', 'error')
            return render_template('change_password.html', first_login=first_login)

        new_hash = bcrypt.hashpw(new_pw.encode(), bcrypt.gensalt()).decode()
        upsert_user(employee_id, new_hash)
        session['first_login'] = False
        flash('Password changed successfully.', 'success')
        return redirect(url_for('dashboard'))

    return render_template('change_password.html', first_login=first_login)


@app.route('/sso/callback')
def sso_callback():
    token = request.args.get('token', '')
    if not token:
        flash('SSO authentication failed. Please try again.', 'error')
        return redirect(_sso_login_url())

    try:
        employee_id = _verify_sso_token(token)
    except SignatureExpired:
        flash('SSO session expired. Please sign in again.', 'error')
        return redirect(_sso_login_url())
    except BadSignature:
        flash('Invalid SSO token. Please sign in again.', 'error')
        return redirect(_sso_login_url())

    session['employee_id'] = employee_id
    user = get_user(employee_id)

    if user is None:
        # First time through SSO — create local record with hashed default password
        hashed = bcrypt.hashpw(DEFAULT_PASSWORD.encode(), bcrypt.gensalt()).decode()
        upsert_user(employee_id, hashed)
        session['first_login'] = True
        flash('Welcome! Please change your default password.', 'info')
        return redirect(url_for('change_password'))

    session['first_login'] = False
    update_last_login(employee_id)
    return redirect(url_for('dashboard'))


@app.route('/logout')
def logout():
    session.clear()
    return redirect(_sso_login_url())


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)
