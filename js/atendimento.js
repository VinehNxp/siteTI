/**
 * atendimento.js
 *
 * Fluxo principal:
 * 1. Coleta nome, estado e cidade.
 * 2. Selecao do dispositivo.
 * 3. Exibicao dinamica de servicos e pacotes por dispositivo.
 * 4. Coleta descricao do problema.
 * 5. Revisao e envio automatico ao WhatsApp.
 */

'use strict';

const WHATSAPP_NUMBER = '5544991792301';
const TOTAL_STEPS = 5;
const CLICK_LOCK_MS = 450;

const CITIES_BY_STATE = {
  AC: ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauaca'],
  AL: ['Maceio', 'Arapiraca', 'Palmeira dos Indios', 'Rio Largo'],
  AM: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'],
  AP: ['Macapa', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
  BA: ['Salvador', 'Feira de Santana', 'Vitoria da Conquista', 'Juazeiro'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Sobral'],
  DF: ['Brasilia', 'Taguatinga', 'Ceilandia', 'Gama'],
  ES: ['Vitoria', 'Vila Velha', 'Serra', 'Cariacica'],
  GO: ['Goiania', 'Aparecida de Goiania', 'Anapolis', 'Rio Verde'],
  MA: ['Sao Luis', 'Imperatriz', 'Caxias', 'Timon'],
  MG: ['Belo Horizonte', 'Uberlandia', 'Contagem', 'Juiz de Fora'],
  MS: ['Campo Grande', 'Dourados', 'Tres Lagoas', 'Corumba'],
  MT: ['Cuiaba', 'Varzea Grande', 'Rondonopolis', 'Sinop'],
  PA: ['Belem', 'Ananindeua', 'Santarem', 'Maraba'],
  PB: ['Joao Pessoa', 'Campina Grande', 'Santa Rita', 'Patos'],
  PE: ['Recife', 'Jaboatao dos Guararapes', 'Olinda', 'Caruaru'],
  PI: ['Teresina', 'Parnaiba', 'Picos', 'Floriano'],
  PR: ['Paranavai', 'Curitiba', 'Londrina', 'Maringa', 'Cascavel', 'Foz do Iguacu'],
  RJ: ['Rio de Janeiro', 'Sao Goncalo', 'Duque de Caxias', 'Nova Iguacu'],
  RN: ['Natal', 'Mossoro', 'Parnamirim', 'Caico'],
  RO: ['Porto Velho', 'Ji-Parana', 'Ariquemes', 'Vilhena'],
  RR: ['Boa Vista', 'Rorainopolis', 'Caracarai', 'Alto Alegre'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas'],
  SC: ['Florianopolis', 'Joinville', 'Blumenau', 'Chapeco'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'],
  SP: ['Sao Paulo', 'Campinas', 'Santos', 'Ribeirao Preto', 'Sao Jose dos Campos'],
  TO: ['Palmas', 'Araguaina', 'Gurupi', 'Porto Nacional']
};

const SERVICES_BY_DEVICE = {
  computer: {
    services: [
      { id: 'formatacao-pc', name: 'Formatacao', description: 'Reinstalacao completa e configuracao do sistema.' },
      { id: 'remocao-virus', name: 'Remocao de virus', description: 'Limpeza de ameacas, pop-ups e arquivos maliciosos.' },
      { id: 'otimizacao-pc', name: 'Otimizacao', description: 'Mais velocidade para inicializacao, programas e uso diario.' },
      { id: 'limpeza-hardware', name: 'Limpeza de hardware', description: 'Remocao de poeira e revisao interna do equipamento.' },
      { id: 'manutencao-preventiva', name: 'Manutencao preventiva', description: 'Checagem geral para evitar falhas futuras.' },
      { id: 'correcao-erros', name: 'Correcao de erros', description: 'Ajustes para falhas, mensagens de erro e bugs.' },
      { id: 'tela-azul', name: 'Tela azul / falhas', description: 'Diagnostico de travamentos criticos e reinicializacoes.' },
      { id: 'upgrade-pc', name: 'Upgrade', description: 'Memoria, SSD e melhorias para desempenho.' },
      { id: 'troca-pecas', name: 'Troca de pecas', description: 'Substituicao de componentes com defeito.' },
      { id: 'montagem-pc', name: 'Montagem de computador', description: 'Montagem completa de PC conforme seu objetivo.' },
      { id: 'instalacao-programas', name: 'Instalacao de programas', description: 'Softwares instalados e configurados corretamente.' },
      { id: 'atualizacao-drivers', name: 'Atualizacao de drivers', description: 'Drivers corretos para estabilidade e performance.' },
      { id: 'diagnostico-pc', name: 'Diagnostico', description: 'Identificacao tecnica da causa do problema.' },
      { id: 'suporte-remoto', name: 'Suporte remoto', description: 'Atendimento online para resolver sem sair de casa.' }
    ],
    packages: [
      { id: 'pacote-performance', name: 'Pacote Performance', description: 'Limpeza interna do hardware e otimizacao completa do sistema.' },
      { id: 'pacote-protecao', name: 'Pacote Protecao', description: 'Remocao completa de virus e configuracao de seguranca.' },
      { id: 'pacote-completo', name: 'Pacote Completo', description: 'Formatacao, reinstalacao do Windows e configuracao geral.' },
      { id: 'pacote-upgrade', name: 'Pacote Upgrade', description: 'Analise e instalacao de RAM, SSD ou outros componentes.' },
      { id: 'pacote-manutencao', name: 'Pacote Manutencao', description: 'Limpeza interna, revisao geral, pasta termica e diagnostico.' },
      { id: 'pacote-diagnostico', name: 'Pacote Diagnostico', description: 'Analise tecnica completa com identificacao precisa do problema.' }
    ]
  },
  mobile: {
    services: [
      { id: 'formatacao-celular', name: 'Formatacao de celular', description: 'Restauracao completa do aparelho com organizacao basica inicial.' },
      { id: 'otimizacao-celular', name: 'Otimizacao de celular', description: 'Mais velocidade, menos travamentos e melhor uso diario.' },
      { id: 'limpeza-celular', name: 'Limpeza de celular', description: 'Remocao de arquivos desnecessarios e ajustes basicos.' },
      { id: 'configuracao-celular', name: 'Configuracao de celular', description: 'Contas, apps e preferencias configuradas do jeito certo.' },
      { id: 'instalacao-apps', name: 'Instalacao de aplicativos', description: 'Apps essenciais instalados e configurados.' },
      { id: 'diagnostico-mobile', name: 'Diagnostico tecnico', description: 'Analise do aparelho para identificar a origem do problema.' },
      { id: 'suporte-remoto-mobile', name: 'Suporte remoto', description: 'Orientacao e apoio remoto quando o cenario permitir.' }
    ],
    packages: [
      { id: 'pacote-celular', name: 'Pacote Celular', description: 'Formatacao do Android com configuracao completa e reinstalacao dos principais aplicativos.' },
      { id: 'pacote-diagnostico-mobile', name: 'Pacote Diagnostico', description: 'Analise tecnica completa com orientacao detalhada para o aparelho.' }
    ]
  }
};

const DEVICE_LABELS = {
  computer: 'Computador / Notebook',
  mobile: 'Celular / Tablet'
};

const STATE_LABELS = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapa', BA: 'Bahia', CE: 'Ceara',
  DF: 'Distrito Federal', ES: 'Espirito Santo', GO: 'Goias', MA: 'Maranhao', MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul', MT: 'Mato Grosso', PA: 'Para', PB: 'Paraiba', PE: 'Pernambuco',
  PI: 'Piaui', PR: 'Parana', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondonia',
  RR: 'Roraima', RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'Sao Paulo', TO: 'Tocantins'
};

const form = document.getElementById('atendimento-form');

if (form) {
  const shell = document.querySelector('.att-shell');
  const panelsWrapper = document.querySelector('.step-panels');
  const panels = Array.from(document.querySelectorAll('.step-panel'));
  const deviceButtons = Array.from(document.querySelectorAll('[data-device]'));
  const servicesContainer = document.getElementById('service-options');
  const packagesContainer = document.getElementById('package-options');
  const serviceGroups = document.getElementById('service-groups');
  const serviceEmptyState = document.getElementById('service-empty');
  const deviceContext = document.getElementById('device-context');
  const progressLabel = document.getElementById('form-progress-label');
  const progressPercent = document.getElementById('form-progress-percent');
  const progressFill = document.getElementById('form-progress-fill');
  const previousButton = document.getElementById('prev-step');
  const nextButton = document.getElementById('next-step');
  const problemField = document.getElementById('problem');
  const nameField = document.getElementById('customer-name');
  const stateField = document.getElementById('customer-state');
  const cityField = document.getElementById('customer-city');

  const reviewFields = {
    name: document.getElementById('review-name'),
    state: document.getElementById('review-state'),
    city: document.getElementById('review-city'),
    device: document.getElementById('review-device'),
    service: document.getElementById('review-service'),
    problem: document.getElementById('review-problem')
  };

  const stepErrors = new Map(
    Array.from(document.querySelectorAll('[data-step-error]')).map((element) => [
      Number(element.dataset.stepError),
      element
    ])
  );

  const state = {
    name: '',
    customerState: '',
    city: '',
    device: '',
    service: '',
    serviceType: '',
    problem: ''
  };

  let currentStep = 1;
  let isStepChanging = false;

  const scrollFormToTop = () => {
    const shellTop = shell?.getBoundingClientRect().top ?? 0;
    const targetTop = window.scrollY + shellTop - 110;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: 'smooth'
    });
  };

  const getDeviceCatalog = () => SERVICES_BY_DEVICE[state.device] || { services: [], packages: [] };

  const getSelectedService = () => {
    const catalog = getDeviceCatalog();
    return [...catalog.services, ...catalog.packages].find((service) => service.id === state.service) || null;
  };

  const setStepError = (step, message = '') => {
    const target = stepErrors.get(step);
    if (!target) return;
    target.hidden = !message;
    target.textContent = message;
  };

  const fillStates = () => {
    Object.entries(STATE_LABELS).forEach(([uf, label]) => {
      const option = document.createElement('option');
      option.value = uf;
      option.textContent = `${uf} - ${label}`;
      stateField.appendChild(option);
    });
  };

  const fillCities = (uf) => {
    cityField.innerHTML = '';

    if (!uf || !CITIES_BY_STATE[uf]) {
      cityField.disabled = true;
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Selecione primeiro o estado';
      cityField.appendChild(option);
      return;
    }

    cityField.disabled = false;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione uma cidade';
    cityField.appendChild(placeholder);

    CITIES_BY_STATE[uf].forEach((city) => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      cityField.appendChild(option);
    });

    if (state.city && CITIES_BY_STATE[uf].includes(state.city)) {
      cityField.value = state.city;
    }
  };

  const updateDeviceSelection = () => {
    deviceButtons.forEach((button) => {
      const isSelected = button.dataset.device === state.device;
      button.classList.toggle('is-selected', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    });
  };

  const buildChoiceCard = (item, index, kind) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-card';
    button.dataset.service = item.id;
    button.dataset.kind = kind;
    button.setAttribute('aria-pressed', String(item.id === state.service));

    if (item.id === state.service) {
      button.classList.add('is-selected');
    }

    button.innerHTML = `
      <span class="choice-card__badge" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
      <span class="choice-card__title">${item.name}</span>
      <span class="choice-card__desc">${item.description}</span>
    `;

    return button;
  };

  const renderServiceOptions = () => {
    const catalog = getDeviceCatalog();

    deviceContext.textContent = DEVICE_LABELS[state.device] || 'o dispositivo selecionado';
    servicesContainer.innerHTML = '';
    packagesContainer.innerHTML = '';

    if (!state.device) {
      serviceGroups.hidden = true;
      serviceEmptyState.hidden = false;
      return;
    }

    serviceGroups.hidden = false;
    serviceEmptyState.hidden = true;

    catalog.services.forEach((service, index) => {
      servicesContainer.appendChild(buildChoiceCard(service, index, 'service'));
    });

    catalog.packages.forEach((pkg, index) => {
      packagesContainer.appendChild(buildChoiceCard(pkg, index, 'package'));
    });
  };

  const updateProgress = () => {
    const progressValue = Math.round((currentStep / TOTAL_STEPS) * 100);
    progressLabel.textContent = `Etapa ${currentStep} de ${TOTAL_STEPS}`;
    progressPercent.textContent = `${progressValue}%`;
    progressFill.style.width = `${progressValue}%`;

    previousButton.hidden = currentStep === 1;
    nextButton.hidden = false;
    nextButton.textContent = currentStep === TOTAL_STEPS ? 'Enviar solicitacao' : 'Continuar';
    nextButton.classList.toggle('is-final-step', currentStep === TOTAL_STEPS);
  };

  const updateReview = () => {
    const selectedService = getSelectedService();

    reviewFields.name.textContent = state.name || 'Nao informado';
    reviewFields.state.textContent = state.customerState ? `${state.customerState} - ${STATE_LABELS[state.customerState]}` : 'Nao selecionado';
    reviewFields.city.textContent = state.city || 'Nao selecionada';
    reviewFields.device.textContent = DEVICE_LABELS[state.device] || 'Nao selecionado';
    reviewFields.service.textContent = selectedService?.name || 'Nao selecionado';
    reviewFields.problem.textContent = state.problem || 'Nao informado';
  };

  const syncPanelHeight = () => {
    const activePanel = panels.find((panel) => Number(panel.dataset.step) === currentStep);
    if (!activePanel) return;

    requestAnimationFrame(() => {
      panelsWrapper.style.height = `${activePanel.offsetHeight}px`;
    });
  };

  const focusCurrentStep = () => {
    const activePanel = panels.find((panel) => Number(panel.dataset.step) === currentStep);
    if (!activePanel) return;

    let target = null;

    if (currentStep === 1) target = nameField;
    if (currentStep === 2) target = deviceButtons[0];
    if (currentStep === 3) target = activePanel.querySelector('[data-service]');
    if (currentStep === 4) target = problemField;
    if (currentStep === 5) target = nextButton;

    if (target) {
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
  };

  const lockStepButtons = () => {
    isStepChanging = true;
    previousButton.disabled = true;
    nextButton.disabled = true;

    window.setTimeout(() => {
      isStepChanging = false;
      previousButton.disabled = currentStep === 1;
      nextButton.disabled = false;
    }, CLICK_LOCK_MS);
  };

  const goToStep = (step, options = {}) => {
    const { shouldScroll = true } = options;
    currentStep = Math.max(1, Math.min(step, TOTAL_STEPS));

    panels.forEach((panel) => {
      const isActive = Number(panel.dataset.step) === currentStep;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', String(!isActive));
    });

    updateProgress();
    syncPanelHeight();

    requestAnimationFrame(() => {
      if (shouldScroll) scrollFormToTop();
      focusCurrentStep();
    });
  };

  const validateStep = (step) => {
    setStepError(step);

    if (step === 1) {
      state.name = nameField.value.trim();
      state.customerState = stateField.value;
      state.city = cityField.value;

      if (!state.name) {
        setStepError(1, 'Preencha seu nome para continuar.');
        nameField.focus();
        return false;
      }

      if (!state.customerState) {
        setStepError(1, 'Selecione seu estado para continuar.');
        stateField.focus();
        return false;
      }

      if (!state.city) {
        setStepError(1, 'Selecione sua cidade para continuar.');
        cityField.focus();
        return false;
      }
    }

    if (step === 2 && !state.device) {
      setStepError(2, 'Escolha o dispositivo para continuar.');
      focusCurrentStep();
      return false;
    }

    if (step === 3) {
      if (!state.device) {
        setStepError(3, 'Escolha o dispositivo primeiro.');
        goToStep(2);
        return false;
      }

      if (!state.service) {
        setStepError(3, 'Selecione um servico ou pacote para continuar.');
        focusCurrentStep();
        return false;
      }
    }

    if (step === 4) {
      state.problem = problemField.value.trim();

      if (!state.problem) {
        setStepError(4, 'Explique rapidamente o problema para continuar.');
        problemField.focus();
        return false;
      }
    }

    return true;
  };

  const buildWhatsAppMessage = () => {
    const selectedService = getSelectedService();

    return [
      'Ola! Quero solicitar um orcamento.',
      `Nome: ${state.name}`,
      `Estado: ${state.customerState} - ${STATE_LABELS[state.customerState] || 'Nao informado'}`,
      `Cidade: ${state.city}`,
      `Dispositivo: ${DEVICE_LABELS[state.device] || 'Nao informado'}`,
      `Servico: ${selectedService?.name || 'Nao informado'}`,
      `Descricao do problema: ${state.problem || 'Nao informado'}`
    ].join('\n');
  };

  fillStates();
  fillCities('');

  stateField.addEventListener('change', () => {
    state.customerState = stateField.value;
    state.city = '';
    fillCities(state.customerState);
    setStepError(1);
    updateReview();
    syncPanelHeight();
  });

  cityField.addEventListener('change', () => {
    state.city = cityField.value;
    setStepError(1);
    updateReview();
  });

  nameField.addEventListener('input', () => {
    state.name = nameField.value.trim();
    setStepError(1);
    updateReview();
    syncPanelHeight();
  });

  deviceButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextDevice = button.dataset.device;

      if (state.device !== nextDevice) {
        state.device = nextDevice;
        state.service = '';
        state.serviceType = '';
      }

      updateDeviceSelection();
      renderServiceOptions();
      updateReview();
      setStepError(2);
      setStepError(3);
      syncPanelHeight();
    });
  });

  serviceGroups.addEventListener('click', (event) => {
    const button = event.target.closest('[data-service]');
    if (!button) return;

    state.service = button.dataset.service || '';
    state.serviceType = button.dataset.kind || '';
    renderServiceOptions();
    updateReview();
    setStepError(3);
  });

  problemField.addEventListener('input', () => {
    state.problem = problemField.value.trim();
    setStepError(4);
    updateReview();
    syncPanelHeight();
  });

  previousButton.addEventListener('click', () => {
    if (isStepChanging) return;
    lockStepButtons();
    goToStep(currentStep - 1);
  });

  nextButton.addEventListener('click', () => {
    if (isStepChanging) return;

    if (currentStep < TOTAL_STEPS) {
      if (!validateStep(currentStep)) return;
      updateReview();
      lockStepButtons();
      goToStep(currentStep + 1);
      return;
    }

    const validationSequence = [1, 2, 3, 4];
    let firstInvalidStep = 0;

    for (const step of validationSequence) {
      if (!validateStep(step)) {
        firstInvalidStep = step;
        break;
      }
    }

    if (firstInvalidStep) {
      goToStep(firstInvalidStep);
      return;
    }

    const message = buildWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    nextButton.textContent = 'Abrindo WhatsApp...';
    nextButton.disabled = true;
    previousButton.disabled = true;
    window.location.href = whatsappUrl;
  });

  window.addEventListener('resize', syncPanelHeight, { passive: true });
  window.addEventListener('load', syncPanelHeight);

  serviceGroups.hidden = true;
  renderServiceOptions();
  updateDeviceSelection();
  updateReview();
  updateProgress();
  goToStep(1, { shouldScroll: false });
}
