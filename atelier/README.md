# Atelier

Social media com IA para clínicas, médicos e hospitais atendidos pela **Avenir**.
O médico responde perguntas sobre a clínica, coloca logo, cores e fotos, escolhe os estilos
de arte e recebe todo dia ideias e posts prontos (arte + legenda) revisados com as regras do CFM.

## Como funciona

| Parte | O que faz | Onde roda |
|---|---|---|
| `public/` | O app (telas, motor de artes em canvas, 10 estilos) | Navegador do cliente |
| `api/text.js` | Escreve ideias, linha de conteúdo e posts | Vercel (servidor) |
| `api/image.js` | Gera o fundo/cena do post e recorta a pessoa da foto | Vercel (servidor) → OpenAI |
| `api/usage.js` | Mostra quanto o cliente usou no mês | Vercel |
| `supabase/schema.sql` | Banco, regras de acesso e arquivos | Supabase |

**Regra de ouro das imagens:** a IA (OpenAI) cria só o visual — fundo, cena, objeto e o recorte da pessoa.
Todo texto da arte (título, CRM, RQE, @) é desenhado pelo app com as fontes certas. Assim nunca sai
erro de português nem CRM errado na imagem.

As chaves de API ficam **só** nas variáveis de ambiente da Vercel. Nada de chave no código.

## Configuração (uma vez)

### 1. Supabase
1. Abra o projeto no Supabase → **SQL Editor** → cole o conteúdo de `supabase/schema.sql` → **Run**.
2. **Authentication → URL Configuration**: em *Site URL* coloque o endereço do app na Vercel
   (ex.: `https://atelier-avenir.vercel.app`) e adicione o mesmo em *Redirect URLs*.
3. **Project Settings → API**: copie a *Project URL* e a chave *anon public*.

### 2. Liberar clientes
Só entra no app quem estiver na tabela `atelier_members`. Para liberar um cliente:

```sql
insert into public.atelier_members (email, nome) values ('dra.ana@clinica.com.br', 'Clínica Visão Clara');
```

Para bloquear: `update public.atelier_members set ativo = false where email = '...';`

O cliente entra digitando o e-mail e clicando no link que chega por e-mail (sem senha).

### 3. Chaves de IA
- **OpenAI** (obrigatória para imagens): platform.openai.com → *API keys* → crie uma chave.
  Coloque créditos na conta e confirme que o modelo `gpt-image-2` aparece liberado.
- **Anthropic** (opcional, para textos com Claude): console.anthropic.com → *API Keys*.

### 4. Vercel → Settings → Environment Variables
Cadastre as variáveis do arquivo `.env.example`:

| Variável | Obrigatória | Exemplo |
|---|---|---|
| `SUPABASE_URL` | sim | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | sim | chave *anon public* |
| `OPENAI_API_KEY` | sim | `sk-...` |
| `OPENAI_IMAGE_MODEL` | não | `gpt-image-2` |
| `OPENAI_IMAGE_QUALITY` | não | `medium` (low, medium, high) |
| `OPENAI_TEXT_MODEL` / `OPENAI_TEXT_MODEL_FAST` | não | modelos de texto da OpenAI |
| `ANTHROPIC_API_KEY` | não | só se quiser o Claude escrevendo |
| `ANTHROPIC_MODEL` / `ANTHROPIC_MODEL_FAST` | não | `claude-sonnet-5-5` / `claude-haiku-4-5-20251001` |
| `TEXT_PROVIDER` | não | `openai` ou `anthropic` (vazio = Anthropic se houver chave) |
| `MONTHLY_TEXT_LIMIT` | não | `400` textos por cliente/mês |
| `MONTHLY_IMAGE_LIMIT` | não | `60` imagens por cliente/mês |

Depois de mudar variáveis, faça um novo deploy (Deployments → ⋯ → Redeploy).

> Os nomes de modelos mudam com o tempo. Se der erro de "modelo não encontrado",
> confira o nome atual na documentação da OpenAI/Anthropic e troque só a variável.

## Custos (estimativa)
- Imagem `gpt-image-2` vertical, qualidade média: cerca de US$ 0,04 por imagem (+ entrada).
- O recorte da foto do médico é feito **uma vez por foto** e reaproveitado.
- O limite mensal por cliente (`MONTHLY_IMAGE_LIMIT`) protege contra gasto inesperado.

Consumo de todos os clientes no mês (SQL Editor):

```sql
select u.email, s.month, s.text_calls, s.image_calls
from public.atelier_usage s join auth.users u on u.id = s.user_id
order by s.month desc, s.image_calls desc;
```

## Rodar no computador
```bash
npm install
cp .env.example .env.local   # preencha as chaves
npx vercel dev               # abre em http://localhost:3000
```

## Estrutura
```
api/
  _lib/core.js      login, limites de uso, utilidades
  _lib/text.js      OpenAI ou Anthropic para textos
  _lib/image.js     OpenAI para imagens (fundo e recorte)
  _lib/prompts.js   prompts de imagem por estilo
  config.js  text.js  image.js  usage.js
public/
  index.html
  assets/platform.js  login, chamadas à API, arquivos
  assets/engine.js    motor de artes (estilos, tipografia, texturas)
  assets/app.js       telas e fluxo do app
  assets/styles.css
supabase/schema.sql
```
