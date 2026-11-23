# Página de vídeos do Cristão Integral

Página pública (GitHub Pages) com os vídeos **públicos** do canal, por série, com botões de compartilhar.
Endereço: https://paulohenriquegama.github.io/cristao-integral/

Este repositório é **público**: nunca coloque aqui segredos, rascunhos, vídeos privados/agendados nem dados pessoais.

## Atualizar a lista de vídeos
O gerador fica fora deste repositório (usa o login do canal):

```bash
~/estudio-youtube/.venv/bin/python ~/estudio-youtube/gerar_site.py   # regrava videos.json (só vídeos públicos)
cd ~/cristao-integral-site
git diff --stat                                                       # confira: só videos.json deve mudar
git add videos.json && git commit -m "Atualiza lista de vídeos" && git push
```
O Pages atualiza em ~1 minuto. Vídeo agendado só aparece depois que o YouTube o publicar e o gerador rodar de novo.

## Arquivos
- `index.html`, `style.css`, `app.js`: a página (sem dependências, sem rastreadores).
- `videos.json`: gerado pelo `gerar_site.py` (não edite à mão).
- `privacidade.html`: política de privacidade (exigida pelo Google para o app OAuth).
- `manifest.webmanifest`, `icons/`: instalação na tela inicial. `fonts/`: Playfair Display (licença OFL).

## Fases seguintes (ver Estúdio/PLANO-COMPARTILHAMENTO.md)
Botão **Status** (cartão vertical 1080×1920) e comando `site` no `publicar.py`.
