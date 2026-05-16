from flask import Flask, request, jsonify
from flask_cors import CORS
import pyautogui
import re
import pyperclip
import time
import sys
import threading

app = Flask(__name__)
CORS(app, origins="*")

pyautogui.FAILSAFE = True

# ─────────────────────────────────────────────
# DPI SCALE
# ─────────────────────────────────────────────

if sys.platform == 'win32':
    import ctypes
    scale_factor = ctypes.windll.user32.GetDpiForSystem() / 96
else:
    scale_factor = 1.0

# ─────────────────────────────────────────────
# PLAYWRIGHT
# ─────────────────────────────────────────────

_pw_page = None
_pw_ready = False
_pw_browser = None
_pw_lock = threading.Lock()


def start_playwright():

    global _pw_page
    global _pw_ready
    global _pw_browser

    try:

        from playwright.sync_api import sync_playwright

        pw = sync_playwright().start()

        browser = pw.chromium.connect_over_cdp(
            "http://127.0.0.1:9222"
        )

        _pw_browser = browser

        if browser.contexts:

            context = browser.contexts[0]

            pages = [
    p for p in context.pages
    if (
        p.url
        and not p.url.startswith("devtools://")
        and "127.0.0.1:9999" not in p.url
    )
]

            if pages:

                _pw_page = pages[-1]
                _pw_ready = True

                print("🎭 Playwright connected!")

    except Exception as e:

        print(f"🎭 Playwright not available: {e}")


threading.Thread(
    target=start_playwright,
    daemon=True
).start()

# ─────────────────────────────────────────────
# REFRESH PAGE
# ─────────────────────────────────────────────


def refresh_page():

    global _pw_page

    try:

        if not _pw_ready or not _pw_page:
            return

        context = _pw_page.context

        pages = [
    p for p in context.pages
    if (
        p.url
        and not p.url.startswith("devtools://")
        and "127.0.0.1:9999" not in p.url
    )
]

        if pages:
            _pw_page = pages[-1]

    except Exception as e:

        print("refresh_page error:", e)

# ─────────────────────────────────────────────
# ACCESSIBILITY
# ─────────────────────────────────────────────


def flatten_accessibility(node, elements, depth=0):

    if not node:
        return

    name = node.get("name", "").strip()

    role = node.get("role", "")

    allowed_roles = [
        "button",
        "link",
        "textbox",
        "searchbox",
        "combobox",
        "checkbox",
        "menuitem",
        "option",
        "radio"
    ]

    blocked_names = [
        "tab",
        "extensions",
        "developer tools",
        "close",
        "minimize",
        "maximize",
        "address bar"
    ]

    if name and role in allowed_roles:

        low = name.lower()

        if not any(b in low for b in blocked_names):

            elements.append({
                "name": name,
                "role": role,
                "depth": depth
            })

    for child in node.get("children", []):

        flatten_accessibility(
            child,
            elements,
            depth + 1
        )

# ─────────────────────────────────────────────
# TYPE
# ─────────────────────────────────────────────


def smart_type(text):

    if not text:
        return

    try:

        clean = text.strip()

        pyperclip.copy(clean)

        time.sleep(0.2)

        if sys.platform == 'darwin':
            pyautogui.hotkey('command', 'a')
        else:
            pyautogui.hotkey('ctrl', 'a')

        time.sleep(0.1)

        pyautogui.press('backspace')

        time.sleep(0.1)

        if sys.platform == 'darwin':
            pyautogui.hotkey('command', 'v')
        else:
            pyautogui.hotkey('ctrl', 'v')

        time.sleep(0.2)

        pyautogui.press('enter')

        print(f"⌨️ Typed: '{clean}'")

    except Exception:

        pyautogui.typewrite(
            text.strip(),
            interval=0.05
        )

        pyautogui.press('enter')

# ─────────────────────────────────────────────
# COORDS
# ─────────────────────────────────────────────


def pct_to_px(x_pct, y_pct):

    sw, sh = pyautogui.size()

    x = int((x_pct / 100) * sw)
    y = int((y_pct / 100) * sh)

    return x, y

# ─────────────────────────────────────────────
# STATUS
# ─────────────────────────────────────────────


@app.route('/status')
def status():

    sw, sh = pyautogui.size()

    return jsonify({
        "status": "running",
        "playwright": _pw_ready,
        "screen": f"{sw}x{sh}",
        "scale": scale_factor
    })

