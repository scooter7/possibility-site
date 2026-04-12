/**
 * Settings Widget - auto-injecting gear icon with dropdown
 * Include via <script src="/settings-widget.js" defer></script> on any page
 */
(function() {
  'use strict';

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .sw-trigger {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.15);
      background: rgba(12,14,20,0.55);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 2px 12px rgba(0,0,0,0.25), inset 0 0 0 0.5px rgba(255,255,255,0.05);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease, transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .sw-trigger:hover { background: rgba(12,14,20,0.7); border-color: rgba(255,255,255,0.25); box-shadow: 0 4px 16px rgba(0,0,0,0.35); }
    .sw-trigger:active { transform: scale(0.92); }
    .sw-trigger svg { opacity: 0.85; transition: opacity 0.2s ease; }
    .sw-trigger:hover svg { opacity: 1; }

    .sw-dropdown {
      position: fixed;
      top: 68px;
      right: 20px;
      z-index: 10001;
      width: 280px;
      background: #0C0E14;
      border: 0.5px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      display: none;
      animation: swSlideDown 0.2s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .sw-dropdown.sw-open { display: block; }

    @keyframes swSlideDown {
      from { opacity: 0; transform: translateY(-8px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .sw-user {
      padding: 14px 14px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 4px;
    }
    .sw-user-email {
      font-size: 13px;
      color: rgba(255,252,250,0.7);
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sw-user-label {
      font-size: 10px;
      color: rgba(255,252,250,0.25);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .sw-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      background: none;
      border-radius: 10px;
      color: rgba(255,252,250,0.7);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
    }
    .sw-item:hover { background: rgba(255,255,255,0.05); color: rgba(255,252,250,0.92); }
    .sw-item svg { flex-shrink: 0; opacity: 0.4; }
    .sw-item:hover svg { opacity: 0.7; }

    .sw-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
      margin: 4px 8px;
    }

    .sw-item.sw-danger { color: #E8758A; }
    .sw-item.sw-danger svg { color: #E8758A; }

    /* Modal overlay */
    .sw-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 10002;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .sw-modal-overlay.sw-open { display: flex; }

    .sw-modal {
      width: 100%;
      max-width: 380px;
      background: #0C0E14;
      border: 0.5px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 32px 28px 28px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      animation: swSlideDown 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    .sw-modal h3 {
      font-size: 18px;
      font-weight: 600;
      color: rgba(255,252,250,0.92);
      letter-spacing: -0.3px;
      margin-bottom: 4px;
    }
    .sw-modal p {
      font-size: 13px;
      color: rgba(255,252,250,0.35);
      margin-bottom: 24px;
    }

    .sw-modal-field {
      margin-bottom: 16px;
    }
    .sw-modal-field label {
      display: block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: rgba(255,252,250,0.28);
      margin-bottom: 8px;
    }
    .sw-modal-field input {
      width: 100%;
      padding: 13px 16px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      color: rgba(255,252,250,0.92);
      font-size: 14px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .sw-modal-field input:focus {
      border-color: rgba(46,158,158,0.5);
      box-shadow: 0 0 0 3px rgba(46,158,158,0.08);
    }
    .sw-modal-field input::placeholder { color: rgba(255,252,250,0.18); }

    .sw-modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .sw-modal-actions button {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.1s ease;
    }
    .sw-btn-cancel {
      background: rgba(255,255,255,0.05);
      color: rgba(255,252,250,0.6);
    }
    .sw-btn-cancel:hover { background: rgba(255,255,255,0.08); }
    .sw-btn-confirm {
      background: #2E9E9E;
      color: #fff;
    }
    .sw-btn-confirm:hover { background: #33A3A3; }
    .sw-btn-confirm:active { transform: scale(0.97); }
    .sw-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

    .sw-modal-msg {
      margin-top: 12px;
      font-size: 12px;
      text-align: center;
      display: none;
    }
    .sw-modal-msg.sw-error { display: block; color: #E8758A; }
    .sw-modal-msg.sw-success { display: block; color: #34D399; }

    /* Backdrop click closes dropdown */
    .sw-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
    }
    .sw-backdrop.sw-open { display: block; }

    @media (max-width: 480px) {
      .sw-trigger { top: 14px; right: 14px; width: 36px; height: 36px; }
      .sw-dropdown { top: 58px; right: 14px; width: 260px; }
    }
  `;
  document.head.appendChild(style);

  // Build HTML
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="sw-backdrop" id="sw-backdrop"></div>
    <button class="sw-trigger" id="sw-trigger" aria-label="Settings">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="rgba(255,252,250,0.9)">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
    <div class="sw-dropdown" id="sw-dropdown">
      <div class="sw-user">
        <div class="sw-user-label">Signed in as</div>
        <div class="sw-user-email" id="sw-email">loading...</div>
      </div>
      <button class="sw-item" id="sw-change-pw">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Change password
      </button>
      <button class="sw-item" id="sw-change-email">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Change email
      </button>
      <div class="sw-divider"></div>
      <button class="sw-item sw-danger" id="sw-logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign out
      </button>
    </div>

    <div class="sw-modal-overlay" id="sw-modal">
      <div class="sw-modal">
        <h3 id="sw-modal-title"></h3>
        <p id="sw-modal-desc"></p>
        <form id="sw-modal-form">
          <div id="sw-modal-fields"></div>
          <div class="sw-modal-actions">
            <button type="button" class="sw-btn-cancel" id="sw-modal-cancel">Cancel</button>
            <button type="submit" class="sw-btn-confirm" id="sw-modal-submit">Save</button>
          </div>
        </form>
        <div class="sw-modal-msg" id="sw-modal-msg"></div>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  // Elements
  const trigger = document.getElementById('sw-trigger');
  const dropdown = document.getElementById('sw-dropdown');
  const backdrop = document.getElementById('sw-backdrop');
  const emailEl = document.getElementById('sw-email');
  const modal = document.getElementById('sw-modal');
  const modalTitle = document.getElementById('sw-modal-title');
  const modalDesc = document.getElementById('sw-modal-desc');
  const modalFields = document.getElementById('sw-modal-fields');
  const modalForm = document.getElementById('sw-modal-form');
  const modalMsg = document.getElementById('sw-modal-msg');
  const modalSubmit = document.getElementById('sw-modal-submit');
  const modalCancel = document.getElementById('sw-modal-cancel');

  let currentAction = null;

  // Toggle dropdown
  function openDropdown() {
    dropdown.classList.add('sw-open');
    backdrop.classList.add('sw-open');
  }
  function closeDropdown() {
    dropdown.classList.remove('sw-open');
    backdrop.classList.remove('sw-open');
  }

  trigger.addEventListener('click', () => {
    dropdown.classList.contains('sw-open') ? closeDropdown() : openDropdown();
  });
  backdrop.addEventListener('click', closeDropdown);

  // Fetch current user email
  fetch('/api/auth/me').then(r => r.json()).then(d => {
    if (d.email) emailEl.textContent = d.email;
    else emailEl.textContent = 'Unknown';
  }).catch(() => { emailEl.textContent = 'Unknown'; });

  // Logout
  document.getElementById('sw-logout').addEventListener('click', () => {
    window.location.href = '/api/auth/logout';
  });

  // Modal helpers
  function openModal(title, desc, fields, action) {
    currentAction = action;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalMsg.className = 'sw-modal-msg';
    modalMsg.textContent = '';
    modalSubmit.disabled = false;
    modalSubmit.textContent = 'Save';

    modalFields.innerHTML = fields.map(f => `
      <div class="sw-modal-field">
        <label for="sw-f-${f.id}">${f.label}</label>
        <input type="${f.type}" id="sw-f-${f.id}" placeholder="${f.placeholder}" required ${f.minlength ? 'minlength="'+f.minlength+'"' : ''}>
      </div>
    `).join('');

    closeDropdown();
    modal.classList.add('sw-open');
    setTimeout(() => {
      const first = modalFields.querySelector('input');
      if (first) first.focus();
    }, 100);
  }

  function closeModal() {
    modal.classList.remove('sw-open');
    currentAction = null;
  }

  modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Change Password
  document.getElementById('sw-change-pw').addEventListener('click', () => {
    openModal('Change password', 'Enter your new password below.', [
      { id: 'newpw', label: 'New Password', type: 'password', placeholder: 'At least 8 characters', minlength: 8 },
      { id: 'confirmpw', label: 'Confirm Password', type: 'password', placeholder: 'Confirm new password', minlength: 8 },
    ], 'password');
  });

  // Change Email
  document.getElementById('sw-change-email').addEventListener('click', () => {
    openModal('Change email', 'Enter your new email address below.', [
      { id: 'newemail', label: 'New Email', type: 'email', placeholder: 'you@example.com' },
    ], 'email');
  });

  // Form submit
  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalMsg.className = 'sw-modal-msg';
    modalSubmit.disabled = true;
    modalSubmit.textContent = 'Saving...';

    try {
      if (currentAction === 'password') {
        const newPw = document.getElementById('sw-f-newpw').value;
        const confirmPw = document.getElementById('sw-f-confirmpw').value;

        if (newPw !== confirmPw) {
          modalMsg.textContent = 'Passwords do not match.';
          modalMsg.className = 'sw-modal-msg sw-error';
          modalSubmit.disabled = false;
          modalSubmit.textContent = 'Save';
          return;
        }

        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: newPw }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update password');

        modalMsg.textContent = 'Password updated successfully.';
        modalMsg.className = 'sw-modal-msg sw-success';
        modalSubmit.textContent = 'Done';
        setTimeout(closeModal, 1500);

      } else if (currentAction === 'email') {
        const newEmail = document.getElementById('sw-f-newemail').value;

        const res = await fetch('/api/auth/change-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newEmail }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Failed to update email');

        emailEl.textContent = newEmail;
        modalMsg.textContent = 'Email updated successfully.';
        modalMsg.className = 'sw-modal-msg sw-success';
        modalSubmit.textContent = 'Done';
        setTimeout(closeModal, 1500);
      }
    } catch (err) {
      modalMsg.textContent = err.message;
      modalMsg.className = 'sw-modal-msg sw-error';
      modalSubmit.disabled = false;
      modalSubmit.textContent = 'Save';
    }
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal.classList.contains('sw-open')) closeModal();
      else closeDropdown();
    }
  });
})();
