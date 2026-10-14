'use strict';
const data=window.portfolioData;
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const behavior=()=>motion.matches?'instant':'smooth';
const track=$('video-track'),films=[...track.querySelectorAll('.film')],videos=[...track.querySelectorAll('video')];
let activeDance=0,danceTimer;
function markDance(index){
  activeDance=index;
  films.forEach((film,i)=>{film.inert=i!==index;film.setAttribute('aria-hidden',String(i!==index));if(i!==index)videos[i].pause();});
  document.querySelectorAll('[data-dance]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.dance)===index)));
  $('dance-prev').disabled=index===0;$('dance-next').disabled=index===films.length-1;
  $('dance-count').textContent=`0${index+1} / 02`;
  $('dance-download').href=videos[index].querySelector('source').getAttribute('src');
  $('dance-status').textContent=index===0?'Dance 2 selected: The WoW goblin dance.':'Dance 1 selected: Goblin groove.';
}
function goDance(index){index=Math.max(0,Math.min(films.length-1,index));markDance(index);track.scrollTo({left:films[index].offsetLeft-films[0].offsetLeft,behavior:behavior()});}
document.querySelectorAll('[data-dance]').forEach(b=>b.addEventListener('click',()=>goDance(Number(b.dataset.dance))));
$('dance-prev').addEventListener('click',()=>goDance(activeDance-1));$('dance-next').addEventListener('click',()=>goDance(activeDance+1));
track.addEventListener('scroll',()=>{clearTimeout(danceTimer);danceTimer=setTimeout(()=>{const step=films[1].offsetLeft-films[0].offsetLeft;markDance(Math.round(track.scrollLeft/step));},140);},{passive:true});
track.addEventListener('keydown',e=>{if(e.target.tagName==='VIDEO')return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();goDance(activeDance+(e.key==='ArrowRight'?1:-1));}});
videos.forEach((v,i)=>{v.addEventListener('play',()=>videos.forEach((other,j)=>{if(i!==j)other.pause();}));v.addEventListener('error',()=>films[i].querySelector('.media-error').hidden=false);v.querySelector('source').addEventListener('error',()=>films[i].querySelector('.media-error').hidden=false);});
markDance(0);
new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)videos.forEach(v=>v.pause());}),{threshold:.05}).observe(track);

