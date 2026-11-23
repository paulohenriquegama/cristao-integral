# Página de vídeos do Cristão Integral

Página pública (GitHub Pages) com os vídeos **públicos** do canal, por série, com botões de compartilhar.
Endereço: https://paulohenriquegama.github.io/cristao-integral/

Este repositório é **público**: nunca coloque aqui segredos, rascunhos, vídeos privados/agendados nem dados pessoais.

## Atualizar vídeos e cartões (um comando)
Os geradores ficam fora deste repositório (usam o login do canal):

```bash
~/estudio-youtube/atualizar_site.sh              # gera videos.json + cartões e mostra o que mudou (não publica)
~/estudio-youtube/atualizar_site.sh --publicar   # idem, e faz commit + push
```
Passo a passo, se preferir manual:

```bash
~/estudio-youtube/.venv/bin/python ~/estudio-youtube/gerar_site.py   # 1. regrava videos.json (só vídeos públicos)
/usr/bin/python3 ~/estudio-youtube/gerar_cartoes.py                  # 2. cria só os cartões novos/alterados (use --tudo para refazer todos)
cd ~/cristao-integral-site
git add videos.json cartoes && git diff --cached --stat              # 3. confira: só videos.json e cartoes/ devem mudar
git commit -m "Atualiza vídeos e cartões" && git push
```
O Pages atualiza em ~1 minuto. Vídeo agendado só aparece depois que o YouTube o publicar e o gerador rodar de novo (o cartão dele nasce nessa hora). Cartão de vídeo que deixou de ser público é apagado automaticamente pelo `gerar_cartoes.py`.

## Cartões de status (`cartoes/`)
- `cartoes/<id-do-video>.jpg`: cartão vertical 1080×1920 (~100–220 KB) com logo, miniatura, série, título exato e a chamada “Assista agora no canal Cristão Integral”. Texto fica fora de 250 px do topo e do rodapé (margem da interface do status).
- `cartoes/index.json`: lista dos cartões existentes (com hash para atualizar o cache). Sem cartão, o botão Status do vídeo fica desabilitado.
- O botão **Status** baixa o cartão só ao tocar, abre a folha de compartilhamento com o arquivo (`navigator.share` com arquivos) e copia a legenda (mensagem + link do YouTube). Se o aparelho não compartilha arquivos, salva a imagem. No WhatsApp: escolha “Status”/“Meu status”, toque em adicionar legenda e cole.
- Para mudar o desenho, edite `~/estudio-youtube/gerar_cartoes.py` e aumente `VERSAO_DESENHO` (refaz todos).

## Arquivos
- `index.html`, `style.css`, `app.js`: a página (sem dependências, sem rastreadores).
- `videos.json`: gerado pelo `gerar_site.py` (não edite à mão). `cartoes/`: gerado pelo `gerar_cartoes.py`.
- `privacidade.html`: política de privacidade (exigida pelo Google para o app OAuth).
- `manifest.webmanifest`, `icons/`: instalação na tela inicial. `fonts/`: Playfair Display (licença OFL).

## Fases seguintes (ver Estúdio/PLANO-COMPARTILHAMENTO.md)
- Comando `site` no `publicar.py` (rodar o `atualizar_site.sh --publicar` no fim de cada publicação).
- Ideia futura: vídeo vertical publicável no Status (hoje o site só lista vídeos do YouTube); cartões 1080×1350 para o Instagram.
