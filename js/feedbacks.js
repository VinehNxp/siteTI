import { firebaseConfig, feedbacksSettings } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  limit,
  query,
  serverTimestamp,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

'use strict';

const reviewForm = document.getElementById('review-form');
const signInButton = document.querySelector('[data-review-signin]');
const signOutButton = document.querySelector('[data-review-signout]');
const submitButton = document.querySelector('[data-review-submit]');
const userCard = document.querySelector('[data-review-user]');
const userName = document.querySelector('[data-review-user-name]');
const userEmail = document.querySelector('[data-review-user-email]');
const userAvatar = document.querySelector('[data-review-user-avatar]');
const ratingInput = document.getElementById('review-rating');
const ratingButtons = Array.from(document.querySelectorAll('[data-rating-value]'));
const reviewMessage = document.querySelector('[data-review-message]');
const publishedFeedbacks = document.getElementById('published-feedbacks');
const liveStatus = document.querySelector('[data-feedback-live-status]');
const averageOutput = document.querySelector('[data-feedback-average]');
const countOutput = document.querySelector('[data-feedback-count]');
const configAlert = document.querySelector('[data-feedback-config-alert]');

const collectionName = feedbacksSettings.collectionName || 'reviews';

let auth = null;
let db = null;
let currentUser = null;
let approvedReviews = [];

const fallbackReviews = [
  {
    name: 'Marcos Silva',
    city: 'Paranavaí - PR',
    rating: 5,
    comment: 'Meu computador estava travando bastante e depois do atendimento ficou bem mais rápido. O processo foi claro do começo ao fim.',
    createdAt: null
  },
  {
    name: 'Larissa Mendes',
    city: 'Maringá - PR',
    rating: 5,
    comment: 'Resolveu meu problema pelo acesso remoto sem enrolação. Gostei porque explicou tudo de forma simples e objetiva.',
    createdAt: null
  },
  {
    name: 'Renata Oliveira',
    city: 'Nova Londrina - PR',
    rating: 5,
    comment: 'Atendimento rápido e muito transparente. Passou confiança, mostrou o problema e não ficou tentando empurrar serviço.',
    createdAt: null
  }
];

function isFirebaseEnabled() {
  return feedbacksSettings.enabled && firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;
}

function setMessage(text, type = 'neutral') {
  reviewMessage.textContent = text;
  reviewMessage.dataset.state = type;
}

function formatDate(value) {
  if (!value) {
    return 'Avaliação em destaque';
  }

  const date = value?.toDate ? value.toDate() : new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' às');
}

function renderStars(rating) {
  const total = 5;
  return '★'.repeat(rating) + '☆'.repeat(Math.max(total - rating, 0));
}

function getInitials(name = 'C') {
  return name.trim().charAt(0).toUpperCase() || 'C';
}

function escapeHtml(value = '') {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildAvatarMarkup(name, photoURL) {
  if (photoURL) {
    return `<div class="avatar avatar--image"><img src="${escapeHtml(photoURL)}" alt="Foto de ${escapeHtml(name)}" loading="lazy" referrerpolicy="no-referrer" /></div>`;
  }

  return `<div class="avatar" aria-hidden="true">${escapeHtml(getInitials(name))}</div>`;
}

function renderPublishedReviews(list) {
  if (!publishedFeedbacks) {
    return;
  }

  if (!list.length) {
    publishedFeedbacks.innerHTML = `
      <article class="feedback-empty-state">
        <strong>Nenhuma avaliação aprovada ainda.</strong>
        <p>As novas avaliações enviadas aparecem aqui assim que forem revisadas.</p>
      </article>
    `;
    return;
  }

  publishedFeedbacks.innerHTML = list.map((review, index) => `
    <article class="tcard fade-up ${index % 3 === 1 ? 'd1' : index % 3 === 2 ? 'd2' : ''}">
      <div class="tcard-top">
        <div class="stars" aria-label="${review.rating} estrelas">${renderStars(review.rating)}</div>
        <div class="tcard-date">${escapeHtml(formatDate(review.createdAt))}</div>
      </div>
      <blockquote class="tcard-text">"${escapeHtml(review.comment)}"</blockquote>
      <footer class="tcard-author">
        ${buildAvatarMarkup(review.name, review.photoURL)}
        <div>
          <div class="tcard-name">${escapeHtml(review.name)}</div>
          <div class="tcard-city">${escapeHtml(review.city)}</div>
        </div>
      </footer>
    </article>
  `).join('');

  document.querySelectorAll('#published-feedbacks .fade-up').forEach((card) => {
    requestAnimationFrame(() => card.classList.add('visible'));
  });
}

function updateSummary(list) {
  const count = list.length;
  const average = count
    ? (list.reduce((sum, review) => sum + review.rating, 0) / count).toFixed(1)
    : '5.0';

  averageOutput.textContent = average;
  countOutput.textContent = String(count);
}

function sortReviews(list) {
  return [...list].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return dateB - dateA;
  });
}