const artTrack=$('art-track');
let extras=data.extras,artIndex=0,artTimer,scrollTimer,paused=motion.matches,artVisible=false,hovering=false,focused=false;
const artFocusObserver=new IntersectionObserver(entries=>entries.forEach(e=>{e.target.inert=!e.isIntersecting;e.target.setAttribute('aria-hidden',String(!e.isIntersecting));}),{root:artTrack,threshold:.01});
$('extra-count').textContent=data.extras.length;$('extra-total').textContent=data.extras.length;
const groups=[...new Set(data.extras.map(i=>i.group))];
$('art-filter').innerHTML='<option value="all">All extra artwork</option>'+groups.map(g=>`<option>${escapeHTML(g)}</option>`).join('');
function renderArt(){
 artFocusObserver.disconnect();
 artTrack.innerHTML=extras.map((i,n)=>`<figure class="art-card"><button class="art-visual" data-art="${n}" aria-label="Preview ${escapeHTML(i.title)}"><img src="${i.preview}" alt="${escapeHTML(i.title)} — ${escapeHTML(i.label)}" loading="lazy" width="${i.width}" height="${i.height}"><span class="view-hint" aria-hidden="true">↗</span></button><figcaption><div><h3>${escapeHTML(i.title)}</h3><p>${escapeHTML(i.group)} / ${escapeHTML(i.label)}</p></div><span class="art-number">${String(n+1).padStart(2,'0')}</span></figcaption></figure>`).join('');
 artIndex=0;artTrack.scrollTo({left:0,behavior:'instant'});updateArtCounter();
 [...artTrack.children].forEach(card=>artFocusObserver.observe(card));
}
function updateArtCounter(){ $('art-counter').textContent=`${String(artIndex+1).padStart(2,'0')} / ${extras.length}`; }
function goArt(delta){
 artIndex=(artIndex+delta+extras.length)%extras.length;
 const cards=artTrack.children;
 artTrack.scrollTo({left:cards[artIndex].offsetLeft-cards[0].offsetLeft,behavior:behavior()});updateArtCounter();
}
function resetRotation(){clearInterval(artTimer);if(!paused&&!hovering&&!focused&&artVisible&&!document.hidden&&!$('viewer').open)artTimer=setInterval(()=>goArt(1),4800);}
function updatePause(){ $('art-pause').textContent=paused?'▶ Play carousel':'Ⅱ Pause carousel';$('art-pause').setAttribute('aria-pressed',String(paused));resetRotation(); }
function stopRotation(){paused=true;updatePause();}
$('art-pause').addEventListener('click',()=>{paused=!paused;updatePause();});
$('art-prev').addEventListener('click',()=>{stopRotation();goArt(-1);});$('art-next').addEventListener('click',()=>{stopRotation();goArt(1);});
$('art-filter').addEventListener('change',e=>{stopRotation();extras=e.target.value==='all'?data.extras:data.extras.filter(i=>i.group===e.target.value);renderArt();$('art-announcement').textContent=`${extras.length} images in ${e.target.selectedOptions[0].textContent}.`;});
artTrack.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const cards=artTrack.children;if(cards.length>1){const step=cards[1].offsetLeft-cards[0].offsetLeft;artIndex=Math.min(extras.length-1,Math.round(artTrack.scrollLeft/step));updateArtCounter();}},140);},{passive:true});
artTrack.addEventListener('pointerdown',stopRotation);
artTrack.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stopRotation();goArt(e.key==='ArrowRight'?1:-1);}});
$('art-carousel').addEventListener('mouseenter',()=>{hovering=true;resetRotation();});$('art-carousel').addEventListener('mouseleave',()=>{hovering=false;resetRotation();});
$('art-carousel').addEventListener('focusin',()=>{focused=true;resetRotation();});$('art-carousel').addEventListener('focusout',e=>{if(!$('art-carousel').contains(e.relatedTarget)){focused=false;resetRotation();}});
new IntersectionObserver(entries=>{artVisible=entries[0].isIntersecting;resetRotation();},{threshold:.1}).observe(artTrack);
motion.addEventListener('change',()=>{paused=motion.matches;updatePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause());resetRotation();});
renderArt();updatePause();

$('section-links').innerHTML=data.backgrounds.map(s=>`<a href="backgrounds.html#${s.key}">${escapeHTML(s.title)}<span aria-hidden="true">↗</span></a>`).join('');
let stickerStyle='cute';
function renderStickers(style){
 stickerStyle=style;
 const selected=data.stickers[style];
 $('sticker-grid').innerHTML=selected.map((i,n)=>`<article class="sticker-card"><button class="sticker-visual" data-sticker="${n}" aria-label="Preview ${style} sticker: ${escapeHTML(i.title)}"><img src="${i.preview}" alt="${style==='cute'?'Cute':'Classic'} goblin hosts: ${escapeHTML(i.title)}" loading="lazy" width="1254" height="1254"></button><div class="sticker-caption"><h3>${escapeHTML(i.title)}</h3><a href="${i.path}" download aria-label="Download ${style} ${escapeHTML(i.title)} PNG">PNG ↓</a></div></article>`).join('');
 document.querySelectorAll('[data-sticker-style]').forEach(b=>{const active=b.dataset.stickerStyle===style;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
 $('sticker-panel').setAttribute('aria-labelledby',style+'-tab');
 $('sticker-zip').href=style==='cute'?'downloads/Azeroth-Morning-Radio-Cute-Host-Stickers.zip':'downloads/Azeroth-Morning-Radio-Classic-Host-Stickers.zip';
 $('sticker-zip').textContent=`Download all 7 ${style} stickers ↓`;
 $('sticker-description').textContent=style==='cute'?'Rounder faces, big expressions, and a little extra charm. Six reactions plus the clean host duo.':'Sharper features, sly grins, and classic goblin attitude. Six reactions plus the clean host duo.';
}
document.querySelectorAll('[data-sticker-style]').forEach(b=>{
 b.addEventListener('click',()=>renderStickers(b.dataset.stickerStyle));
 b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'cute':e.key==='End'?'classic':stickerStyle==='cute'?'classic':'cute';renderStickers(next);$(next+'-tab').focus();}});
});
renderStickers('cute');

