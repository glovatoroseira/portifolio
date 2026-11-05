/**
 * G. LOVATO ROSEIRA - BRIEFINGS BACKEND (FIREBASE CONFIG)
 * Configuração do SDK Firebase (Auth & Firestore) via CDN Compat
 */

// Substitua o objeto abaixo com as suas credenciais reais do Console do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyYOUR_FIREBASE_API_KEY_HERE",
  authDomain: "lovato-portfolio.firebaseapp.com",
  projectId: "lovato-portfolio",
  storageBucket: "lovato-portfolio.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Verificar se as credenciais foram preenchidas com chave real ou modo demonstração
const isFirebaseConfigured = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_FIREBASE");

let auth = null;
let db = null;

if (typeof firebase !== 'undefined') {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("Firebase inicializado com sucesso.");
  } catch (err) {
    console.warn("Erro ao inicializar Firebase (modo demonstração local ativo):", err.message);
  }
}

// Utilitário de Armazenamento de Backup/Demonstração Local (para uso imediato sem chave)
const LOCAL_STORAGE_KEY = 'lovato_briefings_store';

function getLocalBriefings() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    // Dados iniciais de demonstração
    const initialBriefings = [
      {
        id: "briefing-001",
        titulo: "Redesign de Interface para Plataforma Grimoire",
        categoria: "interface",
        createdAt: "2026-09-20",
        conteudo: `<h2>1. Objetivos do Projeto</h2>
<p>Desenvolver uma nova arquitetura de informação e sistema de navegação por atalhos de teclado para a plataforma de acervos digitais Grimoire.</p>
<h2>2. Requisitos de Interface</h2>
<p>Utilizar modo escuro de alto contraste, tipografia Barlow para dados de acervo e transições ágeis sem efeitos pesados.</p>
<h2>3. Entregáveis</h2>
<p>Wireframes de alta fidelidade no Figma, guia de componentes e protótipo interativo testado.</p>`,
        linkMaterial: "https://figma.com/file/exemplo-grimoire",
        pdfFlag: true
      },
      {
        id: "briefing-002",
        titulo: "Documentário Nocturna • Direção de Arte e Cor",
        categoria: "audiovisual",
        createdAt: "2026-09-15",
        conteudo: `<h2>1. Conceito Audiovisual</h2>
<p>Construção de atmosfera noturna urbana com gradação de cor focada em sombras profundas e reflexos em tons roxos e frios.</p>
<h2>2. Estrutura de Edição</h2>
<p>Ritmo desacelerado nas cenas contemplativas e cortes rápidos nas sequências de transição urbana.</p>`,
        linkMaterial: "https://vimeo.com/exemplo-nocturna",
        pdfFlag: true
      }
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialBriefings));
    return initialBriefings;
  }
  return JSON.parse(data);
}

function saveLocalBriefing(briefing) {
  const items = getLocalBriefings();
  if (briefing.id) {
    const idx = items.findIndex(i => i.id === briefing.id);
    if (idx >= 0) items[idx] = briefing;
    else items.push(briefing);
  } else {
    briefing.id = 'briefing-' + Date.now();
    items.push(briefing);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  return briefing;
}

function deleteLocalBriefing(id) {
  let items = getLocalBriefings();
  items = items.filter(i => i.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}
