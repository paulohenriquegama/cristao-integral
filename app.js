(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var dados = null, cartoes = {}, serieAtiva = '', termo = '';
  var podeCompartilhar = typeof navigator.share === 'function';

  function semAcento(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function dur(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    var mm = h ? String(m).padStart(2, '0') : String(m), ss = String(x).padStart(2, '0');
    return (h ? h + ':' : '') + mm + ':' + ss;
  }
  function dataBr(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
  }
  function link(v) { return 'https://youtu.be/' + v.id; }
  function mensagem(v) { return (v.descricao || v.titulo) + '\n\n' + link(v); }
  // série (playlist): só o link da playlist vai na mensagem (o WhatsApp só faz preview do primeiro link)
  function mensagemSerie(s) {
    var d = (s.descricao || '').trim();
    if (d && !/[.!?…]$/.test(d)) d += '.';
    return '📖 *' + s.titulo + '* — ' + s.total + ' vídeos do canal Cristão Integral. ' + (d ? d + ' ' : '') + 'Assista na ordem: ' + s.url;
  }
  function compartilhavel(s) { return s.total >= 2 && !!s.url; } // série de 1 vídeo = compartilhar o próprio vídeo

  var tt;
  function aviso(txt, ms) {
    var a = $('aviso'); a.textContent = txt; a.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { a.classList.remove('on'); }, ms || 2200);
  }
  function copiar(txt, ok) {
    function fallback() {
      var t = document.createElement('textarea'); t.value = txt; t.setAttribute('readonly', '');
      t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(t);
      t.select(); t.setSelectionRange(0, txt.length);
      var certo = false; try { certo = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t); aviso(certo ? ok : 'Não consegui copiar — selecione e copie manualmente');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(txt).then(function () { aviso(ok); }, fallback);
    } else { fallback(); }
  }

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function botao(rotulo, cls, fn) {
    var b = el('button', 'btn ' + (cls || ''), rotulo); b.type = 'button'; b.addEventListener('click', fn); return b;
  }

  // ---- Status do WhatsApp: compartilha o cartão vertical (arquivo) e copia a legenda ----
  var CARTAO_AVISO = 'Legenda copiada. No status, toque em “Adicionar legenda” e cole.';
  function urlCartao(k) { return 'cartoes/' + k + '.jpg?v=' + encodeURIComponent((cartoes[k] || {}).hash || ''); }

  function botaoStatus(k, ta) { // k = chave do cartão: id do vídeo ou 'serie-<id>'
    var b = botao('Status', 'largo', function () {});
    if (!cartoes[k]) {
      b.disabled = true; b.textContent = 'Status (sem cartão)'; b.title = 'Ainda não há cartão para o status';
      return b;
    }
    var arquivoP = null, arquivo = null;
    function carrega() { // o cartão só é baixado quando o botão é tocado
      if (!arquivoP) {
        arquivoP = fetch(urlCartao(k)).then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          return r.blob();
        }).then(function (blob) {
          arquivo = new File([blob], 'cristao-integral-' + k + '.jpg', { type: 'image/jpeg' });
          return arquivo;
        });
        arquivoP.catch(function () { arquivoP = null; });
      }
      return arquivoP;
    }
    function salvar(f) {
      var u = URL.createObjectURL(f), a = document.createElement('a');
      a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    }
    var rotulo = 'Status';
    function normal() { b.textContent = rotulo; b.classList.remove('prim'); b.disabled = false; }
    function enviar(f, legenda) {
      var dados = { files: [f], text: legenda };
      if (navigator.canShare && navigator.canShare({ files: [f] })) {
        return navigator.share(dados).then(function () { aviso(CARTAO_AVISO, 4500); });
      }
      salvar(f); aviso('Imagem salva. ' + CARTAO_AVISO, 5000);
      return Promise.resolve();
    }
    b.addEventListener('pointerdown', function () { if (!arquivo) carrega().catch(function () {}); });
    b.addEventListener('click', function () {
      var legenda = ta.value;
      copiar(legenda, 'Legenda copiada'); // dentro do toque, antes de qualquer espera
      if (arquivo) { // já baixado: compartilha direto, ainda dentro do toque
        enviar(arquivo, legenda).then(normal, erro); return;
      }
      b.disabled = true; b.textContent = 'Preparando cartão…';
      carrega().then(function (f) {
        normal();
        return enviar(f, legenda);
      }).catch(function (e) {
        normal();
        if (e && e.name === 'NotAllowedError' && arquivo) { // o navegador exigiu um novo toque depois do download
          b.textContent = 'Toque de novo para enviar'; b.classList.add('prim');
          aviso('Cartão pronto. Toque de novo em Status para enviar.', 4000);
          setTimeout(normal, 15000);
          return;
        }
        erro(e);
      });
    });
    function erro(e) {
      normal();
      if (e && e.name === 'AbortError') return; // fechou a folha de compartilhamento
      if (e && e.name === 'NotAllowedError' && arquivo) { b.textContent = 'Toque de novo para enviar'; b.classList.add('prim'); return; }
      aviso('Não consegui montar o cartão. Use “Copiar texto” e tente de novo.', 4000);
    }
    return b;
  }

  // Ações de compartilhar (vídeo ou série): mensagem editável, Compartilhar, WhatsApp, Copiar texto, Copiar link, Status
  function acoes(o) {
    var box = el('div', 'acoes');
    var ta = el('textarea'); ta.value = o.msg; ta.rows = 7; ta.setAttribute('aria-label', 'Mensagem para enviar');
    var zap = el('a', 'btn zap', 'WhatsApp'); zap.target = '_blank'; zap.rel = 'noopener';
    function atualizaZap() { zap.href = 'https://wa.me/?text=' + encodeURIComponent(ta.value); }
    atualizaZap(); ta.addEventListener('input', atualizaZap);
    if (!podeCompartilhar) zap.className += ' largo';

    var bs = el('div', 'botoes');
    if (podeCompartilhar) {
      bs.appendChild(botao('Compartilhar', 'prim', function () {
        navigator.share({ text: ta.value }).catch(function (e) { if (e && e.name !== 'AbortError') aviso('Não foi possível abrir o compartilhamento'); });
      }));
    }
    bs.appendChild(zap);
    bs.appendChild(botao('Copiar texto', '', function () { copiar(ta.value, 'Texto copiado'); }));
    bs.appendChild(botao('Copiar link', '', function () { copiar(o.link, 'Link copiado'); }));
    bs.appendChild(botaoStatus(o.chave, ta));
    box.appendChild(bs);

    var d = el('details', 'msg'); d.appendChild(el('summary', '', 'Editar mensagem')); d.appendChild(ta);
    box.appendChild(d);
    return box;
  }

  function cabecalhoSerie(s, qtd) {
    var h = el('h2', '', s.titulo); h.appendChild(document.createTextNode(' ')); h.appendChild(el('span', 'qtd', '(' + qtd + ')'));
    return h;
  }

  // Bloco "compartilhar a série inteira" (só séries com 2+ vídeos públicos)
  function blocoSerie(s) {
    if (!compartilhavel(s)) return null;
    var b = el('div', 'serie-acoes');
    b.appendChild(el('p', 'serie-dica', 'Compartilhe a série inteira (' + s.total + ' vídeos) com um link só.'));
    b.appendChild(acoes({ msg: mensagemSerie(s), link: s.url, chave: 'serie-' + s.id }));
    return b;
  }

  function cartao(v) {
    var c = el('article', 'cartao');
    var a = el('a', 'mini-img'); a.href = link(v); a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'Assistir no YouTube: ' + v.titulo);
    var img = el('img'); img.src = v.miniatura; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    a.appendChild(img); a.appendChild(el('span', 'dur', dur(v.duracao)));
    c.appendChild(a);

    var corpo = el('div', 'corpo');
    corpo.appendChild(el('h3', 'titulo', v.titulo));
    corpo.appendChild(el('p', 'meta', dur(v.duracao) + ' · ' + dataBr(v.data)));

    corpo.appendChild(acoes({ msg: mensagem(v), link: link(v), chave: v.id }));
    c.appendChild(corpo);
    return c;
  }

  function desenha() {
    var lista = $('lista'); lista.textContent = '';
    var t = semAcento(termo.trim());
    var vs = dados.videos.filter(function (v) {
      if (serieAtiva && v.playlists.indexOf(serieAtiva) < 0) return false;
      return !t || semAcento(v.titulo + ' ' + v.descricao).indexOf(t) >= 0;
    });
    var r = $('resumo');
    if (!vs.length) { r.textContent = ''; lista.appendChild(el('p', 'vazio', 'Nenhum vídeo encontrado.')); return; }

    if (t || serieAtiva) {
      var serie = serieAtiva ? dados.series.filter(function (s) { return s.id === serieAtiva; })[0] : null;
      var nomeSerie = serie ? serie.titulo : '';
      r.textContent = vs.length + (vs.length === 1 ? ' vídeo' : ' vídeos') + (nomeSerie ? ' em “' + nomeSerie + '”' : '') + (t ? ' para “' + termo.trim() + '”' : '') + ' · mais novos primeiro';
      if (serie && !t) { // série escolhida no chip: mostra o cabeçalho com os botões de compartilhar a série
        var secA = el('section', 'serie'); secA.id = 's-' + serie.id;
        secA.appendChild(cabecalhoSerie(serie, vs.length));
        var bsA = blocoSerie(serie); if (bsA) secA.appendChild(bsA);
        vs.forEach(function (v) { secA.appendChild(cartao(v)); });
        lista.appendChild(secA);
        return;
      }
      vs.forEach(function (v) { lista.appendChild(cartao(v)); });
      return;
    }
    r.textContent = dados.videos.length + ' vídeos em ' + dados.series.length + ' séries · mais novos primeiro';
    dados.series.forEach(function (s) {
      var seus = vs.filter(function (v) { return v.playlists.indexOf(s.id) >= 0; });
      if (!seus.length) return;
      var sec = el('section', 'serie'); sec.id = 's-' + s.id;
      sec.appendChild(cabecalhoSerie(s, seus.length));
      var bsS = blocoSerie(s); if (bsS) sec.appendChild(bsS);
      seus.forEach(function (v) { sec.appendChild(cartao(v)); });
      lista.appendChild(sec);
    });
    var soltos = vs.filter(function (v) { return !v.playlists.length; });
    if (soltos.length) {
      var o = el('section', 'serie'); o.appendChild(el('h2', '', 'Outros vídeos'));
      soltos.forEach(function (v) { o.appendChild(cartao(v)); }); lista.appendChild(o);
    }
  }

  function chips() {
    var nav = $('series'); nav.textContent = '';
    function chip(id, rotulo) {
      var b = el('button', 'chip', rotulo); b.type = 'button'; b.setAttribute('aria-pressed', String(serieAtiva === id));
      b.addEventListener('click', function () { serieAtiva = id; chips(); desenha(); window.scrollTo({ top: 0 }); });
      nav.appendChild(b);
    }
    chip('', 'Todas');
    dados.series.forEach(function (s) { chip(s.id, s.titulo.replace(/^Série:\s*/, '')); });
  }

  $('busca').addEventListener('input', function (e) { termo = e.target.value; desenha(); });

  var cartoesP = fetch('cartoes/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
  fetch('videos.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    return cartoesP.then(function (c) { cartoes = c || {}; return d; });
  }).then(function (d) {
    dados = d; chips(); desenha();
    $('atualizado').textContent = 'Lista atualizada em ' + dataBr(d.gerado_em) + '.';
  }).catch(function () {
    $('lista').appendChild(el('p', 'vazio', 'Não consegui carregar a lista de vídeos. Tente de novo em instantes.'));
  });
})();
