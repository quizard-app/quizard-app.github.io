import{t as e}from"./topics-CMOvnQe4.js";import{E as t,H as n,K as r,O as i,S as a,k as o,p as s,x as c,y as l}from"./index-B8CPJJlg.js";import{r as u}from"./gemini-DfbjurkX.js";import{i as d}from"./quiz-ai-BaFfhdEd.js";import{t as f}from"./shareModal-C6JOYYPE.js";var p=[`mcq`,`tf`,`fib`,`id`,`matching`,`ordering`,`short`,`except`,`multi`],m=!1;function h(){m=!1}async function g(h,g){m=!0;let b=await n(g.state.currentDocId);if(!b||!m){g.go(`library`);return}let x=g.getConfig(b.id),S=x.count,C={...x.mix},w=x.difficulty,T=x.shuffle,E=x.timerSec,D=x.fresh,O=x.ai!==!1,k=O&&x.aiAuthor===!0,A=!!x.focusWeak,j=x.deepVisual!==!1,M=Array.isArray(b.topics)&&b.topics.length?b.topics:e(b.text).topics,N=new Set(x.topics||[]),P=i(b,{...x,topics:[...N]});S>P&&(S=Math.max(1,P)),h.innerHTML=`
    <header class="back-header">
      <button class="icon-btn" id="back-btn" data-tooltip="Back to library">${a(`chevronLeft`)}</button>
      <h2>Quiz Setup</h2>
      <button class="icon-btn" id="theme-btn" data-tooltip="${g.state.theme===`dark`?`Switch to light mode`:`Switch to dark mode`}">${g.state.theme===`dark`?a(`sun`):a(`moon`)}</button>
    </header>
    <div class="screen has-actionbar setup-screen">
      <div class="setup-hero">
        <div class="doc-icon ${b.type}">${a(`fileText`)}</div>
        <div style="min-width:0">
          <div class="doc-name">${s(b.name)}</div>
          <div class="doc-meta">${c(b.type)} · ${b.wordCount.toLocaleString()} words</div>
        </div>
      </div>

      ${l(`Number of questions`)}
      <div class="card row" style="padding:13px 16px;border-top:none">
        <span class="label">Questions</span>
        <div class="stepper" data-tooltip="How many questions to generate (1–200)">
          <button id="count-minus" data-tooltip="Fewer questions">−</button>
          <span class="val" id="count-val">${S}</span>
          <button id="count-plus" data-tooltip="More questions">+</button>
        </div>
      </div>
      <p class="faint" id="pool-hint" style="font-size:12px;margin:8px 4px 0"></p>
      ${l(`Question types`)}
      <div class="type-grid">
        ${p.map(e=>`
          <button class="type-card ${C[e]?`on`:``}" data-type="${e}" data-tooltip="${y(e)}">
            <div class="t-head">${_(e)}${t[e].name}</div>
            <div class="t-sub">${v(e)}</div>
            <div class="t-count" data-count-for="${e}"></div>
          </button>`).join(``)}
      </div>

      ${M.length?`
      ${l(`Topics in this document`)}
      <div class="chip-row" id="topic-row">
        <button class="chip ${N.size===0?`on`:``}" data-topic-all data-tooltip="Include every topic in the quiz">All topics</button>
        ${M.map(e=>`
          <button class="chip ${N.has(e.title)?`on`:``}" data-topic="${s(e.title)}" data-tooltip="Focus questions on this topic only">
            ${s(e.title)} <span class="chip-count">${e.count}</span>
          </button>`).join(``)}
      </div>
      <p class="faint" id="topic-hint" style="font-size:12px;margin:8px 4px 0"></p>`:``}

      ${l(`Difficulty`)}
      <div class="seg" id="diff-seg" data-tooltip="Easier = common terms · Harder = rare terms">
        <button data-diff="easy" class="${w===`easy`?`on`:``}" data-tooltip="Common, frequently-appearing terms">Easy</button>
        <button data-diff="medium" class="${w===`medium`?`on`:``}" data-tooltip="Balanced mix of terms">Medium</button>
        <button data-diff="hard" class="${w===`hard`?`on`:``}" data-tooltip="Rare, specific technical terms">Hard</button>
        <button data-diff="adaptive" class="${w===`adaptive`?`on`:``}" data-tooltip="Rises to rarer terms on a streak, eases off after a miss">Adaptive</button>
      </div>

      ${l(`Options`)}
      <div class="card" style="padding:2px 16px;border-top:1px solid var(--border)">
        <div class="row" data-tooltip="Google Gemini writes complete exam-style questions from the parsed content">
          <div><div class="label">AI-written questions</div><div class="sub">${u()?`Gemini · key set`:`Gemini · add a free key in Settings`}</div></div>
          <div class="switch ${O?`on`:``}" id="sw-ai" data-tooltip="Toggle AI question writing"></div>
        </div>
        <div class="row" id="author-row" ${O?``:`style="display:none"`} data-tooltip="Gemini authors the whole quiz from scratch — why and scenario questions, not just rephrased sentences">
          <div><div class="label">↳ Full AI authoring</div><div class="sub">AI writes every question from the whole document</div></div>
          <div class="switch ${k?`on`:``}" id="sw-author" data-tooltip="Toggle full AI authoring"></div>
        </div>
        <div class="row" data-tooltip="When on, the next attempt uses a new random order">
          <div><div class="label">Shuffle questions</div><div class="sub">Randomize order every attempt</div></div>
          <div class="switch ${T?`on`:``}" id="sw-shuffle" data-tooltip="Toggle shuffling"></div>
        </div>
        <div class="row">
          <div><div class="label">Timer</div><div class="sub">Seconds per question</div></div>
          <div class="seg" id="timer-seg" style="grid-auto-columns:auto;width:auto" data-tooltip="Add time pressure per question">
            ${[0,15,30].map(e=>`<button data-sec="${e}" style="padding:8px 14px" class="${E===e?`on`:``}">${e===0?`Off`:e+`s`}</button>`).join(``)}
          </div>
        </div>
        <div class="row" style="border-bottom:none" data-tooltip="On = brand-new questions each time; Off = identical quiz">
          <div><div class="label">Fresh questions each attempt</div><div class="sub">Regenerate from the document instead of repeating</div></div>
          <div class="switch ${D?`on`:``}" id="sw-fresh" data-tooltip="Toggle fresh generation"></div>
        </div>
        <div class="row" style="border-bottom:none" data-tooltip="Weight questions toward terms you've gotten wrong before, across all your quizzes">
          <div><div class="label">Focus my weak spots</div><div class="sub">Bias generation toward your past mistakes</div></div>
          <div class="switch ${A?`on`:``}" id="sw-weak" data-tooltip="Toggle weakness-aware generation"></div>
        </div>
        <div class="row" style="border-bottom:none" data-tooltip="Gemini analyzes page images, diagrams, code & charts; GLM writes the questions so you're quizzed on the visuals too">
          <div><div class="label">Deep visual analysis</div><div class="sub">Questions from diagrams, code & charts</div></div>
          <div class="switch ${j?`on`:``}" id="sw-visual" data-tooltip="Toggle visual analysis"></div>
        </div>
      </div>

      <div class="setup-actionbar">
        <button class="btn btn-primary" id="start-btn" style="font-size:15px;padding:15px">
          ${a(`play`)} Start Quiz
        </button>
        <button class="btn btn-secondary" id="share-btn" style="margin-top:10px;width:100%" data-tooltip="Generate this quiz and get a link to send — no app or key needed to play">
          ${a(`share`)} Share quiz link
        </button>
        <p class="center faint" id="gen-note" style="font-size:12px;margin-top:10px"></p>
      </div>
    </div>
  `;let F=h.querySelector(`#pool-hint`),I=h.querySelector(`#gen-note`),L=h.querySelector(`#topic-hint`);function R(){h.querySelectorAll(`#topic-row [data-topic]`).forEach(e=>{e.classList.toggle(`on`,N.has(e.dataset.topic))}),h.querySelector(`[data-topic-all]`)?.classList.toggle(`on`,N.size===0),L&&(L.textContent=N.size?`Focusing on ${N.size} topic${N.size===1?``:`s`} — other topics are excluded`:`Questions will cover the whole document`)}h.querySelectorAll(`#topic-row [data-topic]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.topic;N.has(t)?N.delete(t):N.add(t),R(),z(),B()})),h.querySelector(`[data-topic-all]`)?.addEventListener(`click`,()=>{N.clear(),R(),z(),B()}),R();function z(){P=i(b,{count:999,mix:{...C},difficulty:w,topics:[...N]}),S>P&&(S=Math.max(1,P)),h.querySelector(`#count-val`).textContent=S,F&&(F.textContent=P<5?`This document supports about ${P} question${P===1?``:`s`} with current settings`:`Up to ~${P} questions available from this document`)}function B(){let e=p.filter(e=>C[e]),t=e.length?S:0;for(let n of p){let r=h.querySelector(`[data-count-for="${n}"]`);r.textContent=C[n]?`~${Math.max(1,Math.round(t/e.length))} questions`:`Off`}I.textContent=e.length?``:`Select at least one question type`,h.querySelector(`#start-btn`).disabled=!e.length}B(),z();function V(e){S=Math.min(P||200,Math.min(200,Math.max(1,e))),h.querySelector(`#count-val`).textContent=S,B()}h.querySelector(`#count-minus`).addEventListener(`click`,()=>V(S-(S>10?5:1))),h.querySelector(`#count-plus`).addEventListener(`click`,()=>V(S+(S>=10?5:1))),h.querySelectorAll(`.type-card`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.type,n=Object.values(C).filter(Boolean).length;C[t]&&n===1||(C[t]=!C[t],e.classList.toggle(`on`,C[t]),B())})),h.querySelectorAll(`#diff-seg button`).forEach(e=>e.addEventListener(`click`,()=>{w=e.dataset.diff,h.querySelectorAll(`#diff-seg button`).forEach(t=>t.classList.toggle(`on`,t===e)),z(),B()})),h.querySelectorAll(`#timer-seg button`).forEach(e=>e.addEventListener(`click`,()=>{E=parseInt(e.dataset.sec,10),h.querySelectorAll(`#timer-seg button`).forEach(t=>t.classList.toggle(`on`,t===e))})),h.querySelector(`#sw-ai`).addEventListener(`click`,e=>{O=!O,e.currentTarget.classList.toggle(`on`,O),O||(k=!1,h.querySelector(`#sw-author`)?.classList.remove(`on`)),h.querySelector(`#author-row`).style.display=O?``:`none`}),h.querySelector(`#sw-author`).addEventListener(`click`,e=>{k=O&&!k,e.currentTarget.classList.toggle(`on`,k)}),h.querySelector(`#sw-shuffle`).addEventListener(`click`,e=>{T=!T,e.currentTarget.classList.toggle(`on`,T)}),h.querySelector(`#sw-fresh`).addEventListener(`click`,e=>{D=!D,e.currentTarget.classList.toggle(`on`,D)}),h.querySelector(`#sw-weak`).addEventListener(`click`,e=>{A=!A,e.currentTarget.classList.toggle(`on`,A)}),h.querySelector(`#sw-visual`).addEventListener(`click`,e=>{j=!j,e.currentTarget.classList.toggle(`on`,j)}),h.querySelector(`#back-btn`).addEventListener(`click`,()=>g.go(`library`)),h.querySelector(`#theme-btn`).addEventListener(`click`,()=>g.toggleTheme()),h.querySelector(`#start-btn`).addEventListener(`click`,async()=>{let e={count:S,mix:{...C},difficulty:w,shuffle:T,timerSec:E,fresh:D,topics:[...N],ai:O,aiAuthor:O&&k,focusWeak:A,deepVisual:j,fixedSeed:null};if(A)try{e.weakTerms=await r(b.id)}catch{e.weakTerms=[]}m&&(g.saveConfig(b.id,e),g.go(`quiz`))}),h.querySelector(`#share-btn`).addEventListener(`click`,async()=>{let e=h.querySelector(`#share-btn`),t=e.innerHTML;e.disabled=!0,e.textContent=`Generating…`;try{let e={count:S,mix:{...C},difficulty:w,shuffle:T,timerSec:E,fresh:D,topics:[...N],ai:O,aiAuthor:O&&k,focusWeak:A,deepVisual:j};if(A)try{e.weakTerms=await r(b.id)}catch{e.weakTerms=[]}let t=null;if(e.ai&&u()&&(t=await d(b,e,()=>{})),(!t||t.error===`not_enough_content`||!t.questions||!t.questions.length)&&(t=o(b,e)),!t||!t.questions||!t.questions.length){g.toast(`Not enough content to build a shareable quiz`,!0);return}f(g,{title:b.name,questions:t.questions,timerSec:e.timerSec,mode:`quiz`})}catch{g.toast(`Could not create a share link`,!0)}finally{e.disabled=!1,e.innerHTML=t}})}function _(e){return{mcq:a(`listChecks`),tf:a(`check`),fib:a(`fileText`),id:a(`target`),matching:a(`gitCompare`),ordering:a(`listOrdered`),short:a(`edit`),except:a(`x`),multi:a(`plus`)}[e]}function v(e){return{mcq:`Pick from 4 choices`,tf:`Judge the statement`,fib:`Complete the sentence`,id:`Name the missing term`,matching:`Match terms to definitions`,ordering:`Put steps in order`,short:`Write a short answer`,except:`Spot the one false statement`,multi:`Pick the two correct statements`}[e]}function y(e){return{mcq:`Choose the correct answer from 4 options`,tf:`Decide if the statement is true or false`,fib:`Fill the blank — complete the sentence`,id:`Type the term that matches the description`,matching:`Pair each term with the sentence that defines it`,ordering:`Arrange the shuffled steps into the correct sequence`,short:`Type a short phrase — graded automatically`,except:`Exam style: three statements are true, one is not`,multi:`Exam style: two statements are correct — select both`}[e]}export{g as render,h as unmount};