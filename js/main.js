const operators = [
  ["nennen","AFB I","Information knapp wiedergeben, ohne lange Erklärung."],
  ["beschreiben","AFB I","Material geordnet darstellen: Was sieht man? Was steht da?"],
  ["herausarbeiten","AFB II","Zentrale Aussagen gezielt aus Material entnehmen und ordnen."],
  ["erläutern","AFB II","Eine Aussage erklären und mit Hintergrundwissen verständlich machen."],
  ["vergleichen","AFB II","Gemeinsamkeiten und Unterschiede nach klaren Kriterien zeigen."],
  ["analysieren","AFB II","Material untersuchen: Aufbau, Inhalt, Aussage, Wirkung."],
  ["beurteilen","AFB III","Argumente abwägen und zu einem begründeten Sachurteil kommen."],
  ["bewerten","AFB III","Ein begründetes Urteil mit eigenen oder vorgegebenen Wertmaßstäben formulieren."]
];
const vocab = [
  ["Naturrechte","Vorstaatliche Rechte, die jedem Menschen zukommen, etwa Leben, Freiheit und Eigentum."],
  ["Gesellschaftsvertrag","Denkmodell: Menschen gründen eine politische Ordnung, um Freiheit und Sicherheit zu sichern."],
  ["Volkssouveränität","Die legitime Staatsgewalt geht vom Volk aus."],
  ["Gewaltenteilung","Staatsgewalt wird auf Legislative, Exekutive und Judikative verteilt."],
  ["Konservatismus","Politisches Denken, das Tradition, Ordnung und organischen Wandel betont."],
  ["Liberalismus","Politisches Denken, das individuelle Freiheit, Rechte und begrenzte Herrschaft betont."],
  ["Sozialismus","Politisches Denken, das soziale Gleichheit und Kritik an kapitalistischer Ausbeutung betont."],
  ["Gemeinwille","Bei Rousseau der auf das Gemeinwohl gerichtete Wille des Volkes."],
  ["Sozialstaat","Staatsprinzip, das soziale Sicherheit und faire Teilhabe sichern soll."],
  ["Rechtsstaat","Staatliche Macht ist an Recht, Verfahren und Grundrechte gebunden."]
];

// Aktiven Navigationspunkt anhand des Dateinamens markieren
const currentPage = (location.pathname.split("/").pop() || "index.html");
document.querySelectorAll("nav a").forEach(link => {
  const target = link.getAttribute("href");
  if(target === currentPage || (currentPage === "" && target === "index.html")){
    link.classList.add("active");
  }
});

// Operatoren-Panel (auf allen Seiten vorhanden)
const opList = document.querySelector("#opList");
if(opList){
  operators.forEach(([name, afb, text]) => {
    const item = document.createElement("div");
    item.className = "op-item";
    item.innerHTML = `<div><span class="op-name">${name}</span><span class="op-afb">${afb}</span></div><p class="op-def">${text}</p>`;
    opList.appendChild(item);
  });
}

// Glossar: erst alle Begriffe mit Erklaerung (Schritt 1 vor dem Memory).
const glossar = document.querySelector("#glossar");
if(glossar){
  vocab.forEach(([term, definition]) => {
    const item = document.createElement("div");
    item.className = "gloss-item";
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = definition;
    item.appendChild(dt);
    item.appendChild(dd);
    glossar.appendChild(item);
  });
}

