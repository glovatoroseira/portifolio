/**
 * G. LOVATO ROSEIRA - SEÇÃO DE BRIEFINGS
 * Lógica de Autenticação, Firestore CRUD, Filtros, Impressão PDF e Formulário do Cliente
 */

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

  // Obter tema salvo
  const currentTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = (activeTheme === 'dark') ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  const currentPage = document.body.getAttribute('data-page') || '';
  
  // Controle de Sessão Demonstrativa / Fallback Local
  const DEMO_AUTH_KEY = 'lovato_briefings_auth_session';
  
  function setDemoSession(userEmail) {
    localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify({ email: userEmail, loggedInAt: Date.now() }));
  }

  function getDemoSession() {
    const session = localStorage.getItem(DEMO_AUTH_KEY);
    return session ? JSON.parse(session) : null;
  }

  function clearDemoSession() {
    localStorage.removeItem(DEMO_AUTH_KEY);
  }

  // Função utilitária para campos condicionais
  window.toggleConditional = function(elementId, show) {
    const el = document.getElementById(elementId);
    if (el) {
      if (show) el.classList.add('active');
      else el.classList.remove('active');
    }
  };

  /* ==========================================================================
     GERENCIAMENTO DE CHIPS DE COR DO DOSSIÊ
     ========================================================================== */
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

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!email || !password) return;

      if (auth && isFirebaseConfigured) {
        try {
          await auth.signInWithEmailAndPassword(email, password);
          window.location.href = 'painel.html';
        } catch (err) {
          loginFeedback.style.display = 'block';
          loginFeedback.textContent = 'Erro ao realizar login: Credenciais inválidas ou e-mail não cadastrado.';
        }
      } else {
        if (password.length >= 4) {
          setDemoSession(email);
          window.location.href = 'painel.html';
        } else {
          loginFeedback.style.display = 'block';
          loginFeedback.textContent = 'Por favor, informe uma senha com pelo menos 4 caracteres para o login de teste.';
        }
      }
    });
  }

  /* ==========================================================================
     2. PÁGINA DE PAINEL (painel.html)
     ========================================================================== */
  if (currentPage === 'painel') {
    const userEmailTag = document.getElementById('userEmailTag');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const briefingsTableBody = document.getElementById('briefingsTableBody');

    const newBriefingBtn = document.getElementById('newBriefingBtn');
    const briefingModal = document.getElementById('briefingModal');
    const modalCloseX = document.getElementById('modalCloseX');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const briefingForm = document.getElementById('briefingForm');
    const modalTitleText = document.getElementById('modalTitleText');
    const briefingIdInput = document.getElementById('briefingIdInput');

    function checkAuth() {
      if (auth && isFirebaseConfigured) {
        auth.onAuthStateChanged((user) => {
          if (user) {
            userEmailTag.textContent = user.email;
            fetchAndRenderBriefings();
          } else {
            window.location.href = 'login.html';
          }
        });
      } else {
        const demoSession = getDemoSession();
        if (demoSession) {
          userEmailTag.textContent = demoSession.email;
          fetchAndRenderBriefings();
        } else {
          window.location.href = 'login.html';
        }
      }
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (auth && isFirebaseConfigured) {
          auth.signOut().then(() => { window.location.href = 'login.html'; });
        } else {
          clearDemoSession();
          window.location.href = 'login.html';
        }
      });
    }

    let currentBriefings = [];

    async function fetchAndRenderBriefings() {
      if (db && isFirebaseConfigured) {
        try {
          const snapshot = await db.collection("briefings").orderBy("createdAt", "desc").get();
          currentBriefings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (err) {
          console.warn("Erro ao buscar briefings do Firestore, recorrendo ao banco local:", err);
          currentBriefings = getLocalBriefings();
        }
      } else {
        currentBriefings = getLocalBriefings();
      }
      renderTable();
    }

    function renderTable() {
      const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const selectedCat = categoryFilter ? categoryFilter.value : 'todos';

      const filtered = currentBriefings.filter(item => {
        const titleMatch = (item.titulo || '').toLowerCase().includes(searchTerm);
        const catMatch = (selectedCat === 'todos') || (item.categoria === selectedCat);
        return titleMatch && catMatch;
      });

      if (filtered.length === 0) {
        briefingsTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">
              Nenhum briefing encontrado para os critérios de busca selecionados.
            </td>
          </tr>
        `;
        return;
      }

      const catLabels = {
        interface: 'Interface (UX/UI)',
        audiovisual: 'Audiovisual',
        grafico: 'Identidade Visual'
      };

      briefingsTableBody.innerHTML = filtered.map(item => `
        <tr>
          <td>
            <a href="detalhe.html?id=${item.id}" class="table-title" style="text-decoration: underline;">
              ${escapeHtml(item.titulo)}
            </a>
          </td>
          <td>
            <span class="doc-category-badge" style="font-size: 0.7rem; padding: 0.15rem 0.4rem;">
              ${catLabels[item.categoria] || item.categoria || 'Geral'}
            </span>
          </td>
          <td>${formatDate(item.createdAt)}</td>
          <td>
            <div class="table-actions">
              <a href="detalhe.html?id=${item.id}" class="btn-doc btn-doc-ghost" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">
                VER / PDF
              </a>
              <button onclick="editBriefing('${item.id}')" class="btn-doc btn-doc-ghost" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">
                EDITAR
              </button>
              <button onclick="deleteBriefingItem('${item.id}')" class="btn-doc btn-doc-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">
                EXCLUIR
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    if (searchInput) searchInput.addEventListener('input', renderTable);
    if (categoryFilter) categoryFilter.addEventListener('change', renderTable);

    function openModal(isEdit = false) {
      modalTitleText.textContent = isEdit ? 'EDITAR BRIEFING' : 'NOVO BRIEFING';
      briefingModal.classList.add('active');
    }

    function closeModal() {
      briefingModal.classList.remove('active');
      briefingForm.reset();
      briefingIdInput.value = '';
    }

    if (newBriefingBtn) {
      newBriefingBtn.addEventListener('click', () => {
        briefingForm.reset();
        briefingIdInput.value = '';
        document.getElementById('formDate').value = new Date().toISOString().split('T')[0];
        openModal(false);
      });
    }

    if (modalCloseX) modalCloseX.addEventListener('click', closeModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);

    if (briefingForm) {
      briefingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = briefingIdInput.value;
        const briefingData = {
          titulo: document.getElementById('formTitle').value.trim(),
          categoria: document.getElementById('formCategory').value,
          createdAt: document.getElementById('formDate').value || new Date().toISOString().split('T')[0],
          linkMaterial: document.getElementById('formMaterial').value.trim(),
          conteudo: document.getElementById('formContent').value.trim(),
          pdfFlag: true
        };

        if (db && isFirebaseConfigured) {
          try {
            if (id) {
              await db.collection("briefings").doc(id).update(briefingData);
            } else {
              await db.collection("briefings").add(briefingData);
            }
          } catch (err) {
            console.warn("Erro no Firestore, salvando localmente:", err);
            briefingData.id = id;
            saveLocalBriefing(briefingData);
          }
        } else {
          briefingData.id = id;
          saveLocalBriefing(briefingData);
        }

        closeModal();
        fetchAndRenderBriefings();
      });
    }

    window.editBriefing = (id) => {
      const item = currentBriefings.find(b => b.id === id);
      if (!item) return;

      briefingIdInput.value = item.id;
      document.getElementById('formTitle').value = item.titulo || '';
      document.getElementById('formCategory').value = item.categoria || 'interface';
      document.getElementById('formDate').value = item.createdAt || new Date().toISOString().split('T')[0];
      document.getElementById('formMaterial').value = item.linkMaterial || '';
      document.getElementById('formContent').value = item.conteudo || '';

      openModal(true);
    };

    window.deleteBriefingItem = async (id) => {
      if (confirm("Tem certeza de que deseja excluir este briefing do sistema?")) {
        if (db && isFirebaseConfigured) {
          try {
            await db.collection("briefings").doc(id).delete();
          } catch (err) {
            deleteLocalBriefing(id);
          }
        } else {
          deleteLocalBriefing(id);
        }
        fetchAndRenderBriefings();
      }
    };

    checkAuth();
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

    const urlParams = new URLSearchParams(window.location.search);
    const briefingId = urlParams.get('id');

    async function loadBriefingDetail() {
      if (!briefingId) {
        docTitle.textContent = "Briefing não especificado.";
        docContent.innerHTML = "<p>Por favor, selecione um briefing a partir do painel administrativo.</p>";
        return;
      }

      let data = null;

      if (db && isFirebaseConfigured) {
        try {
          const doc = await db.collection("briefings").doc(briefingId).get();
          if (doc.exists) {
            data = { id: doc.id, ...doc.data() };
          }
        } catch (err) {
          console.warn("Erro ao carregar do Firestore:", err);
        }
      }

      if (!data) {
        const localItems = getLocalBriefings();
        data = localItems.find(i => i.id === briefingId);
      }

      if (!data) {
        docTitle.textContent = "Briefing não encontrado";
        docContent.innerHTML = "<p>O documento solicitado não consta no banco de dados.</p>";
        return;
      }

      const catLabels = {
        interface: 'DESIGN DE INTERFACE (UX/UI)',
        audiovisual: 'AUDIOVISUAL & MOTION',
        grafico: 'IDENTIDADE VISUAL'
      };

      docTitle.textContent = data.titulo || 'Sem título';
      docCategoryBadge.textContent = catLabels[data.categoria] || (data.categoria ? data.categoria.toUpperCase() : 'DOCUMENTO DE BRIEFING');
      docDate.textContent = formatDate(data.createdAt);
      docId.textContent = '#' + (data.id || '---');

      if (data.conteudo.includes('<h') || data.conteudo.includes('<p>')) {
        docContent.innerHTML = data.conteudo;
      } else {
        docContent.innerHTML = data.conteudo.split('\n\n').map(p => `<p>${escapeHtml(p)}</p>`).join('');
      }

      if (data.linkMaterial) {
        docMaterialsBox.style.display = 'block';
        docMaterialsLink.href = data.linkMaterial;
        docMaterialsLink.textContent = data.linkMaterial;
      } else {
        docMaterialsBox.style.display = 'none';
      }
    }

    loadBriefingDetail();
  }

  /* ==========================================================================
     4. FORMULÁRIO DO CLIENTE (formulario.html / /briefing/formulario/)
     ========================================================================== */
  if (currentPage === 'formulario') {
    let selectedCategory = '';
    let currentStep = 1; // 1: Categoria, 2: Perguntas Específicas, 3: Contato & Envio

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
        
        // Exibir o bloco de perguntas correto
        blockGrafico.style.display = (selectedCategory === 'grafico') ? 'block' : 'none';
        blockAudiovisual.style.display = (selectedCategory === 'audiovisual') ? 'block' : 'none';
        blockInterface.style.display = (selectedCategory === 'interface') ? 'block' : 'none';

        // Avançar para a Etapa 2
        goToStep(2);
      });
    });

    // Navegação entre passos
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

      // Atualizar progresso
      const percent = Math.round((step / 3) * 100);
      stepCounterText.textContent = `ETAPA ${step} DE 3`;
      stepPercentText.textContent = `${percent}%`;
      progressBarFill.style.width = `${percent}%`;

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Envio do formulário do cliente
    if (btnSubmitForm) {
      btnSubmitForm.addEventListener('click', async () => {
        const clientNome = document.getElementById('client_nome').value.trim();
        const clientContato = document.getElementById('client_contato').value.trim();
        const clientPrazo = document.getElementById('client_prazo').value.trim();
        const clientOrcamento = document.getElementById('client_orcamento').value.trim();

        if (!clientNome || !clientContato || !clientPrazo) {
          alert("Por favor, preencha os campos obrigatórios de nome, contato e prazo antes de enviar.");
          return;
        }

        // Formatação estruturada em HTML das respostas da categoria
        let title = '';
        let htmlBody = '';
        const todayStr = new Date().toISOString().split('T')[0];

        // Montar cabeçalho com dados de contato comuns
        htmlBody += `
          <h2>DADOS DO CLIENTE E CONTATO</h2>
          <p><strong>Nome / Empresa:</strong> ${escapeHtml(clientNome)}</p>
          <p><strong>Contato (Email / WhatsApp):</strong> ${escapeHtml(clientContato)}</p>
          <p><strong>Prazo Desejado:</strong> ${escapeHtml(clientPrazo)}</p>
          <p><strong>Orçamento Estimado:</strong> ${clientOrcamento ? escapeHtml(clientOrcamento) : 'Não informado'}</p>
        `;

        // 1. CATEGORIA: IDENTIDADE VISUAL
        if (selectedCategory === 'grafico') {
          const nomeMarca = document.getElementById('gv_nome').value.trim() || clientNome;
          title = `Briefing Identidade Visual: ${nomeMarca}`;

          const area = document.getElementById('gv_area').value.trim();
          const publico = document.getElementById('gv_publico').value.trim();
          const matPrev = document.querySelector('input[name="gv_material_previo"]:checked')?.value;
          const matLink = document.getElementById('gv_material_link').value.trim();
          const refGosta = document.getElementById('gv_ref_gosta').value.trim();
          const refOdeia = document.getElementById('gv_ref_odeia').value.trim();

          const apps = Array.from(document.querySelectorAll('input[name="gv_app"]:checked')).map(c => c.value);
          if (apps.includes('Outro')) {
            const outroTxt = document.getElementById('gv_app_outro_txt').value.trim();
            if (outroTxt) apps.push(`Outro (${outroTxt})`);
          }

          // Cores Identidade Visual
          const idCoresGostaTexto = document.getElementById('id_cores_gosta_texto')?.value.trim() || '';
          const idCoresNaoQuerTexto = document.getElementById('id_cores_nao_quer_texto')?.value.trim() || '';

          const coresGostaHtml = colorArrays.id_cores_gosta.map(hex => 
            `<span style="display:inline-block; vertical-align:middle; width:14px; height:14px; border-radius:3px; background-color:${hex}; border:1px solid #5A554C; margin-right:4px;"></span><code>${hex}</code>`
          ).join(' ') || 'Nenhuma cor selecionada';

          const coresNaoQuerHtml = colorArrays.id_cores_nao_quer.map(hex => 
            `<span style="display:inline-block; vertical-align:middle; width:14px; height:14px; border-radius:3px; background-color:${hex}; border:1px solid #5A554C; margin-right:4px;"></span><code>${hex}</code>`
          ).join(' ') || 'Nenhuma cor selecionada';

          const scale1 = document.querySelector('input[name="scale_gv_1"]:checked')?.value || '3';
          const scale2 = document.querySelector('input[name="scale_gv_2"]:checked')?.value || '3';
          const scale3 = document.querySelector('input[name="scale_gv_3"]:checked')?.value || '3';
          const scale4 = document.querySelector('input[name="scale_gv_4"]:checked')?.value || '3';
          const scale5 = document.querySelector('input[name="scale_gv_5"]:checked')?.value || '3';

          htmlBody += `
            <h2>ESPECIFICAÇÕES DA IDENTIDADE VISUAL</h2>
            <p><strong>Área de Atuação:</strong> ${escapeHtml(area)}</p>
            <p><strong>Público-Alvo:</strong> ${escapeHtml(publico)}</p>
            <p><strong>Material Existente:</strong> ${matPrev === 'sim' ? 'Sim (' + escapeHtml(matLink) + ')' : 'Não, projeto do zero'}</p>
            <p><strong>Referências que Gosta:</strong> ${escapeHtml(refGosta) || 'Nenhuma informada'}</p>
            <p><strong>Referências a Evitar:</strong> ${escapeHtml(refOdeia) || 'Nenhuma informada'}</p>
            <p><strong>Aplicações Solicitadas:</strong> ${apps.length ? apps.join(', ') : 'Não especificado'}</p>
            
            <h2>DIREÇÃO DE CORES</h2>
            <p><strong>Cores que Gosta:</strong> ${coresGostaHtml} ${idCoresGostaTexto ? '(' + escapeHtml(idCoresGostaTexto) + ')' : ''}</p>
            <p><strong>Cores a Evitar:</strong> ${coresNaoQuerHtml} ${idCoresNaoQuerTexto ? '(' + escapeHtml(idCoresNaoQuerTexto) + ')' : ''}</p>

            <h2>PERSONALIDADE DA MARCA (1 A 5)</h2>
            <ul>
              <li>Clássico (1) &bull; Moderno (5): <strong>${scale1} / 5</strong></li>
              <li>Sério (1) &bull; Descontraído (5): <strong>${scale2} / 5</strong></li>
              <li>Minimalista (1) &bull; Elaborado (5): <strong>${scale3} / 5</strong></li>
              <li>Discreto (1) &bull; Ousado (5): <strong>${scale4} / 5</strong></li>
              <li>Tradicional (1) &bull; Inovador (5): <strong>${scale5} / 5</strong></li>
            </ul>
          `;
        }

        // 2. CATEGORIA: PRODUÇÃO AUDIOVISUAL
        else if (selectedCategory === 'audiovisual') {
          title = `Briefing Audiovisual: ${clientNome}`;

          const tipoPeca = document.querySelector('input[name="av_tipo"]:checked')?.value || 'Institucional';
          const duracao = document.querySelector('input[name="av_duracao"]:checked')?.value || '1 a 3 min';
          const objetivo = document.getElementById('av_objetivo').value.trim();
          const publico = document.getElementById('av_publico').value.trim();
          const ref = document.getElementById('av_ref').value.trim();
          const roteiro = document.querySelector('input[name="av_roteiro"]:checked')?.value;
          const recursos = Array.from(document.querySelectorAll('input[name="av_recursos"]:checked')).map(c => c.value);
          const trilha = document.querySelector('input[name="av_trilha"]:checked')?.value;

          const scale1 = document.querySelector('input[name="scale_av_1"]:checked')?.value || '3';
          const scale2 = document.querySelector('input[name="scale_av_2"]:checked')?.value || '3';
          const scale3 = document.querySelector('input[name="scale_av_3"]:checked')?.value || '3';
          const scale4 = document.querySelector('input[name="scale_av_4"]:checked')?.value || '3';

          htmlBody += `
            <h2>ESPECIFICAÇÕES DO VÍDEO</h2>
            <p><strong>Tipo de Peça:</strong> ${escapeHtml(tipoPeca)}</p>
            <p><strong>Duração Estimada:</strong> ${escapeHtml(duracao)}</p>
            <p><strong>Objetivo do Vídeo:</strong> ${escapeHtml(objetivo)}</p>
            <p><strong>Público-Alvo:</strong> ${escapeHtml(publico)}</p>
            <p><strong>Referências:</strong> ${escapeHtml(ref) || 'Nenhuma informada'}</p>
            <p><strong>Situação do Roteiro:</strong> ${escapeHtml(roteiro)}</p>
            <p><strong>Recursos Disponíveis:</strong> ${recursos.length ? recursos.join(', ') : 'Nenhum'}</p>
            <p><strong>Trilha Sonora:</strong> ${escapeHtml(trilha)}</p>
            
            <h2>TOM E ATMOSFERA DESEJADA (1 A 5)</h2>
            <ul>
              <li>Sério (1) &bull; Divertido (5): <strong>${scale1} / 5</strong></li>
              <li>Realista (1) &bull; Estilizado (5): <strong>${scale2} / 5</strong></li>
              <li>Calmo (1) &bull; Dinâmico (5): <strong>${scale3} / 5</strong></li>
              <li>Sombrio (1) &bull; Luminoso (5): <strong>${scale4} / 5</strong></li>
            </ul>
          `;
        }

        // 3. CATEGORIA: INTERFACE (UI/UX)
        else if (selectedCategory === 'interface') {
          title = `Briefing Interface: ${clientNome}`;

          const tipoProj = document.querySelector('input[name="ui_tipo"]:checked')?.value || 'Site';
          const plataforma = document.querySelector('input[name="ui_plat"]:checked')?.value || 'Ambos';
          const funcs = document.getElementById('ui_funcs').value.trim();
          const publico = document.getElementById('ui_publico').value.trim();
          const idPrev = document.querySelector('input[name="ui_id_prev"]:checked')?.value;
          const idLink = document.getElementById('ui_id_link').value.trim();
          const ref = document.getElementById('ui_ref').value.trim();
          const complexidade = document.querySelector('input[name="ui_complex"]:checked')?.value || 'Poucas telas';

          // Cores Interface
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

        const newBriefingDoc = {
          titulo: title,
          categoria: selectedCategory,
          createdAt: todayStr,
          origem: 'Formulário do Cliente',
          linkMaterial: '',
          conteudo: htmlBody,
          pdfFlag: true
        };

        if (selectedCategory === 'grafico') {
          newBriefingDoc.id_cores_gosta = colorArrays.id_cores_gosta;
          newBriefingDoc.id_cores_nao_quer = colorArrays.id_cores_nao_quer;
          newBriefingDoc.id_cores_gosta_texto = document.getElementById('id_cores_gosta_texto')?.value.trim() || '';
          newBriefingDoc.id_cores_nao_quer_texto = document.getElementById('id_cores_nao_quer_texto')?.value.trim() || '';
        } else if (selectedCategory === 'interface') {
          newBriefingDoc.ui_cores_gosta = colorArrays.ui_cores_gosta;
          newBriefingDoc.ui_cores_nao_quer = colorArrays.ui_cores_nao_quer;
          newBriefingDoc.ui_cores_gosta_texto = document.getElementById('ui_cores_gosta_texto')?.value.trim() || '';
          newBriefingDoc.ui_cores_nao_quer_texto = document.getElementById('ui_cores_nao_quer_texto')?.value.trim() || '';
        }

        // Salvar no Firestore ou localStorage
        if (db && isFirebaseConfigured) {
          try {
            await db.collection("briefings").add(newBriefingDoc);
          } catch (err) {
            console.warn("Erro ao gravar no Firestore, salvando no repositório local:", err);
            saveLocalBriefing(newBriefingDoc);
          }
        } else {
          saveLocalBriefing(newBriefingDoc);
        }

        // Ocultar formulário e exibir tela de confirmação direta
        progressContainer.style.display = 'none';
        stepCategory.style.display = 'none';
        stepQuestions.style.display = 'none';
        stepCommon.style.display = 'none';

        stepConfirmation.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ==========================================================================
     5. UTILITÁRIOS AUXILIARES
     ========================================================================== */
  function formatDate(dateStr) {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

});
