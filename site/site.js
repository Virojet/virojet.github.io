'use strict';
const menuButton=document.querySelector('[data-menu-toggle]');
const navPanel=document.getElementById('sidebar');
const veil=document.querySelector('.nav-veil');
function setMenu(open){document.body.classList.toggle('menu-open',open);menuButton?.setAttribute('aria-expanded',String(open));document.querySelector('.workspace').inert=open;if(open){navPanel.querySelector('a,button,input')?.focus();}else{menuButton?.focus();}}
menuButton?.addEventListener('click',()=>setMenu(!document.body.classList.contains('menu-open')));
veil?.addEventListener('click',()=>setMenu(false));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('menu-open'))setMenu(false);});
const navSearch=document.getElementById('nav-search');
navSearch?.addEventListener('input',()=>{const q=navSearch.value.trim().toLowerCase();let total=0;document.querySelectorAll('.nav-group').forEach(group=>{let count=0;group.querySelectorAll('[data-search]').forEach(item=>{item.hidden=!item.dataset.search.includes(q);if(!item.hidden)count++;});group.hidden=count===0;total+=count;});document.getElementById('nav-empty').hidden=total>0;});
const librarySearch=document.getElementById('library-search');
const filterButtons=[...document.querySelectorAll('[data-filter]')];
let activeFilter='all';
function filterLibrary(){const q=librarySearch?.value.trim().toLowerCase()??'';let count=0;document.querySelectorAll('[data-mod-card]').forEach(card=>{card.hidden=!(card.dataset.search.includes(q)&&(activeFilter==='all'||card.dataset.group===activeFilter));if(!card.hidden)count++;});const empty=document.getElementById('library-empty');if(empty)empty.hidden=count>0;const result=document.getElementById('result-count');if(result)result.textContent=`${count} project${count===1?'':'s'}`;}
librarySearch?.addEventListener('input',filterLibrary);
filterButtons.forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.filter;filterButtons.forEach(x=>x.setAttribute('aria-pressed',String(x===button)));filterLibrary();}));
const browserSelect=document.getElementById('browser-select');
const browserLinks={chrome:'https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo',edge:'https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd',firefox:'https://addons.mozilla.org/firefox/addon/tampermonkey/',opera:'https://www.tampermonkey.net/',other:'https://www.tampermonkey.net/'};
function setBrowser(){if(!browserSelect)return;document.getElementById('manager-link').href=browserLinks[browserSelect.value];const note=document.getElementById('chromium-note');if(note)note.hidden=browserSelect.value==='firefox';}
browserSelect?.addEventListener('change',setBrowser);
setBrowser();
document.querySelectorAll('[data-copy-install]').forEach(button=>button.addEventListener('click',async()=>{const url=button.dataset.copyInstall;const status=document.getElementById('copy-status');try{await navigator.clipboard.writeText(url);status.textContent='Install link copied.';}catch{const field=document.getElementById('install-url');field.hidden=false;field.value=url;field.focus();field.select();status.textContent='Select and copy the install link below.';}}));

const desktop=window.matchMedia("(min-width: 961px)");desktop.addEventListener("change",event=>{if(event.matches&&document.body.classList.contains("menu-open"))setMenu(false);});
document.addEventListener("keydown",event=>{if(event.key!=="Tab"||!document.body.classList.contains("menu-open"))return;const items=[...navPanel.querySelectorAll("a[href],button,input")].filter(item=>!item.closest("[hidden]"));const first=items[0],last=items[items.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
