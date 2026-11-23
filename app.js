(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var dados = null, serieAtiva = '', termo = '';
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

  var tt;
  function aviso(txt) {
    var a = $('aviso'); a.textContent = txt; a.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { a.classList.remove('on'); }, 2200);
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

  function cartao(v) {
    var c = el('article', 'cartao');
    var a = el('a', 'mini-img'); a.href = link(v); a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', 'Assistir no YouTube: ' + v.titulo);
    var img = el('img'); img.src = v.miniatura; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    a.appendChild(img); a.appendChild(el('span', 'dur', dur(v.duracao)));
    c.appendChild(a);

    var corpo = el('div', 'corpo');
    corpo.appendChild(el('h3', 'titulo', v.titulo));
    corpo.appendChild(el('p', 'meta', dur(v.duracao) + ' · ' + dataBr(v.data)));

    var ta = el('textarea'); ta.value = mensagem(v); ta.rows = 7; ta.setAttribute('aria-label', 'Mensagem para enviar');
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
    bs.appendChild(botao('Copiar link', '', function () { copiar(link(v), 'Link copiado'); }));
    var st = botao('Status (em breve)', 'largo', function () {}); st.disabled = true; st.title = 'Cartão para o Status do WhatsApp: em breve';
    bs.appendChild(st);
    corpo.appendChild(bs);

    var d = el('details', 'msg'); d.appendChild(el('summary', '', 'Editar mensagem')); d.appendChild(ta);
    corpo.appendChild(d);
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
      var nomeSerie = serieAtiva ? dados.series.filter(function (s) { return s.id === serieAtiva; })[0].titulo : '';
      r.textContent = vs.length + (vs.length === 1 ? ' vídeo' : ' vídeos') + (nomeSerie ? ' em “' + nomeSerie + '”' : '') + (t ? ' para “' + termo.trim() + '”' : '') + ' · mais novos primeiro';
      vs.forEach(function (v) { lista.appendChild(cartao(v)); });
      return;
    }
    r.textContent = dados.videos.length + ' vídeos em ' + dados.series.length + ' séries · mais novos primeiro';
    dados.series.forEach(function (s) {
      var seus = vs.filter(function (v) { return v.playlists.indexOf(s.id) >= 0; });
      if (!seus.length) return;
      var sec = el('section', 'serie'); sec.id = 's-' + s.id;
      var h = el('h2', '', s.titulo); h.appendChild(document.createTextNode(' ')); h.appendChild(el('span', 'qtd', '(' + seus.length + ')'));
      sec.appendChild(h);
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

  fetch('videos.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    dados = d; chips(); desenha();
    $('atualizado').textContent = 'Lista atualizada em ' + dataBr(d.gerado_em) + '.';
  }).catch(function () {
    $('lista').appendChild(el('p', 'vazio', 'Não consegui carregar a lista de vídeos. Tente de novo em instantes.'));
  });
})();
