(function () {
  const config = window.VoxConfig || {}
  const API_KEY = config.apiKey

  if (!API_KEY) {
    console.warn('[Voxtrend] apiKey manquante dans window.VoxConfig')
    return
  }

  const API_URL = 'https://voxtrend-chatbot-production.up.railway.app'

  let socket = null
  let conversationId = null
  let clientId = null
  let clientName = 'Support'
  let primaryColor = '#5e60ce'
  let textColor = '#ffffff'
  let widgetHeight = 600
  let widgetGreeting = 'Bonjour 👋'
  let widgetSubtitle = 'Une question ? Nous répondons en quelques minutes.'
  let widgetFaq = []
  let isOpen = false
  let pendingFile = null
  let currentPage = 'home'
  let previousPage = 'home'
  let fileDialogOpen = false

  let visitorId = localStorage.getItem('vox_visitor_id')
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    localStorage.setItem('vox_visitor_id', visitorId)
  }

  const fileInputGlobal = document.createElement('input')
  fileInputGlobal.type = 'file'
  fileInputGlobal.accept = 'image/*,.pdf,.doc,.docx,.txt'
  fileInputGlobal.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;'
  document.body.appendChild(fileInputGlobal)
  fileInputGlobal.addEventListener('change', handleFileSelect)

  function loadSocketIO(callback) {
    const script = document.createElement('script')
    script.src = `${API_URL}/socket.io/socket.io.js`
    script.onload = callback
    document.head.appendChild(script)
  }

  function injectStyles() {
    const style = document.createElement('style')
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

      .vox-btn-toggle {
        position: fixed; bottom: 24px; right: 24px;
        width: 52px; height: 52px; border-radius: 50%;
        background: ${primaryColor};
        border: none; cursor: pointer;
        box-shadow: 0 2px 12px rgba(17,36,62,0.25);
        display: flex; align-items: center; justify-content: center;
        z-index: 99999; transition: transform 0.15s, box-shadow 0.15s;
      }
      .vox-btn-toggle:hover { transform: scale(1.05); box-shadow: 0 4px 20px rgba(17,36,62,0.35); }
      .vox-btn-toggle svg { width: 22px; height: 22px; }

      .vox-shell {
        position: fixed; bottom: 88px; right: 24px;
        width: 350px; height: ${widgetHeight}px;
        background: #ffffff; border-radius: 16px;
        box-shadow: 0 8px 40px rgba(17,36,62,0.15), 0 0 0 1px rgba(0,0,0,0.06);
        display: flex; flex-direction: column;
        z-index: 99998; overflow: hidden;
        font-family: 'Inter', sans-serif;
        transition: opacity 0.2s, transform 0.2s;
      }
      .vox-shell.vox-hidden {
        opacity: 0; pointer-events: none; transform: translateY(10px);
      }

      /* Header minimaliste */
      .vox-header {
        padding: 16px 18px;
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
        background: #fff;
      }
      .vox-header-left { display: flex; align-items: center; gap: 10px; }
      .vox-header-dot-wrap { position: relative; }
      .vox-header-avatar {
        width: 34px; height: 34px; border-radius: 50%;
        background: ${primaryColor};
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 600; color: ${textColor};
      }
      .vox-header-online {
        position: absolute; bottom: 0; right: 0;
        width: 9px; height: 9px; border-radius: 50%;
        background: #22c55e; border: 2px solid white;
      }
      .vox-header-name { font-size: 14px; font-weight: 600; color: #111; }
      .vox-header-status { font-size: 11px; color: #888; margin-top: 1px; }
      .vox-header-close {
        width: 28px; height: 28px; border-radius: 50%;
        background: #f5f5f5; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: #888; transition: background 0.15s, color 0.15s;
      }
      .vox-header-close:hover { background: #eee; color: #333; }

      /* Pages */
      .vox-page { flex: 1; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; min-height: 0; }
      .vox-page.vox-hidden { display: none !important; }

      /* Home */
      .vox-home { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f0f1f4; }
      .vox-home-hero {
        background: ${primaryColor};
        padding: 22px 20px 68px;
        flex-shrink: 0;
        position: relative;
        overflow: hidden;
      }
      .vox-home-hero::before {
        content: '';
        position: absolute;
        width: 180px; height: 180px;
        background: rgba(255,255,255,0.07);
        border-radius: 50%;
        top: -55px; right: -40px;
        pointer-events: none;
      }
      .vox-home-hero::after {
        content: '';
        position: absolute;
        width: 100px; height: 100px;
        background: rgba(255,255,255,0.05);
        border-radius: 50%;
        bottom: 10px; right: 60px;
        pointer-events: none;
      }
      .vox-home-greeting { font-size: 24px; font-weight: 800; color: ${textColor}; letter-spacing: -0.5px; line-height: 1.25; position: relative; }
      .vox-home-sub { font-size: 13px; color: ${textColor}; opacity: 0.7; line-height: 1.6; margin-top: 8px; position: relative; }

      .vox-home-content { padding: 0 14px 24px; display: flex; flex-direction: column; gap: 10px; margin-top: -48px; position: relative; z-index: 1; }
      .vox-home-card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }

      .vox-home-start-btn {
        padding: 16px 16px;
        background: white; color: #111; border: none;
        display: flex; align-items: center; justify-content: space-between;
        font-family: 'Inter', sans-serif; transition: background 0.15s;
        width: 100%; text-align: left; cursor: pointer;
      }
      .vox-home-start-btn:hover { background: #fafafa; }
      .vox-home-start-btn-left { display: flex; align-items: center; gap: 13px; }
      .vox-home-start-icon {
        width: 40px; height: 40px; border-radius: 12px;
        background: ${primaryColor};
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .vox-home-start-title { font-size: 13px; font-weight: 600; color: #111; display: block; }
      .vox-home-start-hint { font-size: 11px; color: #bbb; display: block; margin-top: 2px; }

      .vox-section-label { font-size: 11px; font-weight: 700; color: #c0c0c0; letter-spacing: 0.07em; text-transform: uppercase; }
      .vox-faq-header-row { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; }

      .vox-faq { display: flex; flex-direction: column; }
      .vox-faq-item {
        padding: 13px 16px;
        display: flex; align-items: center; justify-content: space-between;
        cursor: pointer; border-top: 1px solid #f5f5f5;
        transition: background 0.12s; gap: 8px;
      }
      .vox-faq-item:hover { background: #fafafa; }
      .vox-faq-item:hover .vox-faq-item-text { color: ${primaryColor}; }
      .vox-faq-item-text { font-size: 13px; color: #333; font-weight: 500; line-height: 1.4; flex: 1; }
      .vox-faq-item-arrow { color: #ddd; flex-shrink: 0; }

      /* Conversations list */
      .vox-convs { padding: 16px 18px; display: flex; flex-direction: column; gap: 14px; }
      .vox-convs-top { display: flex; align-items: center; justify-content: space-between; }
      .vox-new-conv-btn {
        padding: 6px 12px; background: ${primaryColor};
        color: ${textColor}; border: none; border-radius: 7px;
        font-size: 12px; font-weight: 500; cursor: pointer;
        display: flex; align-items: center; gap: 5px;
        font-family: 'Inter', sans-serif; transition: opacity 0.15s;
      }
      .vox-new-conv-btn:hover { opacity: 0.85; }
      .vox-conv-list { display: flex; flex-direction: column; gap: 2px; }
      .vox-conv-item {
        padding: 12px 10px; border-radius: 10px;
        cursor: pointer; display: flex; align-items: center; gap: 12px;
        transition: background 0.1s;
      }
      .vox-conv-item:hover { background: #f7f7f7; }
      .vox-conv-item.active-conv { background: #f3f4f6; }
      .vox-conv-avatar {
        width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
        background: ${primaryColor};
        display: flex; align-items: center; justify-content: center;
        color: ${textColor}; font-size: 11px; font-weight: 600;
      }
      .vox-conv-content { flex: 1; min-width: 0; }
      .vox-conv-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
      .vox-conv-name { font-size: 13px; font-weight: 600; color: #111; }
      .vox-conv-time { font-size: 11px; color: #aaa; flex-shrink: 0; }
      .vox-conv-preview { font-size: 12px; color: #888; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
      .vox-conv-status { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
      .vox-conv-empty { text-align: center; padding: 40px 20px; }
      .vox-conv-empty-txt { font-size: 13px; color: #aaa; margin-bottom: 4px; font-weight: 500; }
      .vox-conv-empty-sub { font-size: 12px; color: #ccc; }
      .vox-conv-loading { text-align: center; padding: 30px; font-size: 12px; color: #aaa; }

      /* Chat */
      .vox-chat { flex: 1; display: flex; flex-direction: column; min-height: 0; }
      .vox-chat-topbar {
        padding: 10px 18px; background: white;
        border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
        display: flex; align-items: center; gap: 10px;
      }
      .vox-chat-back {
        background: none; border: none; cursor: pointer; padding: 4px;
        display: flex; align-items: center; color: #aaa; transition: color 0.1s;
      }
      .vox-chat-back:hover { color: #333; }
      .vox-chat-info { flex: 1; min-width: 0; }
      .vox-chat-name { font-size: 13px; font-weight: 600; color: #111; }
      .vox-chat-sub { font-size: 11px; color: #aaa; }

      .vox-messages {
        flex: 1; overflow-y: auto; padding: 16px 18px 10px;
        display: flex; flex-direction: column; gap: 6px; background: #fafafa;
      }
      .vox-msg {
        max-width: 78%; padding: 9px 13px; border-radius: 14px;
        font-size: 13px; line-height: 1.5; word-break: break-word;
      }
      .vox-msg.visitor {
        background: ${primaryColor}; color: ${textColor};
        align-self: flex-end; border-bottom-right-radius: 4px;
      }
      .vox-msg.agent {
        background: white; color: #111; align-self: flex-start;
        border-bottom-left-radius: 4px;
        border: 1px solid #ececec;
      }
      .vox-msg.system { background: transparent; color: #aaa; font-size: 11px; align-self: center; }
      .vox-msg img { max-width: 100%; max-height: 180px; border-radius: 8px; display: block; cursor: pointer; }
      .vox-file-link { display: flex; align-items: center; gap: 7px; text-decoration: none; font-weight: 500; font-size: 12px; }
      .vox-file-link.visitor { color: ${textColor}; opacity: 0.85; }
      .vox-file-link.agent { color: #333; }
      .vox-msg-stamp { text-align: center; font-size: 10px; color: #ccc; margin: 4px 0; align-self: center; }

      .vox-file-preview {
        margin: 0 18px 6px; display: flex; align-items: center; gap: 8px;
        background: #f5f5f5; border-radius: 8px; padding: 8px 12px;
        border: 1px solid #eee;
      }
      .vox-file-preview-name { flex: 1; font-size: 12px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .vox-file-preview-remove { background: none; border: none; cursor: pointer; color: #aaa; font-size: 14px; padding: 0; }

      .vox-input-area {
        padding: 10px 12px 12px; background: white;
        border-top: 1px solid #f0f0f0; flex-shrink: 0;
      }
      .vox-toolbar { display: flex; align-items: flex-end; gap: 6px; background: #f7f7f7; border-radius: 12px; padding: 4px 4px 4px 12px; border: 1px solid #ececec; }
      .vox-attach {
        width: 28px; height: 28px; border-radius: 7px;
        background: none; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        color: #bbb; flex-shrink: 0; transition: color 0.1s;
      }
      .vox-attach:hover { color: #555; }
      .vox-attach svg { width: 14px; height: 14px; }
      .vox-input {
        flex: 1; border: none; background: transparent;
        padding: 7px 0; font-size: 13px; outline: none;
        font-family: 'Inter', sans-serif;
        resize: none; line-height: 1.5; min-height: 34px; max-height: 90px; overflow-y: auto;
        color: #111;
      }
      .vox-input::placeholder { color: #bbb; }
      .vox-send {
        width: 32px; height: 32px; border-radius: 9px;
        background: ${primaryColor}; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; transition: opacity 0.15s; margin: 2px;
      }
      .vox-send:disabled { opacity: 0.3; cursor: default; }
      .vox-send svg { width: 14px; height: 14px; fill: ${textColor}; }

      /* Nav */
      .vox-nav {
        background: white; border-top: 1px solid #f0f0f0;
        display: flex; align-items: center; padding: 6px 0 8px; flex-shrink: 0;
      }
      .vox-nav-btn {
        display: flex; flex-direction: column; align-items: center; gap: 3px;
        background: none; border: none; cursor: pointer;
        padding: 4px 0; flex: 1; font-family: 'Inter', sans-serif;
        transition: opacity 0.15s;
      }
      .vox-nav-btn svg { width: 18px; height: 18px; }
      .vox-nav-btn-label { font-size: 10px; font-weight: 500; }
      .vox-nav-btn.active svg { color: #374151; }
      .vox-nav-btn.active .vox-nav-btn-label { color: #374151; }
      .vox-nav-btn:not(.active) svg { color: #ccc; }
      .vox-nav-btn:not(.active) .vox-nav-btn-label { color: #ccc; }

      .vox-powered {
        text-align: center; padding: 6px 0 8px;
        font-size: 10px; color: #bbb; font-weight: 500;
        background: white; display: flex; align-items: center;
        justify-content: center; flex-shrink: 0;
        border-top: 1px solid #f0f0f0;
      }
    `
    document.head.appendChild(style)
  }

  function buildWidget(name) {
    clientName = name || 'Support'
    const initial = clientName[0].toUpperCase()

    const toggleBtn = document.createElement('button')
    toggleBtn.className = 'vox-btn-toggle'
    toggleBtn.id = 'vox-toggle'
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="${textColor}"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>`

    toggleBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation()
      e.preventDefault()
      toggleChat()
    })

    const shell = document.createElement('div')
    shell.className = 'vox-shell vox-hidden'
    shell.id = 'vox-shell'
    shell.addEventListener('click', e => e.stopPropagation())
    shell.addEventListener('mousedown', e => e.stopPropagation())
    shell.addEventListener('mouseup', e => e.stopPropagation())

    shell.innerHTML = `
      <!-- Header -->
      <div class="vox-header">
        <div class="vox-header-left">
          <div class="vox-header-dot-wrap">
            <div class="vox-header-avatar">${initial}</div>
            <div class="vox-header-online"></div>
          </div>
          <div>
            <div class="vox-header-name">${clientName}</div>
            <div class="vox-header-status">En ligne maintenant</div>
          </div>
        </div>
        <button class="vox-header-close" id="vox-close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Page Accueil -->
      <div class="vox-page" id="vox-page-home">
        <div class="vox-home">

          <!-- Hero coloré -->
          <div class="vox-home-hero">
            <div class="vox-home-greeting">${widgetGreeting}</div>
            <div class="vox-home-sub">${widgetSubtitle}</div>
          </div>

          <!-- Cards flottantes -->
          <div class="vox-home-content">

            <!-- CTA card -->
            <div class="vox-home-card">
              <button class="vox-home-start-btn" id="vox-start-chat">
                <div class="vox-home-start-btn-left">
                  <div class="vox-home-start-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${textColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    </svg>
                  </div>
                  <div>
                    <span class="vox-home-start-title">Démarrer une conversation</span>
                    <span class="vox-home-start-hint">On vous répond rapidement</span>
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            <!-- FAQ card -->
            <div class="vox-home-card">
              <div id="vox-faq-header" class="vox-faq-header-row">
                <div class="vox-section-label">Questions fréquentes</div>
                <span id="vox-faq-chevron" style="color:#ccc;transition:transform 0.2s;display:flex;align-items:center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>
              <div class="vox-faq" id="vox-faq" style="display:none"></div>
            </div>

          </div>
        </div>
      </div>

      <!-- Page Conversations -->
      <div class="vox-page vox-hidden" id="vox-page-conversations">
        <div class="vox-convs">
          <div class="vox-convs-top">
            <div class="vox-section-label">Mes conversations</div>
            <button class="vox-new-conv-btn" id="vox-new-conv">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nouveau
            </button>
          </div>
          <div class="vox-conv-list" id="vox-conv-list">
            <div class="vox-conv-loading">Chargement...</div>
          </div>
        </div>
      </div>

      <!-- Page Chat -->
      <div class="vox-page vox-hidden" id="vox-page-chat">
        <div class="vox-chat">
          <div class="vox-chat-topbar">
            <button class="vox-chat-back" id="vox-back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div class="vox-chat-info">
              <div class="vox-chat-name" id="vox-chat-title">${clientName}</div>
              <div class="vox-chat-sub" id="vox-chat-subtitle">Support client</div>
            </div>
          </div>

          <div class="vox-messages" id="vox-messages"></div>

          <div class="vox-file-preview" id="vox-file-preview" style="display:none">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span class="vox-file-preview-name" id="vox-file-preview-name"></span>
            <button class="vox-file-preview-remove" id="vox-file-remove">✕</button>
          </div>

          <div class="vox-input-area">
            <div class="vox-toolbar">
              <button class="vox-attach" id="vox-attach" title="Joindre un fichier">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <textarea class="vox-input" id="vox-input" placeholder="Écrivez un message..." rows="1"></textarea>
              <button class="vox-send" id="vox-send" disabled>
                <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <div class="vox-nav">
        <button class="vox-nav-btn active" id="vox-nav-home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="vox-nav-btn-label">Accueil</span>
        </button>
        <button class="vox-nav-btn" id="vox-nav-conversations">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          <span class="vox-nav-btn-label">Conversations</span>
        </button>
      </div>

      <div class="vox-powered">
  Powered by
  <a href="https://voxtrend.fr" target="_blank" style="display:inline-flex;align-items:center;margin-left:4px;text-decoration:none;">
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 602.13 169.88" style="height:14px;width:auto;display:inline-block;vertical-align:middle;margin-left:4px">
    <defs>
      <linearGradient id="vox-g1" x1="50.07" y1="86.69" x2="155.93" y2="86.5" gradientTransform="translate(-5.69 -1.83) rotate(0.1)" gradientUnits="userSpaceOnUse">
        <stop offset="0.1" stop-color="#defcb9"/><stop offset="0.35" stop-color="#56cfe1"/>
        <stop offset="0.7" stop-color="#5e60ce"/><stop offset="0.9" stop-color="#7400b8"/>
      </linearGradient>
      <linearGradient id="vox-g2" x1="143.79" y1="80.4" x2="27.13" y2="80.61" xlink:href="#vox-g1"/>
          </defs>
          <path fill="#11243e" d="M191.76,111.65,169,58.24h10.2L197.66,103h.64l18.33-44.72h10.13L204,111.65Z"/>
          <path fill="#11243e" d="M228.67,91.88c0-12.36,8.84-20.65,22-20.65s22.08,8.29,22.08,20.65c0,12.19-8.85,20.56-22.08,20.56S228.67,104.07,228.67,91.88Zm35.63,0c0-8.45-4-13.08-13.63-13.08s-13.55,4.63-13.55,13.08,4,12.91,13.55,12.91S264.3,100.25,264.3,91.88Z"/>
          <path fill="#11243e" d="M275.22,111.65,292.28,92v-.48L275.22,72h10.44l13.15,15h.48l13-15h10.36L305.59,91.4v.48l17.06,19.77H312.21L299.05,96.5h-.55l-13,15.15Z"/>
          <path fill="#11243e" d="M344.89,111.65V66H323.84V58.24h50.54V66h-21v45.68Z"/>
          <path fill="#11243e" d="M379.41,111.65V72h7.89V82.71h.55c1.2-6.38,5.51-11.48,13.64-11.48,9,0,12.91,6.46,12.91,14v5.18h-8.53v-3.5c0-5.66-2.39-8.3-8.29-8.3-6.78,0-9.57,3.75-9.57,10.85v22.24Z"/>
          <path fill="#11243e" d="M418.23,91.88c0-12.36,8.44-20.65,21.36-20.65,12.28,0,20.65,6.78,20.65,18.81a18.21,18.21,0,0,1-.32,3.75H426.28c.32,7.65,4.06,11.72,13.23,11.72,8.29,0,11.72-2.71,11.72-7.41v-.64h8.61v.72c0,8.45-8.29,14.26-20.09,14.26C426.75,112.44,418.23,105.11,418.23,91.88ZM426.36,89H452.1v-.16c0-7.34-4.22-10.84-12.67-10.84C430.66,78,426.83,81.91,426.36,89Z"/>
          <path fill="#11243e" d="M466.69,111.65V72h7.89V84.3h.56c1.2-6.69,6.46-13.07,16.5-13.07,11,0,16.42,7.41,16.42,16.58v23.84h-8.61V90.12c0-7.41-3.34-11.16-11.55-11.16-8.69,0-12.6,4.47-12.6,13.08v19.61Z"/>
          <path fill="#11243e" d="M513.72,91.88c0-12.36,6.86-20.65,18.89-20.65,9.41,0,14.75,4.86,16.35,11.56h.48V58.24H558v53.41h-7.89v-11.4h-.56c-1.67,7.89-7.49,12.19-16.42,12.19C520.66,112.44,513.72,104.07,513.72,91.88Zm22.08,12.67c8.45,0,13.64-4,13.64-12.27v-.64c0-8.45-5-12.6-13.8-12.6-8.29,0-13.23,3.27-13.23,12.84S527.27,104.55,535.8,104.55Z"/>
          <path fill="url(#vox-g1)" d="M146.67,71.48,114.3,118.16l-1.57,2.26a19.21,19.21,0,0,1-15.29,8.24h-.82a19.25,19.25,0,0,1-15.27-8.29l-1.56-2.26L47.58,71.3A19.21,19.21,0,0,1,79.24,49.52l17.88,26,18-25.92a19.21,19.21,0,1,1,31.57,21.9Z"/>
          <path fill="url(#vox-g2)" d="M95.5,107.49c2,2.62,5.36,7.76,11.21,8.71s9.72-1.11,12.71-5.42c0,0,24.56-35.4,26.31-37.95s1.83-8.53-3.1-11.86c-2.8-2-5.73-1.77-8.21-1.17s-4,2.58-5.07,4L116.76,81.11s-3.26,4.84-8,4.67c-1.92-.07-5.33-.44-11.62-10.28-1.43-2.25-13.74-20.07-17.88-26a18.8,18.8,0,0,0-15.83-8.31,18.16,18.16,0,0,0-10.89,3.37,19.16,19.16,0,0,0-3.9,28.23S44.93,65.65,51.71,61a9.8,9.8,0,0,1,8.21-1.17c3.9,1.32,5.1,4.07,8.61,9.35C70.82,72.41,93.54,104.86,95.5,107.49Z"/>
        </svg>
        </a>
      </div>
    `

    document.body.appendChild(toggleBtn)
    document.body.appendChild(shell)

    bindEvents()
    buildFaq()
  }

  function buildFaq() {
    const questions = widgetFaq.length > 0 ? widgetFaq : [
      'Quels sont vos délais de livraison ?',
      'Comment suivre ma commande ?',
      'Quelle est votre politique de retour ?',
    ]
    const faq = document.getElementById('vox-faq')
    const header = document.getElementById('vox-faq-header')
    const chevron = document.getElementById('vox-faq-chevron')
    let faqOpen = false

    if (header) {
      header.addEventListener('click', (e) => {
        e.stopPropagation()
        faqOpen = !faqOpen
        faq.style.display = faqOpen ? 'flex' : 'none'
        chevron.style.transform = faqOpen ? 'rotate(180deg)' : 'rotate(0deg)'
      })
    }

    questions.forEach(q => {
      const item = document.createElement('div')
      item.className = 'vox-faq-item'
      item.innerHTML = `
        <span class="vox-faq-item-text">${q}</span>
        <span class="vox-faq-item-arrow">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </span>
      `
      item.onclick = (e) => {
        e.stopPropagation()
        startNewConversation(() => {
          document.getElementById('vox-input').value = q
          updateSendBtn()
          document.getElementById('vox-input').focus()
        })
      }
      faq.appendChild(item)
    })
  }

  async function loadConversationsList() {
    const list = document.getElementById('vox-conv-list')
    list.innerHTML = '<div class="vox-conv-loading">Chargement...</div>'
    try {
      const res = await fetch(`${API_URL}/api/conversations/widget?visitorId=${visitorId}&clientId=${clientId}`)
      const convs = await res.json()
      if (!Array.isArray(convs) || convs.length === 0) {
        list.innerHTML = `
          <div class="vox-conv-empty">
            <div class="vox-conv-empty-txt">Aucune conversation</div>
            <div class="vox-conv-empty-sub">Démarrez depuis l'accueil</div>
          </div>`
        return
      }
      list.innerHTML = ''
      convs.forEach(conv => {
        const isActive = conv.id === conversationId
        const item = document.createElement('div')
        item.className = `vox-conv-item${isActive ? ' active-conv' : ''}`
        let lastMsgDisplay = conv.last_message || ''
        try { const p = JSON.parse(lastMsgDisplay); if (p.type === 'file') lastMsgDisplay = `📎 ${p.name}` } catch (_) {}
        item.innerHTML = `
          <div class="vox-conv-avatar">#${conv.ticket_number || '?'}</div>
          <div class="vox-conv-content">
            <div class="vox-conv-top">
              <span class="vox-conv-name">Conversation #${conv.ticket_number || '?'}</span>
              <span class="vox-conv-time">${relativeTime(conv.last_message_at || conv.created_at)}</span>
            </div>
            <div class="vox-conv-preview">${lastMsgDisplay ? escapeHtml(lastMsgDisplay) : 'Aucun message'}</div>
          </div>
          <div class="vox-conv-status" style="background:${conv.status === 'open' ? '#22c55e' : '#ddd'}"></div>
        `
        item.onclick = (e) => { e.stopPropagation(); openConversation(conv) }
        list.appendChild(item)
      })
    } catch {
      list.innerHTML = '<div class="vox-conv-loading">Erreur de chargement</div>'
    }
  }

  async function openConversation(conv) {
    conversationId = conv.id
    localStorage.setItem('vox_conversation_id', conv.id)
    const subtitle = document.getElementById('vox-chat-subtitle')
    if (subtitle) subtitle.textContent = `#${conv.ticket_number || '?'} · Support`
    document.getElementById('vox-messages').innerHTML = ''
    navigateTo('chat')
    try {
      const res = await fetch(`${API_URL}/api/conversations/${conv.id}/messages/widget?visitorId=${visitorId}`)
      const history = await res.json()
      if (Array.isArray(history)) history.forEach(msg => addMessage(msg.content, msg.sender_role))
    } catch (err) { console.error('[Voxtrend]', err) }
    if (socket) socket.emit('join_conversation', { conversationId })
  }

  function startNewConversation(callback) {
    conversationId = null
    localStorage.removeItem('vox_conversation_id')
    const messages = document.getElementById('vox-messages')
    if (messages) messages.innerHTML = ''
    const subtitle = document.getElementById('vox-chat-subtitle')
    if (subtitle) subtitle.textContent = 'Support client'
    navigateTo('chat')
    if (callback) callback()
  }

  function navigateTo(page) {
    if (page !== currentPage) previousPage = currentPage
    currentPage = page
    const pages = { home: 'vox-page-home', conversations: 'vox-page-conversations', chat: 'vox-page-chat' }
    Object.entries(pages).forEach(([key, id]) => {
      const el = document.getElementById(id)
      if (el) el.classList.toggle('vox-hidden', key !== page)
    })
    document.getElementById('vox-nav-home').classList.toggle('active', page === 'home')
    document.getElementById('vox-nav-conversations').classList.toggle('active', page === 'conversations' || page === 'chat')
    if (page === 'conversations') loadConversationsList()
    if (page === 'chat') setTimeout(() => document.getElementById('vox-input')?.focus(), 100)
  }

  function toggleChat() {
    isOpen = !isOpen
    const shell = document.getElementById('vox-shell')
    const btn = document.getElementById('vox-toggle')
    shell.classList.toggle('vox-hidden', !isOpen)
    if (isOpen) {
      btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${textColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><polyline points="6 9 12 15 18 9"/></svg>`
      if (conversationId) {
        const messages = document.getElementById('vox-messages')
        if (messages && messages.children.length === 0) {
          fetch(`${API_URL}/api/conversations/${conversationId}/messages/widget?visitorId=${visitorId}`)
            .then(r => r.json())
            .then(history => {
              if (Array.isArray(history)) history.forEach(msg => addMessage(msg.content, msg.sender_role))
            })
            .catch(() => {})
          navigateTo('chat')
        }
      }
    } else {
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="${textColor}"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>`
    }
  }

  function bindEvents() {
    document.getElementById('vox-close').onclick = (e) => { e.stopPropagation(); toggleChat() }
    document.getElementById('vox-start-chat').onclick = (e) => { e.stopPropagation(); startNewConversation() }
    document.getElementById('vox-new-conv').onclick = (e) => { e.stopPropagation(); startNewConversation() }
    document.getElementById('vox-back').onclick = (e) => { e.stopPropagation(); navigateTo(previousPage || 'home') }
    document.getElementById('vox-nav-home').onclick = (e) => { e.stopPropagation(); navigateTo('home') }
    document.getElementById('vox-nav-conversations').onclick = (e) => { e.stopPropagation(); navigateTo('conversations') }

    document.getElementById('vox-attach').onclick = (e) => {
      e.stopPropagation()
      e.preventDefault()
      fileDialogOpen = true
      function onWindowFocus() {
        setTimeout(() => { fileDialogOpen = false }, 500)
        window.removeEventListener('focus', onWindowFocus)
      }
      window.addEventListener('focus', onWindowFocus)
      setTimeout(() => { fileDialogOpen = false; window.removeEventListener('focus', onWindowFocus) }, 3000)
      fileInputGlobal.click()
    }

    document.getElementById('vox-file-remove').onclick = (e) => { e.stopPropagation(); removePendingFile() }
    document.getElementById('vox-send').onclick = (e) => { e.stopPropagation(); sendMessage() }

    const textarea = document.getElementById('vox-input')
    function autoResize() {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 90) + 'px'
      updateSendBtn()
    }
    textarea.addEventListener('input', autoResize)
    textarea.addEventListener('click', e => e.stopPropagation())
    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.shiftKey && e.key === ' ') {
        e.preventDefault()
        const s = textarea.selectionStart
        textarea.value = textarea.value.substring(0, s) + '\n' + textarea.value.substring(textarea.selectionEnd)
        textarea.selectionStart = s + 1; textarea.selectionEnd = s + 1
        autoResize(); return
      }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    })
  }

  function updateSendBtn() {
    const btn = document.getElementById('vox-send')
    const input = document.getElementById('vox-input')
    if (btn && input) btn.disabled = !input.value.trim() && !pendingFile
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    fileInputGlobal.value = ''
    const preview = document.getElementById('vox-file-preview')
    const previewName = document.getElementById('vox-file-preview-name')
    if (preview) { previewName.textContent = 'Envoi en cours...'; preview.style.display = 'flex' }
    updateSendBtn()
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      pendingFile = { url: data.url, name: data.name, type: data.type }
      if (previewName) previewName.textContent = data.name
      updateSendBtn()
    } catch {
      if (previewName) previewName.textContent = 'Fichier non autorisé'
      setTimeout(removePendingFile, 2500)
    }
  }

  function removePendingFile() {
    pendingFile = null
    const preview = document.getElementById('vox-file-preview')
    if (preview) preview.style.display = 'none'
    updateSendBtn()
  }

  async function sendMessage() {
    const input = document.getElementById('vox-input')
    const content = input.value.trim()
    if (!content && !pendingFile) return
    if (!conversationId) {
      await startConversation()
      if (!conversationId) return
    }
    if (pendingFile) {
      const fc = JSON.stringify({ type: 'file', url: pendingFile.url, name: pendingFile.name, fileType: pendingFile.type })
      addMessage(fc, 'visitor')
      socket.emit('visitor_message', { conversationId, content: fc })
      removePendingFile()
    }
    if (content) {
      addMessage(content, 'visitor')
      socket.emit('visitor_message', { conversationId, content })
      input.value = ''
      input.style.height = 'auto'
      updateSendBtn()
    }
  }

  function addMessage(content, role) {
    const messages = document.getElementById('vox-messages')
    if (!messages) return
    const now = new Date()
    const stamps = messages.querySelectorAll('.vox-msg-stamp')
    const lastStamp = stamps[stamps.length - 1]
    const lastTime = lastStamp ? parseInt(lastStamp.dataset.ts) : 0
    if (now - lastTime > 300000) {
      const stamp = document.createElement('div')
      stamp.className = 'vox-msg-stamp'
      stamp.dataset.ts = now.getTime()
      stamp.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      messages.appendChild(stamp)
    }
    const msg = document.createElement('div')
    msg.className = `vox-msg ${role}`
    let parsed = null
    try { const p = JSON.parse(content); if (p.type === 'file') parsed = p } catch (_) {}
    if (parsed) {
      const isImage = parsed.fileType?.startsWith('image/')
      if (isImage) {
        const img = document.createElement('img')
        img.src = `${API_URL}${parsed.url}`; img.alt = parsed.name
        img.onclick = () => window.open(`${API_URL}${parsed.url}`, '_blank')
        msg.appendChild(img)
      } else {
        const link = document.createElement('a')
        link.href = `${API_URL}${parsed.url}`; link.target = '_blank'
        link.className = `vox-file-link ${role}`
        link.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px">${parsed.name}</span>`
        msg.appendChild(link)
      }
    } else {
      msg.innerHTML = content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')
    }
    messages.appendChild(msg)
    messages.scrollTop = messages.scrollHeight
  }

  async function startConversation() {
    try {
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, visitorId }),
      })
      const conv = await res.json()
      conversationId = conv.id
      localStorage.setItem('vox_conversation_id', conv.id)
      const subtitle = document.getElementById('vox-chat-subtitle')
      if (subtitle) subtitle.textContent = `#${conv.ticket_number || '?'} · Support`
      socket.emit('join_conversation', { conversationId })
      socket.emit('new_conversation', { conversationId, clientId })
    } catch (err) {
      console.error('[Voxtrend]', err)
      addMessage('Impossible de se connecter.', 'system')
    }
  }

  function relativeTime(str) {
    if (!str) return ''
    const d = new Date(str), now = new Date(), diff = now - d
    if (diff < 60000) return "À l'instant"
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }

  async function init() {
    try {
      const res = await fetch(`${API_URL}/api/widget/config?apiKey=${API_KEY}`)
      const cfg = await res.json()
      clientId = cfg.clientId
      primaryColor = cfg.primaryColor || '#11243e'
      textColor = cfg.textColor || '#ffffff'
      widgetHeight = cfg.height || 600
      widgetGreeting = cfg.greeting || 'Bonjour 👋'
      widgetSubtitle = cfg.subtitle || 'Une question ? Nous répondons en quelques minutes.'
      widgetFaq = Array.isArray(cfg.faq) ? cfg.faq : []
      injectStyles()
      buildWidget(cfg.clientName)
      loadSocketIO(() => {
        socket = io(API_URL)
        socket.on('connect', async () => {
          console.log('[Voxtrend] Connecté:', socket.id)
          const savedConvId = localStorage.getItem('vox_conversation_id')
          if (savedConvId) {
            try {
              const res = await fetch(`${API_URL}/api/conversations/${savedConvId}/messages/widget?visitorId=${visitorId}`)
              if (res.ok) {
                conversationId = savedConvId
                socket.emit('join_conversation', { conversationId })
              } else {
                localStorage.removeItem('vox_conversation_id')
              }
            } catch (_) {
              localStorage.removeItem('vox_conversation_id')
            }
          }
        })
        socket.on('new_message', (message) => {
          if (message.conversation_id !== conversationId) return
          if (message.sender_role === 'agent') {
            if (currentPage !== 'chat') navigateTo('chat')
            addMessage(message.content, 'agent')
          }
        })
        socket.on('disconnect', () => console.log('[Voxtrend] Déconnecté'))
      })
    } catch (err) {
      console.error('[Voxtrend] Erreur init:', err)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()