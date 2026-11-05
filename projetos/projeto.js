/**
 * G. LOVATO ROSEIRA - MOTOR DO TEMPLATE DE ESTUDOS DE CASO (CASE STUDY ENGINE)
 * Renderizador dinâmico de páginas de projeto com suporte a dados reutilizáveis,
 * lightbox acessível em tela cheia e alternância de tema claro/escuro.
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. GERENCIAMENTO DE TEMA (CLARO / ESCURO)
     ========================================================================== */
  const themeToggleBtn = document.getElementById('caseThemeToggle');
  
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = (theme === 'light') ? '🌙' : '☀️';
      themeToggleBtn.setAttribute('title', (theme === 'light') ? 'Alternar para Modo Escuro' : 'Alternar para Modo Claro');
    }
  }

  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = (activeTheme === 'dark') ? 'light' : 'dark';
      applyTheme(newTheme);
    });
  }

  /* ==========================================================================
     2. IDENTIFICAÇÃO DO PROJETO ATUAL
     ========================================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const paramSlug = urlParams.get('p') || urlParams.get('id') || urlParams.get('projeto');
  const rawBodySlug = (document.body.getAttribute('data-project') || '').trim();
  const bodySlug = rawBodySlug !== '' ? rawBodySlug : null;
  
  // Extrair slug do nome do arquivo se for rota direta (ex: /projetos/projetados.html)
  const pathFile = window.location.pathname.split('/').pop().replace('.html', '');
  const pathSlug = (pathFile && pathFile !== 'template' && pathFile !== 'projeto' && pathFile !== 'index') ? pathFile : null;

  const currentSlug = bodySlug || paramSlug || pathSlug || 'grimoire-os';

  const projects = window.PROJETOS_DATA || [];
  let currentProject = projects.find(p => p.slug === currentSlug || p.id === parseInt(currentSlug));

  // Fallback para o primeiro projeto caso não localize
  if (!currentProject && projects.length > 0) {
    currentProject = projects[0];
  }

  if (!currentProject) {
    console.error('Nenhum projeto encontrado para exibição.');
    return;
  }

  /* ==========================================================================
     3. APLICAÇÃO DE ESTILOS E METADADOS DO PROJETO
     ========================================================================== */
  document.title = `${currentProject.title} | G. Lovato Roseira`;
  
  // Definir acento de cor da categoria via CSS Variable
  document.documentElement.style.setProperty('--project-accent', currentProject.accentColor);

  /* ==========================================================================
     4. RENDERIZAÇÃO DAS SEÇÕES
     ========================================================================== */
  
  // 4.1 Cabeçalho & Hero do Projeto
  const heroBadge = document.getElementById('heroBadge');
  const heroTitle = document.getElementById('heroTitle');
  const metaYear = document.getElementById('metaYear');
  const metaRole = document.getElementById('metaRole');
  const metaContext = document.getElementById('metaContext');
  const metaToolsList = document.getElementById('metaToolsList');
  const coverFrame = document.getElementById('coverFrame');
  const heroCoverImg = document.getElementById('heroCoverImg');
  const coverCaption = document.getElementById('coverCaption');

  if (heroBadge) heroBadge.textContent = currentProject.categoryLabel;
  if (heroTitle) heroTitle.textContent = currentProject.title;
  if (metaYear) metaYear.textContent = currentProject.year;
  if (metaRole) metaRole.textContent = currentProject.role;
  if (metaContext) metaContext.textContent = currentProject.context;

  if (metaToolsList && currentProject.tools) {
    metaToolsList.innerHTML = currentProject.tools
      .map(tool => `<span class="tools-tag">${tool}</span>`)
      .join('');
  }

  if (heroCoverImg && currentProject.cover) {
    heroCoverImg.src = currentProject.cover.src;
    heroCoverImg.alt = currentProject.cover.alt;
    if (coverCaption) coverCaption.textContent = currentProject.cover.caption;

    // Se o projeto tiver vídeo do YouTube configurado na capa principal
    if (currentProject.cover.youtubeId && coverFrame) {
      coverFrame.setAttribute('data-youtube-id', currentProject.cover.youtubeId);
      
      let playTrigger = coverFrame.querySelector('.video-play-trigger');
      if (!playTrigger) {
        playTrigger = document.createElement('button');
        playTrigger.className = 'video-play-trigger';
        playTrigger.id = 'videoPlayTrigger';
        playTrigger.type = 'button';
        playTrigger.setAttribute('aria-label', `Assistir ao vídeo ${currentProject.title}`);
        playTrigger.innerHTML = `
          <span class="video-play-disc">
            <svg class="play-svg-icon" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </span>
          <span class="video-play-label">ASSISTIR CURTA-METRAGEM</span>
        `;
        coverFrame.appendChild(playTrigger);
      }

      function startVideoPlayback(forceEmbed = false) {
        if (coverFrame.classList.contains('is-playing') && !forceEmbed) return;

        const isLocalFile = window.location.protocol === 'file:';
        const ytWatchUrl = currentProject.cover.youtubeUrl || `https://www.youtube.com/watch?v=${currentProject.cover.youtubeId}`;

        // Se estiver executando como arquivo local (file://) e não tiver forçado a incorporação:
        // O YouTube bloqueia players embutidos com o Erro 153 porque não há cabeçalho HTTP Referrer/Origin.
        if (isLocalFile && !forceEmbed) {
          // Abrir o vídeo no YouTube em nova aba imediatamente
          window.open(ytWatchUrl, '_blank');
          
          // E exibir o aviso explicativo com opção de tentar o player embutido
          coverFrame.classList.add('is-playing');
          coverFrame.innerHTML = `
            <div class="file-protocol-notice">
              <div class="notice-badge">AVISO DO YOUTUBE &bull; ERRO 153</div>
              <h4 class="notice-title">Reprodução Aberta no YouTube</h4>
              <p class="notice-desc">
                O YouTube bloqueia players embutidos com o <strong>Erro 153</strong> quando o arquivo é aberto diretamente no navegador pelo protocolo <code>file:///</code> (sem servidor HTTP/HTTPS). Ao publicar na web ou rodar via servidor local (localhost), o player roda direto aqui.
              </p>
              <div class="notice-actions-row">
                <a href="${ytWatchUrl}" target="_blank" rel="noopener noreferrer" class="btn-yt-direct">
                  ASSISTIR NO YOUTUBE &rarr;
                </a>
                <button type="button" class="btn-yt-force" id="btnForceEmbed">
                  Tentar player embutido mesmo assim
                </button>
              </div>
            </div>
          `;

          const btnForceEmbed = coverFrame.querySelector('#btnForceEmbed');
          if (btnForceEmbed) {
            btnForceEmbed.addEventListener('click', (e) => {
              e.stopPropagation();
              startVideoPlayback(true);
            });
          }
          return;
        }

        // Incorporação padrão via YouTube Embed com referrerpolicy
        coverFrame.classList.add('is-playing');
        
        const iframe = document.createElement('iframe');
        iframe.className = 'hero-video-iframe';
        iframe.src = `https://www.youtube-nocookie.com/embed/${currentProject.cover.youtubeId}?rel=0&modestbranding=1&autoplay=1`;
        iframe.title = currentProject.title;
        iframe.loading = 'lazy';
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        iframe.allowFullscreen = true;
        
        coverFrame.innerHTML = '';
        coverFrame.appendChild(iframe);

        // Botão flutuante de contingência para abrir no YouTube se houver falha
        const floatLink = document.createElement('a');
        floatLink.className = 'yt-fallback-float-btn';
        floatLink.href = ytWatchUrl;
        floatLink.target = '_blank';
        floatLink.rel = 'noopener noreferrer';
        floatLink.title = 'Assistir diretamente no YouTube';
        floatLink.innerHTML = 'Assistir no YouTube &rarr;';
        coverFrame.appendChild(floatLink);
      }

      coverFrame.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('button#btnForceEmbed')) return;
        
        // Se houver um player de vídeo na seção de Resultado Final do processo, rola suavemente até ele
        const processVideo = document.querySelector('.video-embed-container-16-9');
        if (processVideo) {
          processVideo.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            processVideo.click();
          }, 450);
          return;
        }

        startVideoPlayback();
      });
    }
  }

  // 4.2 Resumo do Projeto
  const summaryText = document.getElementById('summaryText');
  if (summaryText) {
    summaryText.textContent = currentProject.summary;
  }

  // 4.3 Processo (Etapas Alternadas com Suporte a Player de Vídeo no Resultado Final)
  const processStepsContainer = document.getElementById('processStepsContainer');
  if (processStepsContainer && currentProject.processSteps) {
    processStepsContainer.innerHTML = currentProject.processSteps.map((step, idx) => {
      // Se a etapa tiver um vídeo do YouTube incorporado (ex: Curta ou Making Of)
      if (step.videoEmbed) {
        const btnLabel = step.videoEmbed.buttonLabel || 'ASSISTIR VÍDEO';
        const thumbSrc = step.videoEmbed.thumbnail || `https://img.youtube.com/vi/${step.videoEmbed.youtubeId}/maxresdefault.jpg`;
        return `
          <article class="process-step-row process-step-row--video" id="etapa-${step.stepNumber}">
            <div class="process-step-content">
              <span class="step-number-watermark">${step.stepNumber}</span>
              <span class="step-subtitle">${step.subtitle}</span>
              <h3 class="step-heading-main">${step.title}</h3>
              <p class="step-paragraph">${step.text}</p>
            </div>
            <div class="process-step-media">
              <div class="video-embed-container-16-9" data-youtube-id="${step.videoEmbed.youtubeId}" data-video-title="${step.videoEmbed.title}">
                <div class="video-facade-layer">
                  <img 
                    src="${thumbSrc}" 
                    alt="${step.videoEmbed.title}" 
                    class="video-facade-img" 
                    loading="lazy"
                  >
                  <button type="button" class="video-facade-play-button" aria-label="${btnLabel}">
                    <span class="play-button-disc">
                      <svg class="play-button-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </span>
                    <span class="play-button-text">${btnLabel}</span>
                  </button>
                </div>
              </div>
              <p class="video-player-caption">${step.videoEmbed.caption}</p>
            </div>
          </article>
        `;
      }

      // Etapa padrão com imagem
      return `
        <article class="process-step-row" id="etapa-${step.stepNumber}">
          <div class="process-step-content">
            <span class="step-number-watermark">${step.stepNumber}</span>
            <span class="step-subtitle">${step.subtitle}</span>
            <h3 class="step-heading-main">${step.title}</h3>
            <p class="step-paragraph">${step.text}</p>
          </div>
          <div class="process-step-media">
            <div class="step-media-frame" data-lightbox-trigger="${step.image.src}" data-lightbox-caption="${step.image.caption}">
              <img 
                src="${step.image.src}" 
                alt="${step.image.alt}" 
                class="step-media-img" 
                loading="lazy"
              >
            </div>
            <p class="step-media-caption">${step.image.caption}</p>
          </div>
        </article>
      `;
    }).join('');

    // Configuração dos players de vídeo com padrão Facade (Resultado Final)
    document.querySelectorAll('.video-embed-container-16-9').forEach(container => {
      const videoId = container.getAttribute('data-youtube-id');
      const videoTitle = container.getAttribute('data-video-title') || 'Vídeo do Curta';
      const ytWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;

      function mountVideoIframe() {
        // Fallback para caso a página seja aberta diretamente como arquivo (file://)
        // Onde o YouTube bloqueia o embed com Erro 153 por falta de referrer HTTP válido
        if (window.location.protocol === 'file:') {
          window.open(ytWatchUrl, '_blank', 'noopener');

          container.innerHTML = `
            <div class="video-file-fallback-notice">
              <span class="fallback-tag">AVISO DO YOUTUBE &bull; ERRO 153</span>
              <h4 class="fallback-title">Reprodução Aberta no YouTube</h4>
              <p class="fallback-text">
                O YouTube exige um referrer válido na requisição do iframe. Ao abrir diretamente no navegador (<code>file:///</code>), o player incorporado falha com o Erro 153. Ao rodar em um servidor local (localhost) ou na web, o player roda direto aqui.
              </p>
              <div class="fallback-btns">
                <a href="${ytWatchUrl}" target="_blank" rel="noopener" class="btn-yt-direct">
                  ASSISTIR NO YOUTUBE &rarr;
                </a>
                <button type="button" class="btn-yt-force-mount">
                  Forçar player incorporado
                </button>
              </div>
            </div>
          `;

          const forceBtn = container.querySelector('.btn-yt-force-mount');
          if (forceBtn) {
            forceBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              renderExactIframe();
            });
          }
          return;
        }

        // Em servidor HTTP/HTTPS: monta exatamente o iframe solicitado
        renderExactIframe();
      }

      function renderExactIframe() {
        container.classList.add('is-mounted');
        container.innerHTML = `
          <iframe
            src="https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1"
            title="${videoTitle}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowfullscreen>
          </iframe>
        `;
      }

      container.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target.closest('.btn-yt-force-mount')) return;
        if (!container.classList.contains('is-mounted')) {
          mountVideoIframe();
        }
      });
    });
  }

  // 4.4 Galeria de Imagens (Grid Assimétrico com Lazy Loading e Filtros)
  const asymmetricGallery = document.getElementById('asymmetricGallery');
  const galleryFilterBar = document.getElementById('galleryFilterBar');

  if (asymmetricGallery && currentProject.gallery) {
    asymmetricGallery.innerHTML = currentProject.gallery.map((item, idx) => {
      const aspectClass = item.aspect ? `gallery-item--${item.aspect}` : 'gallery-item--wide';
      const categoryAttr = item.category ? `data-gallery-category="${item.category}"` : '';
      const tagBadge = item.tag ? `<span class="gallery-item-tag-pill">${item.tag}</span>` : '';

      return `
        <div class="gallery-item ${aspectClass}" ${categoryAttr} data-lightbox-trigger="${item.src}" data-lightbox-caption="${item.caption}">
          ${tagBadge}
          <img 
            src="${item.src}" 
            alt="${item.alt}" 
            class="gallery-item-img" 
            loading="lazy"
          >
          <div class="gallery-overlay-hint">
            <span class="gallery-hint-caption">${item.caption}</span>
            <span class="gallery-hint-action">Clique para ampliar &rarr;</span>
          </div>
        </div>
      `;
    }).join('');

    // Configuração dos Botões de Filtro da Galeria
    if (galleryFilterBar) {
      const filterButtons = galleryFilterBar.querySelectorAll('.gallery-filter-btn');
      const galleryItems = asymmetricGallery.querySelectorAll('.gallery-item');

      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          // Atualiza estado ativo dos botões
          filterButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          const selectedFilter = btn.getAttribute('data-gallery-filter');

          if (selectedFilter === 'todos') {
            asymmetricGallery.classList.remove('is-filtered');
            galleryItems.forEach(item => item.classList.remove('is-hidden'));
          } else {
            asymmetricGallery.classList.add('is-filtered');
            galleryItems.forEach(item => {
              const itemCategory = item.getAttribute('data-gallery-category');
              if (itemCategory === selectedFilter) {
                item.classList.remove('is-hidden');
              } else {
                item.classList.add('is-hidden');
              }
            });
          }
        });
      });
    }
  }

  // 4.5 Rodapé de Navegação (Projeto Anterior e Próximo)
  const prevProject = projects.find(p => p.slug === currentProject.prevSlug);
  const nextProject = projects.find(p => p.slug === currentProject.nextSlug);

  const prevLink = document.getElementById('prevProjectLink');
  const prevTitle = document.getElementById('prevProjectTitle');
  const nextLink = document.getElementById('nextProjectLink');
  const nextTitle = document.getElementById('nextProjectTitle');

  if (prevProject && prevLink && prevTitle) {
    prevLink.href = `${prevProject.slug}.html`;
    prevTitle.textContent = prevProject.title;
    prevLink.style.display = 'flex';
  } else if (prevLink) {
    prevLink.style.display = 'none';
  }

  if (nextProject && nextLink && nextTitle) {
    nextLink.href = `${nextProject.slug}.html`;
    nextTitle.textContent = nextProject.title;
    nextLink.style.display = 'flex';
  } else if (nextLink) {
    nextLink.style.display = 'none';
  }

  // Se não houver projeto anterior nem próximo, ocultar a barra e manter apenas o retorno ao catálogo
  const navStrip = document.querySelector('.nav-projects-strip');
  if (!prevProject && !nextProject && navStrip) {
    navStrip.style.display = 'none';
  }

  /* ==========================================================================
     5. SISTEMA DE LIGHTBOX (TELA CHEIA COM NAVEGAÇÃO COMPLETA)
     ========================================================================== */
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  // Coleta todas as imagens visualizáveis nesta página
  let lightboxItems = [];

  // Adicionar capa
  if (currentProject.cover && currentProject.cover.src) {
    lightboxItems.push({
      src: currentProject.cover.src,
      caption: currentProject.cover.caption,
      alt: currentProject.cover.alt
    });
  }

  // Adicionar etapas de processo (apenas etapas que possuem imagem estática)
  if (currentProject.processSteps) {
    currentProject.processSteps.forEach(s => {
      if (s.image && s.image.src) {
        lightboxItems.push({
          src: s.image.src,
          caption: s.image.caption,
          alt: s.image.alt
        });
      }
    });
  }

  // Adicionar imagens da galeria
  if (currentProject.gallery) {
    currentProject.gallery.forEach(g => {
      lightboxItems.push({
        src: g.src,
        caption: g.caption,
        alt: g.alt
      });
    });
  }

  let currentLightboxIndex = 0;

  function updateLightboxContent() {
    if (lightboxItems.length === 0) return;
    const item = lightboxItems[currentLightboxIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt || 'Imagem ampliada do projeto';
    lightboxCaption.textContent = item.caption || '';
    lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxItems.length}`;
  }

  function openLightbox(src) {
    const index = lightboxItems.findIndex(item => item.src === src);
    currentLightboxIndex = (index !== -1) ? index : 0;
    updateLightboxContent();
    lightboxModal.classList.add('active');
    lightboxModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxModal.classList.remove('active');
    lightboxModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function nextLightbox() {
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxItems.length;
    updateLightboxContent();
  }

  function prevLightbox() {
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    updateLightboxContent();
  }

  // Eventos de clique para abrir
  if (heroCoverImg) {
    heroCoverImg.addEventListener('click', () => {
      if (currentProject.cover && !currentProject.cover.youtubeId) {
        openLightbox(currentProject.cover.src);
      }
    });
  }

  document.querySelectorAll('[data-lightbox-trigger]').forEach(triggerEl => {
    triggerEl.addEventListener('click', () => {
      const src = triggerEl.getAttribute('data-lightbox-trigger');
      openLightbox(src);
    });
  });

  // Botões de controle
  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextLightbox(); });
  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevLightbox(); });

  // Fechar clicando no fundo escuro
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal || e.target.classList.contains('lightbox-container')) {
        closeLightbox();
      }
    });
  }

  // Navegação por teclado (Esc, Setas Esquerda/Direita)
  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      nextLightbox();
    } else if (e.key === 'ArrowLeft') {
      prevLightbox();
    }
  });

});