# ─────────────────────────────────────────────
# CLICK
# ─────────────────────────────────────────────


@app.route('/click', methods=['POST', 'OPTIONS'])
def auto_click():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:

        data = request.json or {}

        x_pct = float(data.get('x_pct', 50))
        y_pct = float(data.get('y_pct', 50))

        typed = (data.get('typed', '') or '').strip()
        target = (data.get('target', '') or '').strip()

        # only block dangerous top edge
        if y_pct < 1:

            return jsonify({
                "status": "blocked",
                "reason": "unsafe top edge"
            })

        refresh_page()

        # ─────────────────────────────
        # SEMANTIC PLAYWRIGHT CLICK
        # ─────────────────────────────

        try:

            if target and _pw_page:

                print(f"🎯 Semantic target: {target}")

                strategies = [

                    lambda:
                    _pw_page.get_by_role(
                        "button",
                        name=re.compile(target, re.I)
                    ).first.click(timeout=1500),

                    lambda:
                    _pw_page.get_by_role(
                        "link",
                        name=re.compile(target, re.I)
                    ).first.click(timeout=1500),

                    lambda:
                    _pw_page.get_by_role(
                        "textbox",
                        name=re.compile(target, re.I)
                    ).first.click(timeout=1500),

                    lambda:
                    _pw_page.get_by_text(
    re.compile(target, re.I)
).first.click(timeout=1500),
                ]

                for strategy in strategies:

                    try:

                        strategy()

                        if typed:

                            time.sleep(0.3)
                            smart_type(typed)

                        return jsonify({
                            "status": "playwright_clicked",
                            "target": target
                        })

                    except:
                        pass

        except Exception as e:

            print("⚠️ Semantic click failed:", e)

        # ─────────────────────────────
        # FALLBACK SCREEN CLICK
        # ─────────────────────────────

        sw, sh = pyautogui.size()

        x, y = pct_to_px(x_pct, y_pct)

        x = max(1, min(x, sw - 2))
        y = max(1, min(y, sh - 2))

        print(f"🖱️ Click ({x_pct}%, {y_pct}%) → ({x},{y})")

        pyautogui.moveTo(
            x,
            y,
            duration=0.3
        )

        time.sleep(0.2)

        pyautogui.click()

        time.sleep(0.5)

        if typed:
            smart_type(typed)

        return jsonify({
            "status": "clicked",
            "x": x,
            "y": y
        })

    except Exception as e:

        import traceback
        traceback.print_exc()

        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500
# ─────────────────────────────────────────────
# TYPE
# ─────────────────────────────────────────────


