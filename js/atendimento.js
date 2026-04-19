/**
 * atendimento.js
 *
 * Fluxo principal:
 * 1. Coleta nome, estado e cidade.
 * 2. Seleção do dispositivo.
 * 3. Exibição dinâmica de serviços e pacotes por dispositivo.
 * 4. Coleta descrição do problema.
 * 5. Revisão e envio automático ao WhatsApp.
 */

'use strict';

const WHATSAPP_NUMBER = '5544991792301';
const TOTAL_STEPS = 5;
const CLICK_LOCK_MS = 450;
const IBGE_CITIES_API = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados';
const CITIES_CACHE_PREFIX = 'techfix-cities-';

const SERVICES_BY_DEVICE = {
  computer: {
    services: [
      { id: 'formatacao-pc', name: 'Formatação', description: 'Reinstalação completa e configuração do sistema.' },
      { id: 'remocao-virus', name: 'Remoção de vírus', description: 'Limpeza de ameaças, pop-ups e arquivos maliciosos.' },
      { id: 'otimizacao-pc', name: 'Otimização', description: 'Mais velocidade para inicialização, programas e uso diário.' },
      { id: 'limpeza-hardware', name: 'Limpeza de hardware', description: 'Remoção de poeira e revisão interna do equipamento.' },
      { id: 'manutencao-preventiva', name: 'Manutenção preventiva', description: 'Checagem geral para evitar falhas futuras.' },
      { id: 'correcao-erros', name: 'Correção de erros', description: 'Ajustes para falhas, mensagens de erro e bugs.' },
      { id: 'tela-azul', name: 'Tela azul / falhas', description: 'Diagnóstico de travamentos críticos e reinicializações.' },
      { id: 'upgrade-pc', name: 'Upgrade', description: 'Memória, SSD e melhorias para desempenho.' },
      { id: 'troca-pecas', name: 'Troca de peças', description: 'Substituição de componentes com defeito.' },
      { id: 'montagem-pc', name: 'Montagem de computador', description: 'Montagem completa de PC conforme seu objetivo.' },
      { id: 'instalacao-programas', name: 'Instalação de programas', description: 'Softwares instalados e configurados corretamente.' },
      { id: 'atualizacao-drivers', name: 'Atualização de drivers', description: 'Drivers corretos para estabilidade e performance.' },
      { id: 'diagnostico-pc', name: 'Diagnóstico', description: 'Identificação técnica da causa do problema.' },
      { id: 'suporte-remoto', name: 'Suporte remoto', description: 'Atendimento online para resolver sem sair de casa.' }
    ],
    packages: [
      { id: 'pacote-performance', name: 'Pacote Performance', description: 'Limpeza interna do hardware e otimização completa do sistema.' },
      { id: 'pacote-protecao', name: 'Pacote Proteção', description: 'Remoção completa de vírus e configuração de segurança.' },
      { id: 'pacote-completo', name: 'Pacote Completo', description: 'Formatação, reinstalação do Windows e configuração geral.' },
      { id: 'pacote-upgrade', name: 'Pacote Upgrade', description: 'Análise e instalação de RAM, SSD ou outros componentes.' },
      { id: 'pacote-manutencao', name: 'Pacote Manutenção', description: 'Limpeza interna, revisão geral, pasta térmica e diagnóstico.' },
      { id: 'pacote-diagnostico', name: 'Pacote Diagnóstico', description: 'Análise técnica completa com identificação precisa do problema.' }
    ]
  },
  mobile: {
    services: [
      { id: 'formatacao-celular', name: 'Formatação de celular', description: 'Restauração completa do aparelho com organização básica inicial.' },
      { id: 'otimizacao-celular', name: 'Otimização de celular', description: 'Mais velocidade, menos travamentos e melhor uso diário.' },
      { id: 'limpeza-celular', name: 'Limpeza de celular', description: 'Remoção de arquivos desnecessários e ajustes básicos.' },
      { id: 'configuracao-celular', name: 'Configuração de celular', description: 'Contas, apps e preferências configuradas do jeito certo.' },
      { id: 'instalacao-apps', name: 'Instalação de aplicativos', description: 'Apps essenciais instalados e configurados.' },
      { id: 'diagnostico-mobile', name: 'Diagnóstico técnico', description: 'Análise do aparelho para identificar a origem do problema.' },
      { id: 'suporte-remoto-mobile', name: 'Suporte remoto', description: 'Orientação e apoio remoto quando o cenário permitir.' }
    ],
    packages: [
      { id: 'pacote-celular', name: 'Pacote Celular', description: 'Formatação do Android com configuração completa e reinstalação dos principais aplicativos.' },
      { id: 'pacote-diagnostico-mobile', name: 'Pacote Diagnóstico', description: 'Análise técnica completa com orientação detalhada para o aparelho.' }
    ]
  }
};

const DEVICE_LABELS = {
  computer: 'Computador / Notebook',
  mobile: 'Celular / Tablet'
};

const STATE_LABELS = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins'
};