// Wortschatz-Memory (nur auf der Wortschatz-Seite)
// Klassisches Paare-Spiel in Eigenarbeit: zu jedem Begriff gibt es eine
// Begriffs- und eine Definitionskarte. Karten sind divs (kein button):
// Chromium flacht 3D-Transforms in button-Elementen ab.
const memWrap = document.querySelector("#memory");
if(memWrap){
  const status = document.querySelector("#memStatus");
  const total = vocab.length;
  // Zwei Karten je Begriff bauen (Begriff + passende Definition).
  const cards = [];
  vocab.forEach(([term, definition], i) => {
    cards.push({pair:i, kind:"term", label:term});
    cards.push({pair:i, kind:"def", label:definition});
  });
  // Mischen (Fisher-Yates).
  for(let i = cards.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  let first = null, lock = false, found = 0, moves = 0;
  const setStatus = () => {
    status.textContent = `${found} von ${total} Paaren · ${moves} Versuche`;
  };
  cards.forEach(data => {
    const card = document.createElement("div");
    card.className = "mcard";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Verdeckte Karte, zum Aufdecken auswählen");
    card.innerHTML = `<span class="mcard-inner"><span class="mface mfront">?</span><span class="mface mback ${data.kind}">${data.label}</span></span>`;
    const reveal = () => {
      if(lock || card.classList.contains("flip") || card.classList.contains("done")){ return; }
      card.classList.add("flip");
      card.setAttribute("aria-label", data.label);
      if(!first){ first = {card, data}; return; }
      moves++;
      if(first.data.pair === data.pair && first.card !== card){
        first.card.classList.add("done");
        card.classList.add("done");
        found++;
        setStatus();
        first = null;
        if(found === total){
          status.textContent = `Alle ${total} Paare gefunden · ${moves} Versuche. Stark!`;
          status.classList.add("mem-win");
        }
      } else {
        lock = true;
        const a = first.card, b = card;
        setStatus();
        setTimeout(() => {
          a.classList.remove("flip");
          b.classList.remove("flip");
          a.setAttribute("aria-label", "Verdeckte Karte, zum Aufdecken auswählen");
          b.setAttribute("aria-label", "Verdeckte Karte, zum Aufdecken auswählen");
          lock = false;
        }, 950);
        first = null;
      }
    };
    card.addEventListener("click", reveal);
    card.addEventListener("keydown", event => {
      if(event.key === "Enter" || event.key === " "){
        event.preventDefault();
        reveal();
      }
    });
    memWrap.appendChild(card);
  });
  setStatus();
  const restart = document.querySelector("#memRestart");
  if(restart){ restart.addEventListener("click", () => location.reload()); }
}

// Vergleichsmatrix als Drag-and-drop (nur auf der Vergleich-Seite).
// Schuelerinnen und Schueler ziehen 20 Bausteine in die passenden Zellen;
// funktioniert per Maus/Touch-Drag und per Antippen (Baustein -> Zelle).
const matrixPool = document.querySelector("#matrixChips");
if(matrixPool){
  const matrixData = [
    ["Aufklärung, Kritik am Absolutismus","Naturrechte und begrenzte Regierung","vernunftfähig, frei, eigentumsfähig","Grundrechte, Rechtsstaat, Regierung durch Zustimmung"],
    ["Französische Revolution als Warnsignal","Tradition und gewachsene Ordnung schützen Stabilität","begrenzt rational, eingebunden in Geschichte","Konservatismus, Institutionen, vorsichtige Reform"],
    ["Industrialisierung und soziale Frage","Klassenkampf, Kritik an Ausbeutung","durch Produktionsverhältnisse geprägt","Sozialstaat, Arbeitsrechte, Umverteilungsdebatten"],
    ["Aufklärung, Kritik sozialer Ungleichheit","Gesellschaftsvertrag und Gemeinwille","von Natur aus frei, durch Gesellschaft formbar","Volkssouveränität, Partizipation, Gemeinwohl"],
    ["Kritik an Machtkonzentration","Gewaltenteilung verhindert Willkür","machtanfällig, deshalb kontrollbedürftig","Legislative, Exekutive, Judikative, Verfassungsgericht"]
  ];
  const status = document.querySelector("#matrixStatus");
  const drops = Array.from(document.querySelectorAll("#matrixGame .drop"));
  const total = drops.length;
  let selected = null;
  let dragged = null;

  const clearMarks = () => {
    drops.forEach(d => d.classList.remove("correct", "wrong"));
    status.classList.remove("ok");
  };
  const select = chip => {
    if(selected){ selected.classList.remove("sel"); }
    selected = (selected === chip) ? null : chip;
    if(selected){ selected.classList.add("sel"); }
  };
  const place = (chip, target) => {
    // Zielzelle schon belegt? vorhandenen Baustein zurueck in die Sammelbox.
    if(target.classList.contains("drop")){
      const existing = target.querySelector(".mchip");
      if(existing && existing !== chip){ matrixPool.appendChild(existing); }
    }
    target.appendChild(chip);
    if(selected === chip){ chip.classList.remove("sel"); selected = null; }
    clearMarks();
  };

  // Bausteine bauen und mischen.
  const chips = [];
  matrixData.forEach((row, r) => row.forEach((text, c) => chips.push({key:`${r}-${c}`, text})));
  for(let i = chips.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [chips[i], chips[j]] = [chips[j], chips[i]];
  }
  chips.forEach(data => {
    const chip = document.createElement("div");
    chip.className = "mchip";
    chip.textContent = data.text;
    chip.dataset.key = data.key;
    chip.draggable = true;
    chip.tabIndex = 0;
    chip.addEventListener("click", () => select(chip));
    chip.addEventListener("keydown", e => {
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); select(chip); }
    });
    chip.addEventListener("dragstart", e => {
      dragged = chip;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", data.key);
    });
    chip.addEventListener("dragend", () => { dragged = null; });
    matrixPool.appendChild(chip);
  });

  // Ziele: alle Zellen + die Sammelbox (zum Zuruecklegen).
  const targets = drops.concat([matrixPool]);
  targets.forEach(target => {
    target.addEventListener("dragover", e => { e.preventDefault(); target.classList.add("over"); });
    target.addEventListener("dragleave", () => target.classList.remove("over"));
    target.addEventListener("drop", e => {
      e.preventDefault();
      target.classList.remove("over");
      if(dragged){ place(dragged, target); }
    });
    // Antippen: ausgewaehlten Baustein hierher setzen.
    target.addEventListener("click", e => {
      if(!selected){ return; }
      if(e.target.classList && e.target.classList.contains("mchip")){ return; }
      place(selected, target);
    });
  });

  document.querySelector("#matrixCheck").addEventListener("click", () => {
    let ok = 0;
    drops.forEach(d => {
      d.classList.remove("correct", "wrong");
      const chip = d.querySelector(".mchip");
      if(!chip){ return; }
      if(chip.dataset.key === d.dataset.key){ d.classList.add("correct"); ok++; }
      else { d.classList.add("wrong"); }
    });
    status.textContent = ok === total
      ? `Alle ${total} Zellen richtig zugeordnet. Stark!`
      : `${ok} von ${total} Zellen richtig.`;
    status.classList.toggle("ok", ok === total);
  });

  document.querySelector("#matrixReset").addEventListener("click", () => {
    document.querySelectorAll("#matrixGame .mchip").forEach(chip => matrixPool.appendChild(chip));
    if(selected){ selected.classList.remove("sel"); selected = null; }
    clearMarks();
    status.textContent = `0 von ${total} Zellen richtig.`;
  });
}

