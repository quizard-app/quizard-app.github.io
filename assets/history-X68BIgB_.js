import{$ as e,K as t,N as n,P as r,S as i,Z as a,_ as o,b as s,f as c,h as l,l as u,o as d,p as f,v as p,y as m}from"./index-CcyAXynw.js";import{startDueReview as h,startMasterReview as g,startMistakeReview as _,startWeakReview as v}from"./mistakes-Lg4E0PRD.js";function y(e){let t=new Date(e);return`${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`}function b(e){if(!e.length)return 0;let t=new Set(e.map(e=>y(e.date))),n=new Date,r=new Date(Date.now()-864e5),i=null;if(t.has(y(n.getTime())))i=n;else if(t.has(y(r.getTime())))i=r;else return 0;let a=0,o=new Date(i);for(;t.has(y(o.getTime()));)a++,o.setDate(o.getDate()-1);return a}function x(e){let t=e.slice(0,20).reverse();if(!t.length)return``;let n=t.length,r=320/n,i=Math.min(18,r*.62),a=t.map((e,t)=>{let a=Math.max(4,e.percent/100*82),o=t*r+(r-i)/2,s=96-a,c=e.percent>=80?`var(--good)`:e.percent>=50?`var(--warn)`:`var(--bad)`;return`<rect x="${o.toFixed(1)}" y="${s.toFixed(1)}" width="${i.toFixed(1)}" height="${a.toFixed(1)}" rx="3.5" fill="${c}" opacity="${t===n-1?1:.55}"/>`}).join(``),o=t[n-1].percent;return`
    <div class="chart-wrap">
      <div class="chart-head">
        <span class="section-title" style="margin:0">Last ${n} quiz${n>1?`zes`:``}</span>
        <span class="score-pill ${p(o)}">${o}% latest</span>
      </div>
      <svg viewBox="0 0 320 110" preserveAspectRatio="none" class="trend-svg">
        <line x1="0" y1="96" x2="320" y2="96" stroke="var(--surface-3)" stroke-width="1.5"/>
        ${a}
      </svg>
      <div class="chart-x"><span>older</span><span>now</span></div>
    </div>`}async function S(y,S){let[C,w,T,E,D]=await Promise.all([a(),e(),r(),n(),t(null)]),O=C.reduce((e,t)=>e+t.total,0),k=C.reduce((e,t)=>e+t.correct,0),A=O?Math.round(k/O*100):null,j=b(C),M=`
    <header class="app-header">
      <div class="brand"><span class="mark">${i(`logo`)}</span>Progress</div>
      <button class="icon-btn" id="theme-btn" data-tooltip="${S.state.theme===`dark`?`Switch to light mode`:`Switch to dark mode`}">${S.state.theme===`dark`?i(`sun`):i(`moon`)}</button>
    </header>
    <div class="screen hist-screen">
      ${s([{value:j,label:`Day Streak`},{value:C.length,label:`Quizzes`},{value:A==null?`—`:A+`%`,label:`Accuracy`}])}
      ${E?u(`
        ${o(`
          <div style="display:flex;align-items:center;gap:10px">
            <span style="color:var(--accent-strong);display:flex">${i(`zap`)}</span>
            <div>
              <div class="label">${E} card${E===1?``:`s`} due for review</div>
              <div class="sub">Spaced repetition — review them before you forget</div>
            </div>
          </div>
        `,{borderless:!0})}
        <button class="btn btn-primary" id="due-review-btn" style="padding:11px">${i(`refresh`)} Start spaced review</button>
      `,{style:`padding:14px 16px;margin-bottom:14px;border-color:var(--accent-border);background:var(--accent-soft)`}):``}
      ${u(`
        ${o(`
          <div style="display:flex;align-items:center;gap:10px">
            <span style="color:${T?`var(--warn)`:`var(--good)`};display:flex">${i(T?`alert`:`check`)}</span>
            <div>
              <div class="label">${T} mistake${T===1?``:`s`} in the bank</div>
              <div class="sub">${T?`Questions you got wrong — review them until they stick`:`Nothing to review. Keep it up!`}</div>
            </div>
          </div>
        `,{borderless:!0})}
        ${T?`<button class="btn btn-primary" id="review-mistakes-btn" style="padding:11px" data-tooltip="Practice the questions you previously got wrong">${i(`refresh`)} Review all mistakes</button>`:``}
      `,{style:`padding:14px 16px;margin-bottom:14px`})}
      ${D.length?u(`
        ${o(`
          <div style="display:flex;align-items:center;gap:10px">
            <span style="color:var(--bad);display:flex">${i(`target`)}</span>
            <div>
              <div class="label">${D.length} weak term${D.length===1?``:`s`} tracked</div>
              <div class="sub">Questions are weighted toward the terms you miss most often</div>
            </div>
          </div>
        `,{borderless:!0})}
        <button class="btn btn-primary" id="weak-review-btn" style="padding:11px" data-tooltip="Review your weakest terms first">${i(`target`)} Review weak spots</button>
      `,{style:`padding:14px 16px;margin-bottom:14px`}):``}
      ${w.length?u(`
        ${o(`
          <div style="display:flex;align-items:center;gap:10px">
            <span style="color:var(--accent-strong);display:flex">${i(`sparkles`)}</span>
            <div>
              <div class="label">Master review</div>
              <div class="sub">One mixed session across all ${w.length} document${w.length===1?``:`s`} — due cards, fresh questions, old mistakes</div>
            </div>
          </div>
        `,{borderless:!0})}
        <button class="btn btn-primary" id="master-review-btn" style="padding:11px" data-tooltip="Interleaved review across your whole library">${i(`sparkles`)} Start master review</button>
      `,{style:`padding:14px 16px;margin-bottom:14px;border-color:var(--accent-border);background:var(--accent-soft)`}):``}
  `;M+=x(C);let N=w.filter(e=>e.attempts>0);if(N.length){let e=``;for(let t of N.slice(0,6)){let n=t.bestScore==null?0:t.bestScore,r=n>=80?`var(--good)`:n>=50?`var(--warn)`:`var(--bad)`;e+=`
        <div class="bd-row">
          <span class="bd-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px">${f(t.name)}</span>
          <div class="bd-bar"><div class="bd-fill" style="width:${n}%;background:${r}"></div></div>
          <span class="bd-score">${t.bestScore==null?`—`:t.bestScore+`%`}</span>
        </div>`}M+=m(`Document mastery`)+u(e,{cls:`breakdown`})}if(!C.length){M+=`
      <div class="empty-state">
        <div class="empty-illust">${d}</div>
        <h3>No progress yet</h3>
        <p>Take your first quiz and your streak, scores and mastery will appear here.</p>
      </div>
    </div>`,y.innerHTML=M,y.querySelector(`#theme-btn`).addEventListener(`click`,()=>S.toggleTheme()),y.querySelector(`#review-mistakes-btn`)?.addEventListener(`click`,()=>_(S,null)),y.querySelector(`#weak-review-btn`)?.addEventListener(`click`,()=>v(S)),y.querySelector(`#master-review-btn`)?.addEventListener(`click`,()=>g(S));return}M+=m(`Recent activity`);let P=new Map;for(let e of C.slice(0,40)){let t=c(e.date);P.has(t)||P.set(t,[]),P.get(t).push(e)}for(let[e,t]of P){M+=`<div class="history-day">`;for(let e of t){let t=p(e.percent);M+=`
        <div class="history-item">
          <div class="hi-icon" style="color:${t===`high`?`var(--good)`:t===`mid`?`var(--warn)`:`var(--bad)`};background:${t===`high`?`var(--good-bg)`:t===`mid`?`var(--warn-bg)`:`var(--bad-bg)`}">${i(e.percent>=50?`trophy`:`flame`)}</div>
          <div class="hi-main">
            <div class="hi-name">${f(e.docName)}</div>
            <div class="hi-meta">${l(e.date)} · ${e.correct}/${e.total} correct · ${Math.round(e.durationSec)}s</div>
          </div>
          <span class="score-pill ${t}">${e.percent}%</span>
        </div>`}M+=`</div>`}M+=`</div>`,y.innerHTML=M,y.querySelector(`#theme-btn`).addEventListener(`click`,()=>S.toggleTheme()),y.querySelector(`#review-mistakes-btn`)?.addEventListener(`click`,()=>_(S,null)),y.querySelector(`#weak-review-btn`)?.addEventListener(`click`,()=>v(S)),y.querySelector(`#due-review-btn`)?.addEventListener(`click`,()=>h(S)),y.querySelector(`#master-review-btn`)?.addEventListener(`click`,()=>g(S))}export{S as render};