let previewItems=[],previewIndex=0,previewTrigger;
function showImage(list,index,trigger){
 previewItems=list;previewIndex=(index+list.length)%list.length;const i=list[previewIndex];
 $('viewer-title').textContent=i.title;$('viewer-image').src=i.path;$('viewer-image').alt=i.title;
 $('viewer-description').textContent=i.group?`${i.group} · ${i.label}`:`${stickerStyle==='cute'?'Cute':'Classic'} host collection · Transparent PNG`;
 $('viewer-download').href=i.path;$('viewer-counter').textContent=`${previewIndex+1} / ${list.length}`;
 if(!$('viewer').open){previewTrigger=trigger||document.activeElement;$('viewer').showModal();clearInterval(artTimer);}
}
artTrack.addEventListener('click',e=>{const b=e.target.closest('[data-art]');if(b)showImage(extras,Number(b.dataset.art),b);});
$('sticker-grid').addEventListener('click',e=>{const b=e.target.closest('[data-sticker]');if(b)showImage(data.stickers[stickerStyle],Number(b.dataset.sticker),b);});
$('viewer-close').addEventListener('click',()=>$('viewer').close());
$('viewer-prev').addEventListener('click',()=>showImage(previewItems,previewIndex-1));$('viewer-next').addEventListener('click',()=>showImage(previewItems,previewIndex+1));
$('viewer').addEventListener('click',e=>{if(e.target===$('viewer')){const r=$('viewer').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('viewer').close();}});
$('viewer').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();showImage(previewItems,previewIndex+(e.key==='ArrowRight'?1:-1));}});
$('viewer').addEventListener('close',()=>{previewTrigger?.focus({preventScroll:true});resetRotation();});
window.addEventListener('resize',()=>{track.scrollTo({left:films[activeDance].offsetLeft-films[0].offsetLeft,behavior:'instant'});});
if(data.backgrounds.some(i=>'#'+i.key===location.hash)||location.hash==='#stickers-classic')location.replace('backgrounds.html'+location.hash);

const phrases=window.amrPhrases;
let activePhrase=0,textTimer;
$('phrase-list').innerHTML=phrases.map((p,n)=>`<button data-phrase="${n}" aria-pressed="${n===0}"><span>${String(n+1).padStart(2,'0')}</span><span><b>${escapeHTML(p.name)}</b><small>${escapeHTML(p.kind)}</small></span><span class="phrase-arrow" aria-hidden="true">↗</span></button>`).join('');
function choosePhrase(index){
 activePhrase=index;clearTimeout(textTimer);const p=phrases[index];
 $('text-frame').src=p.path+'?preview=1';$('text-frame').title='Animated preview: '+p.name;
 document.querySelectorAll('[data-phrase]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.phrase)===index)));
 $('phrase-kind').textContent=p.kind+' · '+p.episode;$('phrase-source').href=p.source;
 $('phrase-note').textContent=p.note;$('phrase-download').href=p.path;
 $('text-play-state').textContent='Ready to play';$('text-replay').textContent='▶ Play animation';
}
$('phrase-list').addEventListener('click',e=>{const b=e.target.closest('[data-phrase]');if(b)choosePhrase(Number(b.dataset.phrase));});
$('text-replay').addEventListener('click',()=>{
 clearTimeout(textTimer);$('text-frame').src=phrases[activePhrase].path+'?play='+Date.now();
 $('text-play-state').textContent='Playing · 6 seconds';$('text-replay').textContent='↻ Replay animation';
 textTimer=setTimeout(()=>{$('text-play-state').textContent='Finished · ready to replay';},6300);
});
$('text-background').addEventListener('click',()=>{const transparent=$('text-stage').classList.toggle('transparent');$('text-background').setAttribute('aria-pressed',String(transparent));$('text-background').textContent=transparent?'Show scene background':'Show transparency';});
choosePhrase(0);