@app.route('/type', methods=['POST', 'OPTIONS'])
def auto_type():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:

        data = request.json or {}

        text = (data.get('text', '') or '').strip()

        x_pct = data.get('x_pct')
        y_pct = data.get('y_pct')

        if x_pct is not None and y_pct is not None:

            x, y = pct_to_px(x_pct, y_pct)

            pyautogui.moveTo(
                x,
                y,
                duration=0.3
            )

            pyautogui.click()

            time.sleep(0.2)

        smart_type(text)

        return jsonify({
            "status": "typed"
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# ─────────────────────────────────────────────
# SCROLL
# ─────────────────────────────────────────────


@app.route('/scroll', methods=['POST', 'OPTIONS'])
def auto_scroll():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:

        data = request.json or {}

        direction = data.get('direction', 'down')

        amount = int(data.get('amount', 3))

        x_pct = float(data.get('x_pct', 50))
        y_pct = float(data.get('y_pct', 50))

        sw, sh = pyautogui.size()

        x = int((x_pct / 100) * sw)
        y = int((y_pct / 100) * sh)

        pyautogui.moveTo(
            x,
            y,
            duration=0.2
        )

        pyautogui.scroll(
            -amount if direction == 'down' else amount
        )

        print(f"⬇️ Scroll {direction}")

        return jsonify({
            "status": "scrolled"
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# ─────────────────────────────────────────────
# DOM
# ─────────────────────────────────────────────


@app.route('/dom', methods=['GET', 'POST', 'OPTIONS'])
def get_dom():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    if not _pw_ready or not _pw_page:

        return jsonify({
            "elements": [],
            "error": "Playwright not ready"
        })

    try:

        refresh_page()

        with _pw_lock:

            snapshot = _pw_page.accessibility.snapshot()

        elements = []

        flatten_accessibility(
            snapshot,
            elements
        )

        return jsonify({
            "elements": elements,
            "count": len(elements)
        })

    except Exception as e:

        return jsonify({
            "elements": [],
            "error": str(e)
        })

# ─────────────────────────────────────────────
# DOM CLICK
# ─────────────────────────────────────────────


@app.route('/dom_click', methods=['POST', 'OPTIONS'])
def dom_click():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    if not _pw_ready or not _pw_page:

        return jsonify({
            "status": "failed",
            "error": "Playwright not ready"
        })

    try:

        data = request.json or {}

        name = (data.get('name') or '').strip()

        if not name:

            return jsonify({
                "status": "failed"
            })

        refresh_page()

        page = _pw_page

        for role in [
            "button",
            "link",
            "menuitem",
            "checkbox",
            "option",
            "combobox",
            "searchbox"
        ]:

            try:

                el = page.get_by_role(
                    role,
                    name=name
                )

                if el.count() > 0:

                    el.first.click(timeout=3000)

                    return jsonify({
                        "status": "clicked",
                        "method": f"dom_{role}",
                        "name": name
                    })

            except Exception:
                pass

        try:

            el = page.get_by_text(
                name,
                exact=False
            )

            if el.count() > 0:

                el.first.click(timeout=3000)

                return jsonify({
                    "status": "clicked",
                    "method": "dom_text",
                    "name": name
                })

        except Exception:
            pass

        return jsonify({
            "status": "failed",
            "name": name
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "error": str(e)
        })

# ─────────────────────────────────────────────
# DOM TYPE
# ─────────────────────────────────────────────


@app.route('/dom_type', methods=['POST', 'OPTIONS'])
def dom_type():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    if not _pw_ready or not _pw_page:

        return jsonify({
            "status": "failed"
        })

    try:

        data = request.json or {}

        name = (data.get('name') or '').strip()

        text = (data.get('text') or '').strip()

        if not text:

            return jsonify({
                "status": "failed"
            })

        refresh_page()

        page = _pw_page

        strategies = [
            lambda: page.get_by_role(
                "textbox",
                name=name
            ).first.fill(text),

            lambda: page.get_by_role(
                "searchbox",
                name=name
            ).first.fill(text),

            lambda: page.get_by_placeholder(
                name
            ).first.fill(text),
        ]

        for strategy in strategies:

            try:

                strategy()

                return jsonify({
                    "status": "typed",
                    "method": "dom"
                })

            except Exception:
                pass

        return jsonify({
            "status": "failed"
        })

    except Exception as e:

        return jsonify({
            "status": "error",
            "error": str(e)
        })

# ─────────────────────────────────────────────
# URL
# ─────────────────────────────────────────────


@app.route('/dom_url')
def dom_url():

    if not _pw_ready or not _pw_page:

        return jsonify({
            "url": ""
        })

    try:

        refresh_page()

        return jsonify({
            "url": _pw_page.url
        })

    except Exception:

        return jsonify({
            "url": ""
        })

# ─────────────────────────────────────────────
# WAIT
# ─────────────────────────────────────────────


@app.route('/dom_wait', methods=['POST', 'OPTIONS'])
def dom_wait():

    if request.method == 'OPTIONS':
        return jsonify({}), 200

    if not _pw_ready or not _pw_page:

        return jsonify({
            "status": "timeout"
        })

    try:

        refresh_page()

        timeout = min(
            int((request.json or {}).get("timeout", 5000)),
            10000
        )

        with _pw_lock:

            _pw_page.wait_for_load_state(
                "networkidle",
                timeout=timeout
            )

        return jsonify({
            "status": "stable",
            "url": _pw_page.url
        })

    except Exception as e:

        return jsonify({
            "status": "timeout",
            "error": str(e)
        })

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == '__main__':

    sw, sh = pyautogui.size()

    print("🤖 Vaiga Agent Ready!")
    print(f"🖥️ Screen: {sw}x{sh} Scale: {scale_factor}")
    print("🌐 https://127.0.0.1:9999")
    print()

    print("Windows Chrome debug launch:")
    print(
        '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" '
        '--remote-debugging-port=9222 '
        '--new-window https://www.google.com'
    )

    app.run(
        host='0.0.0.0',
        port=9999,
        threaded=True,
        ssl_context='adhoc'
    )