async function loadApprovedReviews() {
  if (!isFirebaseEnabled()) {
    approvedReviews = fallbackReviews;
    liveStatus.textContent = 'Modo de demonstração ativo. Configure o Firebase para publicar avaliações reais.';
    updateSummary(approvedReviews);
    renderPublishedReviews(approvedReviews);
    return;
  }

  try {
    liveStatus.textContent = 'Carregando avaliações publicadas...';

    const reviewsQuery = query(
      collection(db, collectionName),
      where('status', '==', 'approved'),
      limit(24)
    );

    const snapshot = await getDocs(reviewsQuery);

    approvedReviews = sortReviews(snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })));

    updateSummary(approvedReviews);
    renderPublishedReviews(approvedReviews);
    liveStatus.textContent = approvedReviews.length
      ? 'Avaliações publicadas e moderadas.'
      : 'Nenhuma avaliação aprovada ainda.';
  } catch (error) {
    console.error('Erro ao carregar avaliações:', error);
    liveStatus.textContent = 'Não foi possível carregar as avaliações agora.';
    approvedReviews = fallbackReviews;
    updateSummary(approvedReviews);
    renderPublishedReviews(approvedReviews);
  }
}

function updateAuthUI(user) {
  currentUser = user;

  if (!user) {
    userCard.hidden = true;
    signInButton.hidden = false;
    submitButton.disabled = true;
    if (userAvatar) {
      userAvatar.classList.remove('avatar--image');
      userAvatar.textContent = 'C';
      userAvatar.innerHTML = 'C';
    }
    return;
  }

  userCard.hidden = false;
  signInButton.hidden = true;
  userName.textContent = user.displayName || 'Cliente autenticado';
  userEmail.textContent = user.email || '';

  if (user.photoURL) {
    userAvatar.classList.add('avatar--image');
    userAvatar.innerHTML = `<img src="${escapeHtml(user.photoURL)}" alt="Foto de ${escapeHtml(user.displayName || 'Cliente')}" referrerpolicy="no-referrer" />`;
  } else {
    userAvatar.classList.remove('avatar--image');
    userAvatar.textContent = getInitials(user.displayName || 'Cliente');
  }

  submitButton.disabled = false;
}

function updateRatingUI(value) {
  ratingInput.value = value ? String(value) : '';

  ratingButtons.forEach((button) => {
    const currentValue = Number(button.dataset.ratingValue);
    const isActive = currentValue <= value;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-checked', String(currentValue === value));
  });
}

async function handleGoogleSignIn() {
  if (!auth) {
    return;
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
    setMessage('Conta conectada. Agora você já pode enviar sua avaliação.', 'success');
  } catch (error) {
    console.error('Erro no login Google:', error);
    setMessage('Não foi possível concluir o login com Google. Tente novamente.', 'error');
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  if (!isFirebaseEnabled()) {
    setMessage('Ative o Firebase antes de receber avaliações reais.', 'error');
    return;
  }

  if (!currentUser) {
    setMessage('Entre com sua conta Google antes de enviar a avaliação.', 'error');
    return;
  }

  const formData = new FormData(reviewForm);
  const city = String(formData.get('city') || '').trim();
  const comment = String(formData.get('comment') || '').trim();
  const rating = Number(formData.get('rating') || 0);

  if (!city || !comment || !rating) {
    setMessage('Preencha cidade, comentário e nota por estrelas para enviar a avaliação.', 'error');
    return;
  }

  if (comment.length < 20) {
    setMessage('Escreva um comentário um pouco mais completo para publicar sua avaliação.', 'error');
    return;
  }

  submitButton.disabled = true;
  setMessage('Enviando avaliação...', 'neutral');

  try {
    await addDoc(collection(db, collectionName), {
      userId: currentUser.uid,
      name: currentUser.displayName || 'Cliente',
      email: currentUser.email || '',
      photoURL: currentUser.photoURL || '',
      city,
      rating,
      comment,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    reviewForm.reset();
    updateRatingUI(0);
    setMessage('Avaliação enviada com sucesso. Ela ficará visível após a aprovação.', 'success');
  } catch (error) {
    console.error('Erro ao enviar avaliação:', error);
    setMessage('Não foi possível enviar sua avaliação agora. Tente novamente.', 'error');
  } finally {
    submitButton.disabled = !currentUser;
  }
}

function bindEvents() {
  signInButton?.addEventListener('click', handleGoogleSignIn);
  signOutButton?.addEventListener('click', () => signOut(auth));
  reviewForm?.addEventListener('submit', handleFormSubmit);

  ratingButtons.forEach((button) => {
    button.addEventListener('click', () => {
      updateRatingUI(Number(button.dataset.ratingValue));
    });
  });
}

async function initFeedbacks() {
  bindEvents();

  if (!isFirebaseEnabled()) {
    signInButton.disabled = true;
    submitButton.disabled = true;
    configAlert.hidden = false;
    setMessage('Sistema em modo de demonstração. Configure o Firebase para receber avaliações reais.', 'neutral');
    await loadApprovedReviews();
    return;
  }

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  onAuthStateChanged(auth, (user) => {
    updateAuthUI(user);
  });

  await loadApprovedReviews();
}

initFeedbacks();
