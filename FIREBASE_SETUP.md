# Sistema de Avaliações com Firebase

## Arquivos adicionados

- `js/firebase-config.js`
- `js/firebase-config.example.js`
- `js/feedbacks.js`
- `firebase.firestore.rules`

## Fluxo implementado

1. Cliente entra com Google.
2. Preenche cidade, nota por estrelas e comentário.
3. A avaliação é salva no Firestore com status `pending`.
4. A página pública exibe apenas avaliações com status `approved`.

## Configuração

1. Crie um projeto no Firebase.
2. Ative:
   - Authentication > Google
   - Firestore Database
3. Copie `js/firebase-config.example.js` para `js/firebase-config.js`.
4. Preencha as chaves reais do seu projeto.
5. Troque `enabled: false` por `enabled: true`.

## Regras do Firestore

Use o conteúdo de `firebase.firestore.rules`.

Essas regras permitem:

- leitura pública apenas de avaliações aprovadas
- envio autenticado de novas avaliações como `pending`
- aprovação/rejeição apenas por usuário com custom claim `admin`

## Moderação

Você tem duas opções práticas:

1. Aprovar manualmente no console do Firebase:
   - coleção `reviews`
   - trocar `status` de `pending` para `approved`

2. Evoluir depois para painel administrativo:
   - manter a mesma coleção
   - adicionar custom claim `admin`
   - criar UI privada para aprovar ou rejeitar

## Estrutura do documento `reviews`

```json
{
  "userId": "uid-do-google",
  "name": "Nome do cliente",
  "email": "cliente@email.com",
  "photoURL": "https://...",
  "city": "Paranavaí - PR",
  "rating": 5,
  "comment": "Comentário do cliente",
  "status": "pending",
  "createdAt": "serverTimestamp()"
}
```
