/**
 * G. LOVATO ROSEIRA: SEÇÃO DE BRIEFINGS (ES MODULE)
 * Integração com Firebase v13.4.0 (Auth & Firestore)
 * Gerenciamento de Tema, Formulário do Cliente, Login, Painel e Dossiê em PDF
 */

import { auth, db } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     0. GERENCIAMENTO DE TEMA (MODO CLARO / MODO ESCURO)
     ========================================================================== */
  const themeToggleBtn = document.getElementById('themeToggle');
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = (theme === 'light') ? '🌙' : '☀️';
      themeToggleBtn.setAttribute('title', (theme === 'light') ? 'Alternar para Modo Escuro' : 'Alternar para Modo Claro');
    }
  }

  const currentTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = (activeTheme === 'dark') ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  const currentPage = (document.body.getAttribute('data-page') || '').toLowerCase();

  /* ==========================================================================
     UTILITÁRIOS GLOBAIS DE FORMULÁRIO (CHIPS DE COR E CAMPOS CONDICIONAIS)
     ========================================================================== */
  window.toggleConditional = function(elementId, show) {
    const el = document.getElementById(elementId);
    if (el) {
      if (show) el.classList.add('active');
      else el.classList.remove('active');
    }
  };

  const colorArrays = {
    id_cores_gosta: [],
    id_cores_nao_quer: [],
    ui_cores_gosta: [],
    ui_cores_nao_quer: []
  };

  window.triggerColorPicker = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.click();
  };

  window.addColorChip = function(targetKey, hexValue) {
    if (!hexValue) return;
    hexValue = hexValue.toUpperCase();

    let arrayKey = '';
    let containerId = '';

    if (targetKey === 'grafico_gosta') {
      arrayKey = 'id_cores_gosta';
      containerId = 'id_chips_gosta';
    } else if (targetKey === 'grafico_nao_quer') {
      arrayKey = 'id_cores_nao_quer';
      containerId = 'id_chips_nao_quer';
    } else if (targetKey === 'ui_gosta') {
      arrayKey = 'ui_cores_gosta';
      containerId = 'ui_chips_gosta';
    } else if (targetKey === 'ui_nao_quer') {
      arrayKey = 'ui_cores_nao_quer';
      containerId = 'ui_chips_nao_quer';
    }

    if (!arrayKey || !colorArrays[arrayKey]) return;

    if (colorArrays[arrayKey].length < 5 && !colorArrays[arrayKey].includes(hexValue)) {
      colorArrays[arrayKey].push(hexValue);
      renderColorChips(arrayKey, containerId);
    }
  };

  window.removeColorChip = function(arrayKey, containerId, index) {
    if (colorArrays[arrayKey]) {
      colorArrays[arrayKey].splice(index, 1);
      renderColorChips(arrayKey, containerId);
    }
  };

  function renderColorChips(arrayKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const list = colorArrays[arrayKey] || [];
    container.innerHTML = list.map((hex, index) => `
      <div class="color-chip-dossier">
        <span class="chip-swatch" style="background-color: ${hex};"></span>
        <span class="chip-hex-code">${hex}</span>
        <button type="button" class="chip-remove-btn" onclick="removeColorChip('${arrayKey}', '${containerId}', ${index})" title="Remover cor">&times;</button>
      </div>
    `).join('');
  }

  /* ==========================================================================
     1. PÁGINA DE LOGIN (login.html)
     ========================================================================== */
  const loginForm = document.getElementById('loginForm');
  const loginFeedback = document.getElementById('loginFeedback');

  if (loginForm || currentPage === 'login') {
    // Se o usuário já estiver logado, redireciona para painel.html
    onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.replace('painel.html');
      }
    });

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        if (!email || !password) return;

        if (loginFeedback) {
          loginFeedback.style.display = 'none';
          loginFeedback.textContent = '';
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'AUTENTICANDO...';
        }

        try {
          await signInWithEmailAndPassword(auth, email, password);
          window.location.replace('painel.html');
        } catch (err) {
          console.error("Erro na autenticação:", err);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ENTRAR NO PAINEL \u2192';
          }

          let msg = 'Erro ao realizar login. Verifique seus dados.';
          switch (err.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
              msg = 'E-mail ou senha incorretos.';
              break;
            case 'auth/invalid-email':
              msg = 'O formato do e-mail digitado não é válido.';
              break;
            case 'auth/user-disabled':
              msg = 'Esta conta de usuário foi desativada.';
              break;
            case 'auth/too-many-requests':
              msg = 'Muitas tentativas sem sucesso. Bloqueado temporariamente por segurança. Tente novamente mais tarde.';
              break;
            case 'auth/network-request-failed':
              msg = 'Falha de conexão com os servidores de autenticação. Verifique sua internet.';
              break;
            default:
              msg = `Falha na autenticação: ${err.message}`;
          }

          if (loginFeedback) {
            loginFeedback.style.display = 'block';
            loginFeedback.textContent = msg;
          }
        }
      });
    }
  }

  /* ==========================================================================
     2. PÁGINA DE PAINEL (painel.html)
     ========================================================================== */
  if (currentPage === 'painel') {
    const userEmailTag = document.getElementById('userEmailTag');
    const logoutBtn = document.getElementById('logoutBtn');
    const tableBody = document.getElementById('briefingsTableBody');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');

    let allBriefings = [];

    // Proteção de rota via onAuthStateChanged
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Se não houver usuário logado, redireciona e não carrega nada
        window.location.replace('login.html');
        return;
      }

      // Usuário autenticado
      if (userEmailTag) {
        userEmailTag.textContent = user.email || 'Administradora';
      }

      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          try {
            await signOut(auth);
            window.location.replace('login.html');
          } catch (err) {
            console.error("Erro ao sair:", err);
            window.location.replace('login.html');
          }
        });
      }

      // Carregar os briefings do Firestore
      await loadBriefingsList();
    });

    async function loadBriefingsList() {
      if (!tableBody) return;

      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            Carregando acervo de briefings...
          </td>
        </tr>
      `;

      try {
        const q = query(collection(db, "briefings"), orderBy("criadoEm", "desc"));
        const snapshot = await getDocs(q);

        allBriefings = [];
        snapshot.forEach(docSnap => {
          allBriefings.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });

        renderTable(allBriefings);
      } catch (err) {
        console.error("Erro ao carregar briefings:", err);
        if (err.code === 'permission-denied') {
          tableBody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; padding: 3rem 1.5rem;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔒</div>
                <h3 style="font-family: var(--font-title); font-size: 1.4rem; color: #C62828; margin-bottom: 0.5rem;">SEM PERMISSÃO</h3>
                <p style="font-size: 0.95rem; color: var(--text-paper); max-width: 520px; margin: 0 auto; line-height: 1.5;">
                  O Firestore recusou a leitura da coleção de briefings. Verifique as Regras de Segurança (Firestore Security Rules) no Console do Firebase.
                </p>
              </td>
            </tr>
          `;
        } else {
          tableBody.innerHTML = `
            <tr>
              <td colspan="4" style="text-align: center; color: #C62828; padding: 2.5rem;">
                <strong>Erro ao carregar briefings:</strong> ${escapeHtml(err.message)}
              </td>
            </tr>
          `;
        }
      }
    }

    function renderTable(list) {
      if (!tableBody) return;

      if (list.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
              Nenhum briefing registrado no momento.
            </td>
          </tr>
        `;
        return;
      }

      tableBody.innerHTML = list.map(item => {
        let catLabel = 'GERAL';
        let badgeColor = 'var(--color-graphite)';

        if (item.categoria === 'interface') {
          catLabel = 'INTERFACE';
          badgeColor = 'var(--accent-interface)';
        } else if (item.categoria === 'audiovisual') {
          catLabel = 'AUDIOVISUAL';
          badgeColor = 'var(--accent-audiovisual)';
        } else if (item.categoria === 'grafico') {
          catLabel = 'IDENTIDADE VISUAL';
          badgeColor = 'var(--accent-grafico)';
        }

        const dateFormatted = formatTimestamp(item.criadoEm || item.createdAt);
        const displayTitle = item.titulo || item.respostas?.nomeMarca || item.clienteNome || 'Briefing sem título';

        return `
          <tr>
            <td>
              <a href="detalhe.html?id=${item.id}" class="table-title" style="text-decoration: underline;">
                ${escapeHtml(displayTitle)}
              </a>
              ${item.clienteNome ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">Cliente: ${escapeHtml(item.clienteNome)}</div>` : ''}
            </td>
            <td>
              <span class="category-badge-table" style="background-color: ${badgeColor};">
                ${catLabel}
              </span>
            </td>
            <td>${dateFormatted}</td>
            <td>
              <a href="detalhe.html?id=${item.id}" class="btn-doc btn-doc-ghost" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                VER DOSSIÊ &rarr;
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Busca simples e filtro por categoria
    function applyFilters() {
      const term = (searchInput?.value || '').toLowerCase().trim();
      const cat = categoryFilter?.value || 'todos';

      const filtered = allBriefings.filter(item => {
        const matchesCategory = (cat === 'todos') || (item.categoria === cat);
        const titleMatch = (item.titulo || '').toLowerCase().includes(term);
        const clientMatch = (item.clienteNome || '').toLowerCase().includes(term);
        const contentMatch = (item.conteudo || '').toLowerCase().includes(term);

        return matchesCategory && (titleMatch || clientMatch || contentMatch);
      });

      renderTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);

    // Modal de criação manual no painel (opcional)
    const newBriefingBtn = document.getElementById('newBriefingBtn');
    const briefingModal = document.getElementById('briefingModal');
    const modalCloseX = document.getElementById('modalCloseX');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const briefingForm = document.getElementById('briefingForm');

    if (newBriefingBtn) {
      newBriefingBtn.addEventListener('click', () => {
        window.location.href = 'formulario.html';
      });
    }

    if (modalCloseX) modalCloseX.addEventListener('click', () => briefingModal.classList.remove('active'));
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => briefingModal.classList.remove('active'));
  }

  /* ==========================================================================
     3. PÁGINA DE DETALHE & IMPRESSÃO PDF (detalhe.html)
     ========================================================================== */
  if (currentPage === 'detalhe') {
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    const docTitle = document.getElementById('docTitle');
    const docCategoryBadge = document.getElementById('docCategoryBadge');
    const docDate = document.getElementById('docDate');
    const docId = document.getElementById('docId');
    const docContent = document.getElementById('docContent');
    const docMaterialsBox = document.getElementById('docMaterialsBox');
    const docMaterialsLink = document.getElementById('docMaterialsLink');

    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', () => {
        window.print();
      });
    }

    // Proteção de rota via onAuthStateChanged
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.replace('login.html');
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const briefingId = urlParams.get('id');

      if (!briefingId) {
        showDetailError("IDENTIFICADOR NÃO INFORMADO", "Nenhum código de briefing foi informado na URL.");
        return;
      }

      try {
        const docRef = doc(db, "briefings", briefingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          showDetailError("BRIEFING NÃO ENCONTRADO", "O documento solicitado não existe ou foi removido do sistema.");
          return;
        }

        const data = docSnap.data();
        renderBriefingDoc(briefingId, data);
      } catch (err) {
        console.error("Erro ao carregar detalhe do briefing:", err);
        if (err.code === 'permission-denied') {
          showDetailError("SEM PERMISSÃO", "O Firestore recusou a leitura deste documento. Verifique as Regras de Segurança no Console do Firebase.");
        } else {
          showDetailError("ERRO AO CARREGAR DOCUMENTO", err.message);
        }
      }
    });

    function showDetailError(heading, message) {
      if (docCategoryBadge) docCategoryBadge.textContent = 'ERRO';
      if (docTitle) {
        docTitle.textContent = heading;
        docTitle.style.color = '#C62828';
      }
      if (docContent) {
        docContent.innerHTML = `
          <div style="padding: 2rem; border: 1px solid #C62828; background: rgba(198, 40, 40, 0.08); margin-top: 1rem;">
            <p style="font-size: 1rem; color: var(--text-paper); margin: 0;">${escapeHtml(message)}</p>
            <div style="margin-top: 1.5rem;">
              <a href="painel.html" class="btn-doc btn-doc-ghost">&larr; VOLTAR AO PAINEL</a>
            </div>
          </div>
        `;
      }
    }

    function renderBriefingDoc(id, data) {
      const displayTitle = data.titulo || data.respostas?.nomeMarca || data.clienteNome || 'Briefing Sem Título';
      
      if (docTitle) docTitle.textContent = displayTitle;
      if (docId) docId.textContent = `#${id.slice(0, 10).toUpperCase()}`;
      if (docDate) docDate.textContent = formatTimestamp(data.criadoEm || data.createdAt);

      let catText = 'DOCUMENTO OFICIAL';
      let catColor = 'var(--color-graphite)';

      if (data.categoria === 'interface') {
        catText = 'ESPECIFICAÇÕES DE INTERFACE';
        catColor = 'var(--accent-interface)';
      } else if (data.categoria === 'audiovisual') {
        catText = 'DIRETRIZES AUDIOVISUAIS';
        catColor = 'var(--accent-audiovisual)';
      } else if (data.categoria === 'grafico') {
        catText = 'IDENTIDADE VISUAL & MARCA';
        catColor = 'var(--accent-grafico)';
      }

      if (docCategoryBadge) {
        docCategoryBadge.textContent = catText;
        docCategoryBadge.style.backgroundColor = catColor;
      }

      // Se houver o HTML formatado em data.conteudo
      if (data.conteudo) {
        if (docContent) docContent.innerHTML = data.conteudo;
      } else if (data.respostas) {
        // Se houver apenas o objeto respostas, monta a visualização estruturada
        if (docContent) docContent.innerHTML = buildHtmlFromRespostas(data);
      }

      // Link para materiais de apoio
      const matLink = data.linkMaterial || data.respostas?.materialLink || data.respostas?.roteiroLink || data.respostas?.idLink;
      if (matLink && docMaterialsBox && docMaterialsLink) {
        docMaterialsBox.style.display = 'block';
        docMaterialsLink.href = matLink;
        docMaterialsLink.textContent = matLink;
      }
    }

    function buildHtmlFromRespostas(data) {
      const resp = data.respostas || {};
      let html = '';

      html += `<h2>DADOS DO CLIENTE E CONTATO</h2>`;
      html += `<p><strong>Nome / Empresa:</strong> ${escapeHtml(resp.nome || data.clienteNome || '--')}</p>`;
      html += `<p><strong>Contato:</strong> ${escapeHtml(resp.contato || data.clienteContato || '--')}</p>`;
      html += `<p><strong>Prazo Desejado:</strong> ${escapeHtml(resp.prazo || data.prazo || '--')}</p>`;
      html += `<p><strong>Orçamento Estimado:</strong> ${escapeHtml(resp.orcamento || data.orcamento || 'Não informado')}</p>`;

      html += `<h2>RESPOSTAS DO QUESTIONÁRIO</h2>`;
      for (const [key, val] of Object.entries(resp)) {
        if (['nome', 'contato', 'prazo', 'orcamento'].includes(key)) continue;
        if (typeof val === 'object' && val !== null) {
          html += `<p><strong>${escapeHtml(key)}:</strong> <code>${escapeHtml(JSON.stringify(val))}</code></p>`;
        } else {
          html += `<p><strong>${escapeHtml(key)}:</strong> ${escapeHtml(String(val))}</p>`;
        }
      }

      return html;
    }
  }

  /* ==========================================================================
     4. FORMULÁRIO DO CLIENTE (formulario.html)
     ========================================================================== */
  if (currentPage === 'formulario') {
    let selectedCategory = '';
    let currentStep = 1;

    const stepCategory = document.getElementById('stepCategory');
    const stepQuestions = document.getElementById('stepQuestions');
    const stepCommon = document.getElementById('stepCommon');
    const stepConfirmation = document.getElementById('stepConfirmation');
    const progressContainer = document.getElementById('progressContainer');

    const stepCounterText = document.getElementById('stepCounterText');
    const stepPercentText = document.getElementById('stepPercentText');
    const progressBarFill = document.getElementById('progressBarFill');

    const blockGrafico = document.getElementById('blockGrafico');
    const blockAudiovisual = document.getElementById('blockAudiovisual');
    const blockInterface = document.getElementById('blockInterface');

    const categoryCards = document.querySelectorAll('.category-select-card');
    const btnBackToCategory = document.getElementById('btnBackToCategory');
    const btnGoToCommon = document.getElementById('btnGoToCommon');
    const btnBackToQuestions = document.getElementById('btnBackToQuestions');
    const btnSubmitForm = document.getElementById('btnSubmitForm');

    // Seleção de Categoria na Etapa 1
    categoryCards.forEach(card => {
      card.addEventListener('click', () => {
        categoryCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        selectedCategory = card.getAttribute('data-category-choice');
        
        blockGrafico.style.display = (selectedCategory === 'grafico') ? 'block' : 'none';
        blockAudiovisual.style.display = (selectedCategory === 'audiovisual') ? 'block' : 'none';
        blockInterface.style.display = (selectedCategory === 'interface') ? 'block' : 'none';

        goToStep(2);
      });
    });

    if (btnBackToCategory) {
      btnBackToCategory.addEventListener('click', () => goToStep(1));
    }
    if (btnGoToCommon) {
      btnGoToCommon.addEventListener('click', () => goToStep(3));
    }
    if (btnBackToQuestions) {
      btnBackToQuestions.addEventListener('click', () => goToStep(2));
    }

    function goToStep(step) {
      currentStep = step;

      stepCategory.style.display = (step === 1) ? 'block' : 'none';
      stepQuestions.style.display = (step === 2) ? 'block' : 'none';
      stepCommon.style.display = (step === 3) ? 'block' : 'none';

      const percent = Math.round((step / 3) * 100);
      if (stepCounterText) stepCounterText.textContent = `ETAPA ${step} DE 3`;
      if (stepPercentText) stepPercentText.textContent = `${percent}%`;
      if (progressBarFill) progressBarFill.style.width = `${percent}%`;

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Envio do formulário (gravação sem leitura)
    if (btnSubmitForm) {
      btnSubmitForm.addEventListener('click', async () => {
        const clientNome = document.getElementById('client_nome')?.value.trim();
        const clientContato = document.getElementById('client_contato')?.value.trim();
        const clientPrazo = document.getElementById('client_prazo')?.value.trim();
        const clientOrcamento = document.getElementById('client_orcamento')?.value.trim() || '';

        if (!clientNome || !clientContato || !clientPrazo) {
          alert("Por favor, preencha os campos obrigatórios de nome, contato e prazo antes de enviar.");
          return;
        }

        // Limpar mensagens de erro prévias
        const oldError = document.getElementById('formSubmissionError');
        if (oldError) oldError.remove();

        btnSubmitForm.disabled = true;
        btnSubmitForm.textContent = 'REGISTRANDO NO SISTEMA...';

        try {
          let title = '';
          let htmlBody = '';
          const respostasPorCampo = {
            nome: clientNome,
            contato: clientContato,
            prazo: clientPrazo,
            orcamento: clientOrcamento
          };

          htmlBody += `
            <h2>DADOS DO CLIENTE E CONTATO</h2>
            <p><strong>Nome / Empresa:</strong> ${escapeHtml(clientNome)}</p>
            <p><strong>Contato (Email / WhatsApp):</strong> ${escapeHtml(clientContato)}</p>
            <p><strong>Prazo Desejado:</strong> ${escapeHtml(clientPrazo)}</p>
            <p><strong>Orçamento Estimado:</strong> ${clientOrcamento ? escapeHtml(clientOrcamento) : 'Não informado'}</p>
          `;

          // 1. IDENTIDADE VISUAL
          if (selectedCategory === 'grafico') {
            const nomeMarca = document.getElementById('gv_nome')?.value.trim() || clientNome;
            title = `Briefing Identidade Visual: ${nomeMarca}`;

            const area = document.getElementById('gv_area')?.value.trim() || '';
            const publico = document.getElementById('gv_publico')?.value.trim() || '';
            const matPrev = document.querySelector('input[name="gv_material_previo"]:checked')?.value || 'nao';
            const matLink = document.getElementById('gv_material_link')?.value.trim() || '';
            const refGosta = document.getElementById('gv_ref_gosta')?.value.trim() || '';
            const refOdeia = document.getElementById('gv_ref_odeia')?.value.trim() || '';

            const apps = Array.from(document.querySelectorAll('input[name="gv_app"]:checked')).map(c => c.value);
            const outroTxt = document.getElementById('gv_app_outro_txt')?.value.trim();
            if (apps.includes('Outro') && outroTxt) {
              apps.push(`Outro (${outroTxt})`);
            }

            const idCoresGostaTexto = document.getElementById('id_cores_gosta_texto')?.value.trim() || '';
            const idCoresNaoQuerTexto = document.getElementById('id_cores_nao_quer_texto')?.value.trim() || '';

            const scale1 = document.querySelector('input[name="scale_gv_1"]:checked')?.value || '3';
            const scale2 = document.querySelector('input[name="scale_gv_2"]:checked')?.value || '3';
            const scale3 = document.querySelector('input[name="scale_gv_3"]:checked')?.value || '3';
            const scale4 = document.querySelector('input[name="scale_gv_4"]:checked')?.value || '3';

            respostasPorCampo.nomeMarca = nomeMarca;
            respostasPorCampo.area = area;
            respostasPorCampo.publico = publico;
            respostasPorCampo.materialPrevio = matPrev;
            respostasPorCampo.materialLink = matLink;
            respostasPorCampo.refGosta = refGosta;
            respostasPorCampo.refOdeia = refOdeia;
            respostasPorCampo.aplicacoes = apps;
            respostasPorCampo.coresGosta = [...colorArrays.id_cores_gosta];
            respostasPorCampo.coresGostaTexto = idCoresGostaTexto;
            respostasPorCampo.coresNaoQuer = [...colorArrays.id_cores_nao_quer];
            respostasPorCampo.coresNaoQuerTexto = idCoresNaoQuerTexto;
            respostasPorCampo.personalidade = {
              minimalista_rico: scale1,
              classico_moderno: scale2,
              sobrio_vibrante: scale3,
              delicado_robusto: scale4
            };

            const idCoresGostaHtml = colorArrays.id_cores_gosta.map(hex => 
              `<span style="display:inline-block; vertical-align:middle; width:14px; height:14px; border-radius:3px; background-color:${hex}; border:1px solid #5A554C; margin-right:4px;"></span><code>${hex}</code>`
            ).join(' ') || 'Nenhuma cor selecionada';

            const idCoresNaoQuerHtml = colorArrays.id_cores_nao_quer.map(hex => 
              `<span style="display:inline-block; vertical-align:middle; width:14px; height:14px; border-radius:3px; background-color:${hex}; border:1px solid #5A554C; margin-right:4px;"></span><code>${hex}</code>`
            ).join(' ') || 'Nenhuma cor selecionada';

            htmlBody += `
              <h2>DETALHES DA MARCA E ESTÉTICA</h2>
              <p><strong>Nome da Marca:</strong> ${escapeHtml(nomeMarca)}</p>
              <p><strong>Área de Atuação:</strong> ${escapeHtml(area)}</p>
              <p><strong>Público-Alvo:</strong> ${escapeHtml(publico)}</p>
              <p><strong>Material Prévio:</strong> ${matPrev === 'sim' ? 'Sim (' + escapeHtml(matLink) + ')' : 'Não, começando do zero'}</p>
              <p><strong>Referências que Gosta:</strong> ${escapeHtml(refGosta) || 'Nenhuma informada'}</p>
              <p><strong>O que Definitivamente Não Quer:</strong> ${escapeHtml(refOdeia) || 'Nenhum item informado'}</p>
              <p><strong>Aplicações Desejadas:</strong> ${apps.length ? escapeHtml(apps.join(', ')) : 'Não informado'}</p>
              
              <h2>DIREÇÃO DE CORES</h2>
              <p><strong>Cores que Gosta:</strong> ${idCoresGostaHtml} ${idCoresGostaTexto ? '(' + escapeHtml(idCoresGostaTexto) + ')' : ''}</p>
              <p><strong>Cores a Evitar:</strong> ${idCoresNaoQuerHtml} ${idCoresNaoQuerTexto ? '(' + escapeHtml(idCoresNaoQuerTexto) + ')' : ''}</p>

              <h2>PERSONALIDADE DA MARCA (1 A 5)</h2>
              <ul>
                <li>Minimalista (1) &bull; Rico em Elementos (5): <strong>${scale1} / 5</strong></li>
                <li>Clássico (1) &bull; Moderno (5): <strong>${scale2} / 5</strong></li>
                <li>Sóbrio (1) &bull; Vibrante (5): <strong>${scale3} / 5</strong></li>
                <li>Delicado (1) &bull; Robusto (5): <strong>${scale4} / 5</strong></li>
              </ul>
            `;
          }

          // 2. AUDIOVISUAL
          else if (selectedCategory === 'audiovisual') {
            title = `Briefing Audiovisual: ${clientNome}`;

            const tipoVideo = document.getElementById('av_tipo')?.value.trim() || '';
            const duracao = document.getElementById('av_duracao')?.value.trim() || '';
            const objetivo = document.getElementById('av_objetivo')?.value.trim() || '';
            const roteiro = document.querySelector('input[name="av_roteiro"]:checked')?.value || 'nao';
            const roteiroLink = document.getElementById('av_roteiro_link')?.value.trim() || '';
            const locucao = document.querySelector('input[name="av_locucao"]:checked')?.value || 'sem_locucao';
            const trilha = document.querySelector('input[name="av_trilha"]:checked')?.value || 'livre_royalties';
            const ref = document.getElementById('av_ref')?.value.trim() || '';
            const formato = document.querySelector('input[name="av_formato"]:checked')?.value || 'horizontal';

            const scale1 = document.querySelector('input[name="scale_av_1"]:checked')?.value || '3';
            const scale2 = document.querySelector('input[name="scale_av_2"]:checked')?.value || '3';
            const scale3 = document.querySelector('input[name="scale_av_3"]:checked')?.value || '3';
            const scale4 = document.querySelector('input[name="scale_av_4"]:checked')?.value || '3';

            respostasPorCampo.tipoVideo = tipoVideo;
            respostasPorCampo.duracao = duracao;
            respostasPorCampo.objetivo = objetivo;
            respostasPorCampo.roteiro = roteiro;
            respostasPorCampo.roteiroLink = roteiroLink;
            respostasPorCampo.locucao = locucao;
            respostasPorCampo.trilha = trilha;
            respostasPorCampo.referencias = ref;
            respostasPorCampo.formato = formato;
            respostasPorCampo.ritmo = {
              lento_dinamico: scale1,
              linear_fragmentado: scale2,
              sobrio_impactante: scale3,
              discreto_cinematografico: scale4
            };

            htmlBody += `
              <h2>DIRETRIZES DA PRODUÇÃO AUDIOVISUAL</h2>
              <p><strong>Tipo de Vídeo:</strong> ${escapeHtml(tipoVideo)}</p>
              <p><strong>Duração Estimada:</strong> ${escapeHtml(duracao)}</p>
              <p><strong>Objetivo Principal:</strong> ${escapeHtml(objetivo)}</p>
              <p><strong>Roteiro / Decupagem:</strong> ${roteiro === 'sim' ? 'Sim (' + escapeHtml(roteiroLink) + ')' : 'Não, a desenvolver'}</p>
              <p><strong>Locução:</strong> ${escapeHtml(locucao)}</p>
              <p><strong>Trilha Sonora:</strong> ${escapeHtml(trilha)}</p>
              <p><strong>Referências Visuais:</strong> ${escapeHtml(ref) || 'Nenhuma informada'}</p>
              <p><strong>Formato de Exibição:</strong> ${escapeHtml(formato)}</p>

              <h2>RITMO E LINGUAGEM DE MONTAGEM (1 A 5)</h2>
              <ul>
                <li>Lento / Contemplativo (1) &bull; Rápido / Dinâmico (5): <strong>${scale1} / 5</strong></li>
                <li>Linear (1) &bull; Fragmentado (5): <strong>${scale2} / 5</strong></li>
                <li>Sóbrio (1) &bull; Impactante / Efeitos (5): <strong>${scale3} / 5</strong></li>
                <li>Discreto (1) &bull; Cinematográfico (5): <strong>${scale4} / 5</strong></li>
              </ul>
            `;
          }

          // 3. INTERFACE (UX/UI)
          else if (selectedCategory === 'interface') {
            title = `Briefing Interface: ${clientNome}`;

            const tipoProj = document.getElementById('ui_tipo')?.value.trim() || '';
            const plataforma = document.querySelector('input[name="ui_plataforma"]:checked')?.value || 'web';
            const funcs = document.getElementById('ui_funcs')?.value.trim() || '';
            const publico = document.getElementById('ui_publico')?.value.trim() || '';
            const idPrev = document.querySelector('input[name="ui_id_prev"]:checked')?.value || 'nao';
            const idLink = document.getElementById('ui_id_link')?.value.trim() || '';
            const ref = document.getElementById('ui_ref')?.value.trim() || '';
            const complexidade = document.querySelector('input[name="ui_complex"]:checked')?.value || 'Poucas telas';

            const uiCoresGostaTexto = document.getElementById('ui_cores_gosta_texto')?.value.trim() || '';
            const uiCoresNaoQuerTexto = document.getElementById('ui_cores_nao_quer_texto')?.value.trim() || '';

            const uiCoresGostaHtml = colorArrays.ui_cores_gosta.map(hex => 
              `<span style="display:inline-block; vertical-align:middle; width:14px; height:14px; border-radius:3px; background-color:${hex}; border:1px solid #5A554C; margin-right:4px;"></span><code>${hex}</code>`
            ).join(' ') || 'Nenhuma cor selecionada';

            const uiCoresNaoQuerHtml = colorArrays.ui_cores_nao_quer.map(hex => 
              `<span style="display:inline-block; vertical-align:middle; width:14px; height:14px; border-radius:3px; background-color:${hex}; border:1px solid #5A554C; margin-right:4px;"></span><code>${hex}</code>`
            ).join(' ') || 'Nenhuma cor selecionada';

            const scale1 = document.querySelector('input[name="scale_ui_1"]:checked')?.value || '3';
            const scale2 = document.querySelector('input[name="scale_ui_2"]:checked')?.value || '3';
            const scale3 = document.querySelector('input[name="scale_ui_3"]:checked')?.value || '3';
            const scale4 = document.querySelector('input[name="scale_ui_4"]:checked')?.value || '3';

            respostasPorCampo.tipoProjeto = tipoProj;
            respostasPorCampo.plataforma = plataforma;
            respostasPorCampo.funcionalidades = funcs;
            respostasPorCampo.publico = publico;
            respostasPorCampo.idPrevia = idPrev;
            respostasPorCampo.idLink = idLink;
            respostasPorCampo.referencias = ref;
            respostasPorCampo.complexidade = complexidade;
            respostasPorCampo.coresGosta = [...colorArrays.ui_cores_gosta];
            respostasPorCampo.coresGostaTexto = uiCoresGostaTexto;
            respostasPorCampo.coresNaoQuer = [...colorArrays.ui_cores_nao_quer];
            respostasPorCampo.coresNaoQuerTexto = uiCoresNaoQuerTexto;
            respostasPorCampo.personalidade = {
              minimalista_rico: scale1,
              serio_ludico: scale2,
              formal_descontraido: scale3,
              denso_espacoso: scale4
            };

            htmlBody += `
              <h2>ESPECIFICAÇÕES DO SISTEMA / INTERFACE</h2>
              <p><strong>Tipo de Projeto:</strong> ${escapeHtml(tipoProj)}</p>
              <p><strong>Plataforma Alvo:</strong> ${escapeHtml(plataforma)}</p>
              <p><strong>Funcionalidades Principais:</strong> ${escapeHtml(funcs)}</p>
              <p><strong>Público-Alvo / Usuário:</strong> ${escapeHtml(publico)}</p>
              <p><strong>Identidade Visual Anterior:</strong> ${idPrev === 'sim' ? 'Sim (' + escapeHtml(idLink) + ')' : 'Não, a definir'}</p>
              <p><strong>Referências de Interface:</strong> ${escapeHtml(ref) || 'Nenhuma informada'}</p>
              <p><strong>Nível de Complexidade:</strong> ${escapeHtml(complexidade)}</p>
              
              <h2>DIREÇÃO DE CORES</h2>
              <p><strong>Cores que Gosta:</strong> ${uiCoresGostaHtml} ${uiCoresGostaTexto ? '(' + escapeHtml(uiCoresGostaTexto) + ')' : ''}</p>
              <p><strong>Cores a Evitar:</strong> ${uiCoresNaoQuerHtml} ${uiCoresNaoQuerTexto ? '(' + escapeHtml(uiCoresNaoQuerTexto) + ')' : ''}</p>

              <h2>PERSONALIDADE DA INTERFACE (1 A 5)</h2>
              <ul>
                <li>Minimalista (1) &bull; Rico em Elementos (5): <strong>${scale1} / 5</strong></li>
                <li>Sério (1) &bull; Lúdico (5): <strong>${scale2} / 5</strong></li>
                <li>Formal (1) &bull; Descontraído (5): <strong>${scale3} / 5</strong></li>
                <li>Denso (1) &bull; Espaçoso (5): <strong>${scale4} / 5</strong></li>
              </ul>
            `;
          }

          // Documento gravado na coleção "briefings" com addDoc e serverTimestamp
          const briefingDoc = {
            categoria: selectedCategory,
            titulo: title,
            clienteNome: clientNome,
            clienteContato: clientContato,
            prazo: clientPrazo,
            orcamento: clientOrcamento || 'A definir',
            respostas: respostasPorCampo,
            conteudo: htmlBody,
            criadoEm: serverTimestamp()
          };

          // Gravação direta no Firestore (sem leituras)
          await addDoc(collection(db, "briefings"), briefingDoc);

          // Mostra confirmação ao terminar
          if (progressContainer) progressContainer.style.display = 'none';
          if (stepCategory) stepCategory.style.display = 'none';
          if (stepQuestions) stepQuestions.style.display = 'none';
          if (stepCommon) stepCommon.style.display = 'none';

          if (stepConfirmation) {
            stepConfirmation.style.display = 'block';
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
          console.error("Erro ao gravar briefing no Firestore:", err);
          btnSubmitForm.disabled = false;
          btnSubmitForm.textContent = 'REGISTRAR DOSSIÊ AGORA \u2192';

          const errorBox = document.createElement('div');
          errorBox.id = 'formSubmissionError';
          errorBox.className = 'feedback-msg feedback-error';
          errorBox.style.display = 'block';
          errorBox.style.marginTop = '1.5rem';
          errorBox.innerHTML = `
            <strong>Não foi possível registrar o briefing no sistema:</strong><br>
            ${escapeHtml(err.message)}<br>
            <span style="font-size: 0.85rem; color: #1A1510;">Por favor, verifique a sua conexão com a internet ou tente novamente em instantes.</span>
          `;

          stepCommon.appendChild(errorBox);
          errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  }

  /* ==========================================================================
     UTILITÁRIOS AUXILIARES DE FORMATAÇÃO
     ========================================================================== */
  function formatTimestamp(ts) {
    if (!ts) return '--/--/----';
    let date;
    if (typeof ts.toDate === 'function') {
      date = ts.toDate();
    } else if (ts instanceof Date) {
      date = ts;
    } else if (typeof ts === 'string') {
      const parts = ts.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return ts;
    } else if (ts.seconds) {
      date = new Date(ts.seconds * 1000);
    } else {
      return '--/--/----';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} às ${hours}:${mins}`;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

});
