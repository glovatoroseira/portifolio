/**
 * G. LOVATO ROSEIRA - PORTFÓLIO ONLINE
 * Interatividade em JavaScript Puro (Vanilla JS)
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

  /* ==========================================================================
     1. DADOS DOS PROJETOS (BASE DE CONTEÚDO EXPANDIDA PARA O MODAL)
     ========================================================================== */
  const projectsData = [
    {
      id: 1,
      slug: 'projetados',
      category: 'audiovisual',
      categoryLabel: 'AUDIOVISUAL',
      accentColor: '#4B4368',
      title: 'Projetados: Curta-Metragem de Suspense e Terror',
      year: '2025',
      summary: 'Curta-metragem de suspense e drama psicológico realizado em conjunto com Hardie Ray para o Laboratório de Audiovisual (Desenho Industrial - UFSM).',
      context: 'Curta-metragem de suspense e drama psicológico com duração estimada de 8 a 12 minutos, com roteiro de Giovana Lovato e Hardie Ray para o Laboratório de Audiovisual do curso de Desenho Industrial da UFSM. A trama acompanha três estudantes (Marina, Léo e Ana) no laboratório acadêmico quando o projetor passa a ligar sozinho e projetar registros perturbadores acompanhados da frase "EU SEI O QUE VOCÊS FIZERAM".',
      process: 'Atuação completa nas etapas de roteiro, decupagem visual (storyboard manual de 45 quadros), construção de personagens/figurinos, direção de arte/locações e edição rítmica voltada para a tensão dramática.',
      tags: ['Edição de Vídeo', 'Montagem', 'Pré-Produção', 'Roteiro', 'Storyboard'],
      previewIcon: '🎬'
    }
  ];

  /* ==========================================================================
     2. NAVEGAÇÃO MOBILE (MENU TOGGLE)
     ========================================================================== */
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });

    // Fechar menu ao clicar em qualquer link de navegação
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }

  /* ==========================================================================
     3. HIGHLIGHT DE NAVEGAÇÃO ATIVA AO ROLAR (SCROLLSPY)
     ========================================================================== */
  const sections = document.querySelectorAll('section[id]');

  function highlightNavOnScroll() {
    const scrollY = window.pageYOffset;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const navLink = document.querySelector(`.nav-menu a[href*="${sectionId}"]`);

      if (navLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navLink.classList.add('active');
        } else {
          navLink.classList.remove('active');
        }
      }
    });
  }

  window.addEventListener('scroll', highlightNavOnScroll);

  /* ==========================================================================
     4. FILTRAGEM DINÂMICA DOS PROJETOS
     ========================================================================== */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Atualizar estado ativo dos botões
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      // Filtrar cards
      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');

        if (filterValue === 'todos' || category === filterValue) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });

  /* ==========================================================================
     5. MODAL DE DETALHES DO PROJETO
     ========================================================================== */
  const modalBackdrop = document.getElementById('projectModal');
  const modalCloseBtn = document.getElementById('modalClose');
  const modalCloseBtnBottom = document.getElementById('modalCloseBtn');
  
  const modalBadge = document.getElementById('modalBadge');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalPreviewBox = document.getElementById('modalPreviewBox');
  const modalDescContext = document.getElementById('modalDescContext');
  const modalDescProcess = document.getElementById('modalDescProcess');
  const modalTags = document.getElementById('modalTags');

  function openProjectModal(projectId) {
    const project = projectsData.find(p => p.id === parseInt(projectId));
    if (!project) return;

    // Preencher dados do modal
    modalTitle.textContent = project.title;
    modalBadge.textContent = project.categoryLabel;
    modalBadge.style.backgroundColor = project.accentColor;
    modalMeta.textContent = `${project.year} • ${project.categoryLabel}`;

    // Ícone / Gráfico do preview do modal
    modalPreviewBox.innerHTML = `
      <div style="font-size: 4rem; filter: drop-shadow(3px 3px 0 #000); color: ${project.accentColor};">
        ${project.previewIcon}
      </div>
    `;

    modalDescContext.textContent = project.context;
    modalDescProcess.textContent = project.process;

    // Renderizar tags
    modalTags.innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    // Exibir modal
    modalBackdrop.classList.add('active');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Impedir scroll do fundo
  }

  function closeModal() {
    modalBackdrop.classList.remove('active');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Event Listeners nos cards de projeto (Navegação para páginas dedicadas)
  projectCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Se o clique foi no próprio link ou em um elemento filho dele, deixa o link navegar
      if (e.target.closest('a')) return;

      const slug = card.getAttribute('data-project-slug');
      if (slug) {
        window.location.href = `projetos/${slug}.html`;
      } else {
        const projectId = card.getAttribute('data-project-id');
        openProjectModal(projectId);
      }
    });
  });

  // Fechar Modal
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalCloseBtnBottom) modalCloseBtnBottom.addEventListener('click', closeModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  // Fechar com tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('active')) {
      closeModal();
    }
  });

  /* ==========================================================================
     6. FORMULÁRIO DE CONTATO INTERATIVO
     ========================================================================== */
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('formName').value.trim();
      const emailInput = document.getElementById('formEmail').value.trim();

      if (nameInput && emailInput) {
        formFeedback.style.display = 'block';
        formFeedback.innerHTML = `
          <strong>Mensagem enviada com sucesso!</strong><br>
          Obrigado pelo contato, ${nameInput}. G. Lovato Roseira responderá em breve no e-mail <em>${emailInput}</em>.
        `;
        
        contactForm.reset();

        // Ocultar mensagem após 7 segundos
        setTimeout(() => {
          formFeedback.style.display = 'none';
        }, 7000);
      }
    });
  }

});