const opToggle = document.querySelector("#opToggle");
const opPanel = document.querySelector("#opPanel");
const opClose = document.querySelector("#opClose");
if(opToggle && opPanel && opClose){
  const setOp = open => {
    opPanel.classList.toggle("show", open);
    opToggle.setAttribute("aria-expanded", String(open));
    if(open){opClose.focus();}
  };
  opToggle.addEventListener("click", () => setOp(!opPanel.classList.contains("show")));
  opClose.addEventListener("click", () => setOp(false));
  document.addEventListener("keydown", event => {
    if(event.key === "Escape" && opPanel.classList.contains("show")){
      setOp(false);
      opToggle.focus();
    }
  });
}

// Aufgaben: alle dauerhaft offen (keine sequenzielle Sperre) + Fortschritt
// lokal speichern. Der Zaehler/Meter und der Loesungs-Button haengen weiter
// an der Mindestlaenge (data-min): die Musterloesung wird erst nach dem
// Schreiben freigegeben. Alle Eingaben und der aufgedeckte Loesungsstatus
// liegen in localStorage, pro Seite und Aufgaben-Index, und werden beim
// Laden wiederhergestellt.
(function(){
  const tasks = Array.from(document.querySelectorAll(".task"));
  if(!tasks.length){ return; }

  const store = {
    key(i){ return `ptheorie:${currentPage}:${i}`; },
    load(i){ try { return JSON.parse(localStorage.getItem(this.key(i))) || {}; } catch(e){ return {}; } },
    save(i, data){ try { localStorage.setItem(this.key(i), JSON.stringify(data)); } catch(e){} },
    clear(n){ for(let i = 0; i < n; i++){ try { localStorage.removeItem(this.key(i)); } catch(e){} } }
  };

  const model = tasks.map((task, i) => {
    const area = task.querySelector("textarea");
    if(!area){ return null; } // Quiz-Aufgabe (data-quiz): eigener Engine unten
    const min = Number(area.dataset.min || 120);
    const saved = store.load(i);
    if(typeof saved.v === "string"){ area.value = saved.v; }
    const reveal = task.querySelector(".reveal");
    // Loesung nur wieder zeigen, wenn zuvor aufgedeckt UND Aufgabe erfuellt.
    // (Ignoriert veraltete r:true-Flags aus der frueheren "immer offen"-Phase.)
    if(reveal && saved.r && area.value.trim().length >= min){ reveal.classList.add("show"); }
    const note = document.createElement("div");
    note.className = "lock-note";
    note.innerHTML = `<span class="lock-ic">&#128274;</span> Erst die vorherige Aufgabe bearbeiten (mind. ${min} Zeichen).`;
    task.insertBefore(note, task.firstChild);
    return {
      task, area, min, reveal, note, i,
      count: task.querySelector(".cnt"),
      bar: task.querySelector(".ta-bar i"),
      btn: task.querySelector(".btn:not(.ghost)"),
      done(){ return this.area.value.trim().length >= this.min; }
    };
  }).filter(Boolean);

  function refreshMeter(m){
    const len = m.area.value.trim().length;
    if(m.count){ m.count.textContent = `${len} Zeichen`; }
    if(m.bar){ m.bar.style.transform = `scaleX(${Math.min(1, len / m.min)})`; }
  }
  function persist(m){
    store.save(m.i, {v: m.area.value, r: m.reveal ? m.reveal.classList.contains("show") : false});
  }
  // Loesungs-Button erst freigeben, wenn die Mindestlaenge erreicht ist.
  function refreshBtn(m){
    if(m.btn){ m.btn.disabled = !m.done(); }
  }
  // Alle Aufgaben dauerhaft offen: keine sequenzielle Sperre mehr.
  function applyLocks(){
    model.forEach(m => {
      m.task.classList.remove("locked");
      m.area.disabled = false;
      refreshMeter(m);
    });
  }

  model.forEach(m => {
    refreshBtn(m);
    if(m.btn){
      m.btn.addEventListener("click", () => {
        if(m.done() && m.reveal){ m.reveal.classList.add("show"); persist(m); }
      });
    }
    m.area.addEventListener("input", () => {
      refreshMeter(m);
      refreshBtn(m);
      persist(m);
    });
  });
  applyLocks();

  // Fortschritt dieser Seite zuruecksetzen.
  const host = document.querySelector(".page-nav") ? document.querySelector(".page-nav").parentNode : tasks[0].parentNode;
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "progress-reset";
  reset.textContent = "Eingaben auf dieser Seite loeschen";
  reset.addEventListener("click", () => {
    if(confirm("Alle Eingaben auf dieser Seite loeschen?")){
      store.clear(tasks.length);
      location.reload();
    }
  });
  const nav = document.querySelector(".page-nav");
  if(nav){ host.insertBefore(reset, nav); } else { host.appendChild(reset); }
})();

