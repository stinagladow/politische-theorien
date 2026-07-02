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

// Aufgaben: sequenziell freischalten + Fortschritt lokal speichern.
// Eine Aufgabe gilt als bearbeitet, sobald der Text die Mindestlaenge
// (data-min) erreicht; erst dann wird die naechste Aufgabe entsperrt.
// Alle Eingaben und der aufgedeckte Loesungsstatus liegen in localStorage,
// pro Seite und Aufgaben-Index, und werden beim Laden wiederhergestellt.
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
    const min = Number(area.dataset.min || 120);
    const saved = store.load(i);
    if(typeof saved.v === "string"){ area.value = saved.v; }
    const reveal = task.querySelector(".reveal");
    if(saved.r){ reveal.classList.add("show"); }
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
  });

  function refreshMeter(m){
    const len = m.area.value.trim().length;
    m.count.textContent = `${len} Zeichen`;
    m.bar.style.transform = `scaleX(${Math.min(1, len / m.min)})`;
    m.btn.disabled = len < m.min || m.reveal.classList.contains("show");
  }
  function persist(m){
    store.save(m.i, {v: m.area.value, r: m.reveal.classList.contains("show")});
  }
  function applyLocks(){
    let prevDone = true;
    model.forEach(m => {
      const unlocked = prevDone;
      m.task.classList.toggle("locked", !unlocked);
      m.area.disabled = !unlocked;
      if(unlocked){ refreshMeter(m); } else { m.btn.disabled = true; }
      prevDone = unlocked && m.done();
    });
  }

  model.forEach(m => {
    m.area.addEventListener("input", () => {
      refreshMeter(m);
      persist(m);
      applyLocks();
    });
    m.btn.addEventListener("click", () => {
      m.reveal.classList.add("show");
      m.btn.disabled = true;
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
    if(confirm("Alle Eingaben auf dieser Seite loeschen und Aufgaben wieder sperren?")){
      store.clear(model.length);
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
