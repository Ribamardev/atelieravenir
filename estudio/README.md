# Estúdio Avenir

Sistema interno da Avenir para criar imagens base de Instagram (Feed 4:5 e Stories 9:16) com a API do Higgsfield, a partir de referências.

**Fluxo:** cliente (identidade + referências) → briefing → o diretor de arte (Claude ou OpenAI) analisa as referências e escreve um prompt por peça → você revisa e edita → o Higgsfield gera → as imagens são copiadas para o Supabase → galeria com aprovação, refação com ajuste e download em 1080×1350 / 1080×1920.

## Estrutura

- `app/` – telas (Clientes, Gerar imagens, Configurações, Login) e rotas de API
- `app/api/plan` – diretor de arte (prompts)
- `app/api/generate` – sobe referências ao Higgsfield e envia as gerações
- `app/api/jobs/[id]` – consulta o status e copia as imagens prontas para o Supabase (o Higgsfield apaga em 7 dias)
- `lib/higgsfield.ts` – cliente da API (`https://api.higgsfield.ai`, header `Authorization: Key ID:SECRET`)
- `lib/director.ts` – instruções do diretor de arte, incluindo as regras de publicidade em saúde
- `supabase/schema.sql` – tabelas `sm_*`, bucket `sm-media` e modelos iniciais

## Instalação (uma vez)

1. **Supabase**: no projeto do Atelier, abra o SQL Editor e rode `supabase/schema.sql`. Em Authentication → Users, crie o seu usuário (e-mail e senha).
2. **Vercel**: crie um projeto novo apontando para este repositório com **Root Directory = `estudio`**. Em Environment Variables, coloque:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (os mesmos do Atelier)
   - `HIGGSFIELD_API_KEY_ID`, `HIGGSFIELD_API_KEY_SECRET` (console.higgsfield.ai)
   - `ANTHROPIC_API_KEY` (ou `OPENAI_API_KEY` + `OPENAI_MODEL`)
3. **Modelos**: em Configurações, o "Soul 2 (só texto)" já vem ativo. Para gerar a partir das referências (Nano Banana Pro etc.), copie da página do modelo no console.higgsfield.ai o caminho do endpoint e o nome do campo de imagens, cole no modelo "Nano Banana Pro", marque **Ativo** e salve.

## Kit de marca (aba Identidade visual)

- **Logos**: PNG, SVG, JPG ou WebP. O logo marcado como principal é o aplicado no download (posição e tamanho escolhidos na galeria, com prévia) e o que o diretor de arte usa como referência de cor. Ele nunca é desenhado pela IA. "Extrair cores" lê as cores dominantes do logo e sugere a paleta.
- **Cores**: HEX, pelo seletor ou extraídas do logo. Entram em todos os prompts.
- **Tipografia**: nomes das fontes e arquivos (.ttf/.otf/.woff) guardados com o cliente.
- **Manual de marca (PDF)**: o diretor de arte lê o manual antes de escrever os prompts (com Claude; com OpenAI, só o logo e as referências vão junto).

## Observações

- Com um modelo só de texto, o diretor de arte descreve o estilo das referências dentro do prompt. Com um modelo de referências, as imagens vão junto.
- Se o modelo não aceitar 4:5, o Feed é gerado em 3:4 e recortado no download.
- O download recorta pelo centro e gera um JPEG novo, sem metadados da origem.
- Cada geração é cobrada no saldo da API do Higgsfield, que é separado do plano do site.