document.querySelectorAll(".diff").forEach(diff => {
  const buttons = diff.querySelectorAll(".diff-btn");
  const bodies = diff.querySelectorAll(".diff-body");
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      bodies[index].classList.toggle("show");
    });
  });
});

const progress = document.querySelector("#progress");
if(progress){
  window.addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    progress.style.transform = `scaleX(${p})`;
  }, {passive:true});
}

// Interaktive Aufgaben (Quiz): Multiple Choice, Mehrfachauswahl, Wahr/Falsch,
// Zuordnung. Deklarativ ueber data-quiz im Markup. Auswahl und Loesungsstatus
// liegen unter demselben Schluessel wie die Textaufgaben
// (ptheorie:<seite>:<index>, Index = Position in allen .task), damit der
// vorhandene Seiten-Reset auch die Quizzes zuruecksetzt.
(function(){
  const quizzes = Array.from(document.querySelectorAll(".task[data-quiz]"));
  if(!quizzes.length){ return; }
  const allTasks = Array.from(document.querySelectorAll(".task"));
  const qstore = {
    key(i){ return `ptheorie:${currentPage}:${i}`; },
    load(i){ try { return JSON.parse(localStorage.getItem(this.key(i))) || {}; } catch(e){ return {}; } },
    save(i, data){ try { localStorage.setItem(this.key(i), JSON.stringify(data)); } catch(e){} }
  };
  function showFb(fb, kind, text){
    if(!fb){ return; }
    fb.textContent = text;
    fb.classList.remove("ok", "warn");
    fb.classList.add("show", kind);
  }

  // Multiple Choice: genau eine richtige Antwort, Sofort-Feedback.
  function initMC(quiz, idx, saved){
    const choices = Array.from(quiz.querySelectorAll(".choice"));
    const fb = quiz.querySelector(".quiz-fb");
    const explain = quiz.dataset.explain || "";
    function solve(){
      choices.forEach(c => {
        c.disabled = true;
        if(c.hasAttribute("data-correct")){ c.classList.add("correct"); }
      });
      showFb(fb, "ok", explain ? "Richtig. " + explain : "Richtig.");
    }
    if(saved.solved){ solve(); return; }
    choices.forEach(c => {
      c.addEventListener("click", () => {
        if(c.hasAttribute("data-correct")){
          solve();
          qstore.save(idx, {type:"mc", solved:true});
        } else {
          c.classList.add("wrong");
          c.disabled = true;
          showFb(fb, "warn", "Nicht ganz - versuch eine andere Antwort.");
        }
      });
    });
  }

  // Mehrfachauswahl: mehrere richtige Antworten, Auswertung erst per Pruefen.
  function initMulti(quiz, idx, saved){
    const choices = Array.from(quiz.querySelectorAll(".choice"));
    const fb = quiz.querySelector(".quiz-fb");
    const check = quiz.querySelector(".quiz-check");
    const explain = quiz.dataset.explain || "";
    let solved = false;
    (saved.sel || []).forEach(i => {
      if(choices[i]){ choices[i].classList.add("selected"); }
    });
    choices.forEach(c => {
      c.setAttribute("aria-pressed", c.classList.contains("selected") ? "true" : "false");
      c.addEventListener("click", () => {
        if(solved){ return; }
        const on = c.classList.toggle("selected");
        c.setAttribute("aria-pressed", String(on));
        c.classList.remove("correct", "wrong", "missed");
        if(fb){ fb.classList.remove("show"); }
      });
    });
    function evaluate(persist){
      let allRight = true;
      choices.forEach(c => {
        const chosen = c.classList.contains("selected");
        const correct = c.hasAttribute("data-correct");
        c.classList.remove("wrong", "correct", "missed");
        if(chosen && correct){ c.classList.add("correct"); }
        else if(chosen && !correct){ c.classList.add("wrong"); allRight = false; }
        else if(!chosen && correct){ c.classList.add("missed"); allRight = false; }
      });
      if(allRight){
        solved = true;
        choices.forEach(c => { c.disabled = true; });
        if(check){ check.disabled = true; }
        showFb(fb, "ok", explain ? "Alles richtig. " + explain : "Alles richtig.");
      } else {
        showFb(fb, "warn", "Noch nicht komplett. Gruen = richtig gewaehlt, rot = falsch gewaehlt, gestrichelt = fehlt.");
      }
      if(persist){
        const sel = choices.map((c, i) => c.classList.contains("selected") ? i : -1).filter(i => i >= 0);
        qstore.save(idx, {type:"multi", sel, solved});
      }
    }
    if(check){ check.addEventListener("click", () => evaluate(true)); }
    if(saved.solved){ evaluate(false); }
  }

  // Wahr/Falsch: jede Aussage einzeln, Sofort-Feedback pro Zeile.
  function initTF(quiz, idx, saved){
    const rows = Array.from(quiz.querySelectorAll(".tf-row"));
    const fb = quiz.querySelector(".quiz-fb");
    const explain = quiz.dataset.explain || "";
    const done = new Set(saved.done || []);
    function markSolved(row){
      row.classList.add("solved");
      row.querySelectorAll(".tf-btn").forEach(b => {
        b.disabled = true;
        if(b.dataset.val === row.dataset.answer){ b.classList.add("correct"); }
      });
    }
    function checkAll(){
      if(rows.length && rows.every(r => r.classList.contains("solved"))){
        showFb(fb, "ok", explain ? "Alle Aussagen richtig eingeordnet. " + explain : "Alle Aussagen richtig eingeordnet.");
      }
    }
    rows.forEach((row, i) => {
      if(done.has(i)){ markSolved(row); }
      row.querySelectorAll(".tf-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          if(row.classList.contains("solved")){ return; }
          if(btn.dataset.val === row.dataset.answer){
            markSolved(row);
            done.add(i);
            qstore.save(idx, {type:"tf", done:[...done]});
            checkAll();
          } else {
            btn.classList.add("wrong");
            btn.disabled = true;
          }
        });
      });
    });
    checkAll();
  }

  // Zuordnung: links Begriff antippen, rechts passende Aussage antippen.
  function initMatch(quiz, idx, saved){
    const left = quiz.querySelector('.match-col[data-side="left"]');
    const right = quiz.querySelector('.match-col[data-side="right"]');
    const fb = quiz.querySelector(".quiz-fb");
    const explain = quiz.dataset.explain || "";
    const leftItems = Array.from(left.querySelectorAll(".match-item"));
    const rightItems = Array.from(right.querySelectorAll(".match-item"));
    const total = leftItems.length;
    const matched = new Set(saved.matched || []);
    // Rechte Spalte mischen, solange noch nichts geloest ist.
    if(!matched.size){
      const shuffled = rightItems.slice();
      for(let i = shuffled.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      shuffled.forEach(el => right.appendChild(el));
    }
    let pick = null;
    function markDone(pair){
      quiz.querySelectorAll(`.match-item[data-pair="${pair}"]`).forEach(el => {
        el.classList.add("done");
        el.classList.remove("picked");
        el.disabled = true;
      });
    }
    function finish(){
      if(matched.size === total){
        showFb(fb, "ok", explain ? "Alle Paare richtig zugeordnet. " + explain : "Alle Paare richtig zugeordnet.");
      }
    }
    matched.forEach(p => markDone(p));
    leftItems.forEach(el => el.addEventListener("click", () => {
      if(el.disabled){ return; }
      if(pick){ pick.classList.remove("picked"); }
      pick = (pick === el) ? null : el;
      if(pick){ pick.classList.add("picked"); }
    }));
    rightItems.forEach(el => el.addEventListener("click", () => {
      if(el.disabled || !pick){ return; }
      if(el.dataset.pair === pick.dataset.pair){
        matched.add(Number(pick.dataset.pair));
        markDone(Number(pick.dataset.pair));
        pick = null;
        qstore.save(idx, {type:"match", matched:[...matched]});
        finish();
      } else {
        const a = pick, b = el;
        a.classList.add("wrong"); b.classList.add("wrong");
        a.classList.remove("picked");
        pick = null;
        setTimeout(() => { a.classList.remove("wrong"); b.classList.remove("wrong"); }, 700);
      }
    }));
    finish();
  }

  quizzes.forEach(quiz => {
    const idx = allTasks.indexOf(quiz);
    const saved = qstore.load(idx);
    const type = quiz.dataset.quiz;
    if(type === "mc"){ initMC(quiz, idx, saved); }
    else if(type === "multi"){ initMulti(quiz, idx, saved); }
    else if(type === "tf"){ initTF(quiz, idx, saved); }
    else if(type === "match"){ initMatch(quiz, idx, saved); }
  });
})();