const cityCache = new Map();
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
  let isLoadingCities = false;

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
    return [...catalog.services, ...catalog.packages].find((item) => item.id === state.service) || null;
  };

  const setStepError = (step, message = '') => {
    const target = stepErrors.get(step);

    if (!target) return;

    target.hidden = !message;
    target.textContent = message;
  };

  const setCityPlaceholder = (message, disabled = true) => {
    cityField.innerHTML = '';
    cityField.disabled = disabled;

    const option = document.createElement('option');
    option.value = '';
    option.textContent = message;
    cityField.appendChild(option);
  };

  const getStoredCities = (uf) => {
    try {
      const cached = window.sessionStorage.getItem(`${CITIES_CACHE_PREFIX}${uf}`);
      const parsed = cached ? JSON.parse(cached) : null;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const storeCities = (uf, cities) => {
    try {
      window.sessionStorage.setItem(`${CITIES_CACHE_PREFIX}${uf}`, JSON.stringify(cities));
    } catch {
      // Ignora falhas de armazenamento em navegação privada ou bloqueios do navegador.
    }
  };

  const sortCities = (cities) =>
    [...cities].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));

  const populateCities = (uf, cities) => {
    cityField.innerHTML = '';
    cityField.disabled = false;

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione uma cidade';
    cityField.appendChild(placeholder);

    sortCities(cities).forEach((city) => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      cityField.appendChild(option);
    });

    if (state.customerState === uf && state.city && cities.includes(state.city)) {
      cityField.value = state.city;
    } else {
      cityField.value = '';
    }
  };

  const loadCitiesForState = async (uf) => {
    if (!uf) {
      isLoadingCities = false;
      setCityPlaceholder('Selecione primeiro o estado');
      return;
    }

    const cachedCities = cityCache.get(uf) || getStoredCities(uf);
    if (cachedCities?.length) {
      cityCache.set(uf, cachedCities);
      populateCities(uf, cachedCities);
      return;
    }

    isLoadingCities = true;
    setCityPlaceholder('Carregando cidades...');

    try {
      const response = await fetch(`${IBGE_CITIES_API}/${uf}/municipios`, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar cidades');
      }

      const payload = await response.json();
      const cities = sortCities(payload.map((item) => item.nome).filter(Boolean));

      cityCache.set(uf, cities);
      storeCities(uf, cities);

      if (stateField.value === uf) {
        populateCities(uf, cities);
      }
    } catch {
      if (stateField.value === uf) {
        setCityPlaceholder('Não foi possível carregar as cidades. Tente novamente.');
        setStepError(1, 'Não foi possível carregar as cidades desse estado agora. Tente novamente.');
      }
    } finally {
      isLoadingCities = false;
      syncPanelHeight();
    }
  };

  const fillStates = () => {
    stateField.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione um estado';
    stateField.appendChild(placeholder);

    Object.entries(STATE_LABELS)
      .sort(([, labelA], [, labelB]) => labelA.localeCompare(labelB, 'pt-BR', { sensitivity: 'base' }))
      .forEach(([uf, label]) => {
        const option = document.createElement('option');
        option.value = uf;
        option.textContent = `${uf} - ${label}`;
        stateField.appendChild(option);
      });
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
    nextButton.textContent = currentStep === TOTAL_STEPS ? 'Enviar solicitação' : 'Continuar';
    nextButton.classList.toggle('is-final-step', currentStep === TOTAL_STEPS);
  };

  const updateReview = () => {
    const selectedService = getSelectedService();

    reviewFields.name.textContent = state.name || 'Não informado';
    reviewFields.state.textContent = state.customerState ? `${state.customerState} - ${STATE_LABELS[state.customerState]}` : 'Não selecionado';
    reviewFields.city.textContent = state.city || 'Não selecionada';
    reviewFields.device.textContent = DEVICE_LABELS[state.device] || 'Não selecionado';
    reviewFields.service.textContent = selectedService?.name || 'Não selecionado';
    reviewFields.problem.textContent = state.problem || 'Não informado';
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

      if (isLoadingCities || cityField.disabled) {
        setStepError(1, 'Aguarde o carregamento das cidades desse estado.');
        cityField.focus();
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
        setStepError(3, 'Selecione um serviço ou pacote para continuar.');
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
      'Olá! Quero solicitar um orçamento.',
      `Nome: ${state.name}`,
      `Estado: ${state.customerState} - ${STATE_LABELS[state.customerState] || 'Não informado'}`,
      `Cidade: ${state.city}`,
      `Dispositivo: ${DEVICE_LABELS[state.device] || 'Não informado'}`,
      `Serviço: ${selectedService?.name || 'Não informado'}`,
      `Problema: ${state.problem || 'Não informado'}`
    ].join('\n');
  };

  fillStates();
  setCityPlaceholder('Selecione primeiro o estado');

  stateField.addEventListener('change', async () => {
    state.customerState = stateField.value;
    state.city = '';

    setStepError(1);
    updateReview();
    await loadCitiesForState(state.customerState);
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