// Sequenzielle Sperre: Aufgaben muessen der Reihe nach bearbeitet werden.
// Eine Aufgabe wird erst freigeschaltet, wenn alle vorherigen abgeschlossen
// sind. Gilt fuer Textaufgaben (Mindestlaenge) und alle Quiz-Typen. Laeuft
// nach den beiden Engines oben, damit gespeicherter Fortschritt schon im
// DOM steht, und wird nach jeder Eingabe/jedem Klick neu ausgewertet.
(function(){
  const tasks = Array.from(document.querySelectorAll(".task"));
  if(tasks.length < 2){ return; }

  function taskDone(task){
    const area = task.querySelector("textarea");
    if(area){
      const min = Number(area.dataset.min || 120);
      return area.value.trim().length >= min;
    }
    const type = task.dataset.quiz;
    if(type === "mc"){ return !!task.querySelector(".choice.correct"); }
    if(type === "multi"){ const chk = task.querySelector(".quiz-check"); return chk ? chk.disabled : false; }
    if(type === "tf"){
      const rows = Array.from(task.querySelectorAll(".tf-row"));
      return rows.length > 0 && rows.every(r => r.classList.contains("solved"));
    }
    if(type === "match"){
      const li = Array.from(task.querySelectorAll('.match-col[data-side="left"] .match-item'));
      return li.length > 0 && li.every(el => el.classList.contains("done"));
    }
    return true; // unbekannt: nicht blockieren
  }

  // Jede Aufgabe braucht eine Sperr-Notiz (Textaufgaben haben schon eine).
  tasks.forEach(task => {
    if(!task.querySelector(".lock-note")){
      const note = document.createElement("div");
      note.className = "lock-note";
      note.innerHTML = '<span class="lock-ic">&#128274;</span> Erst die vorherige Aufgabe abschliessen, dann wird diese freigeschaltet.';
      task.insertBefore(note, task.firstChild);
    }
  });

  function refresh(){
    let blocked = false;
    tasks.forEach(task => {
      if(blocked){
        task.classList.add("locked");
      } else {
        task.classList.remove("locked");
        if(!taskDone(task)){ blocked = true; } // aktuelle Aufgabe: Rest gesperrt
      }
    });
  }

  // Nach den Engine-Handlern neu auswerten (Bubble-Phase + naechster Tick).
  const schedule = () => setTimeout(refresh, 0);
  document.addEventListener("input", schedule);
  document.addEventListener("click", schedule);
  refresh();
})();
