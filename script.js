// c:\Users\KEITA\Documents\MES WEB\app pour les cultivateurs\script.js

// ====== Simple SPA navigation ======
const views = document.querySelectorAll('.view');
function showView(id){
  // Show loader briefly for smooth transition
  toggleLoader(true);
  setTimeout(() => {
    views.forEach(v=>v.classList.remove('active'));
    const el = document.getElementById(id);
    if(el) el.classList.add('active');
    // update bottom nav active
    document.querySelectorAll('.bn button').forEach(b=>b.classList.toggle('active', b.dataset.nav===id));
    
    // Hide nav on auth
    const nav = document.querySelector('nav.bottom');
    if(id === 'auth') nav.style.display = 'none'; else nav.style.display = 'flex';

    toggleLoader(false);
    window.scrollTo(0,0);
  }, 300);
}

function toggleLoader(show){
  const l = document.getElementById('loader');
  if(show) l.classList.add('active'); else l.classList.remove('active');
}

// Home buttons
document.querySelectorAll('[data-nav]').forEach(btn=>{
  btn.addEventListener('click', ()=> showView(btn.dataset.nav));
});

// Back buttons
['backFromMarche','backFromConseils','backFromProfil','backFromVideos','backFromNotif','backFromInbox'].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener('click', ()=> showView('home'));
});

// ====== LocalStorage helpers ======
const storage = {
  get(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def }catch(e){return def} },
  set(key,val){ localStorage.setItem(key, JSON.stringify(val)) }
}

// ====== Weather (simulated) ======
function updateWeather(){
  // For prototype we simulate an alert based on random conditions
  const conditions = [
    {text:'Aucune alerte — temps stable', badge:'OK'},
    {text:'Risque de forte chaleur — protéger le bétail', badge:'CHALEUR'},
    {text:'Pluie importante prévue — retarder les semis', badge:'PLUIE'},
    {text:'Vent fort — attacher les structures légères', badge:'VENT'}
  ];
  const pick = conditions[Math.floor(Math.random()*conditions.length)];
  document.getElementById('weatherText').textContent = pick.text;
  document.getElementById('weatherBadge').textContent = pick.badge;
}
updateWeather();

// ====== Modal Logic ======
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
document.getElementById('closeModal').addEventListener('click', ()=> modal.classList.remove('active'));
function openModal(html){
  modalContent.innerHTML = html;
  modal.classList.add('active');
}

// ====== MARCHE LOGIC ======
function renderMarket(){
  const q = (document.getElementById('marketSearch').value || '').toLowerCase();
  const catFilter = document.getElementById('marketCategoryFilter').value;
  const currentUser = storage.get('currentUser', {});

  let offers = storage.get('market',[
    {title:'Poulets fermiers 1kg',price:800,owner:'Moussa',contact:'+223 6xxxxxxx',category:'Animaux'},
    {title:'Maïs sec 50kg',price:12000,owner:'Fatou',contact:'+223 6xxxxxxx',category:'Céréales'},
    {title:'Poulets fermiers 1kg',price:800,owner:'Moussa',contact:'+223 6xxxxxxx',category:'Animaux', image:'https://placehold.co/300x200/f97316/ffffff?text=Poulet'},
    {title:'Maïs sec 50kg',price:12000,owner:'Fatou',contact:'+223 6xxxxxxx',category:'Céréales', image:'https://placehold.co/300x200/eab308/ffffff?text=Mais'},
    {title:'Engrais NPK 50kg',price:25000,owner:'AgriShop',contact:'+223 7xxxxxxx',category:'Intrants'}
  ]);
  // Migration pour anciens items sans catégorie
  offers = offers.map(o => o.category ? o : {...o, category:'Autre'});

  storage.set('market',offers); // ensure default
  const list = document.getElementById('marketList'); list.innerHTML='';
  
  const icons = { 
    'Céréales':'<i class="fa-solid fa-wheat-awn"></i>', 
    'Légumes':'<i class="fa-solid fa-carrot"></i>', 
    'Fruits':'<i class="fa-solid fa-apple-whole"></i>', 
    'Animaux':'<i class="fa-solid fa-cow"></i>', 
    'Intrants':'<i class="fa-solid fa-flask"></i>', 
    'Autre':'<i class="fa-solid fa-box-open"></i>' 
  };

  offers.forEach((o,idx)=>{
    const matchText = o.title.toLowerCase().includes(q) || o.owner.toLowerCase().includes(q);
    const matchCat = catFilter === '' || o.category === catFilter;

    if(matchText && matchCat){
      const isOwner = currentUser.name && o.owner === currentUser.name;
      const icon = icons[o.category] || '<i class="fa-solid fa-box-open"></i>';
      
      const imgHtml = o.image 
        ? `<img src="${o.image}" style="width:40px;height:40px;border-radius:8px;object-fit:cover">`
        : `<div style="width:40px;height:40px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px">${icon}</div>`;

      let actionBtns = '';
      if(isOwner){
        actionBtns = `<button class='btn' style="flex:1;padding:8px;background:#ef4444;color:white" data-idx='${idx}' data-action='delete'><i class="fa-solid fa-trash"></i> Supprimer</button>`;
      } else {
        actionBtns = `<button class='btn ghost' style="flex:1;padding:8px" data-idx='${idx}' data-action='view'><i class="fa-solid fa-eye"></i> Voir</button>
          <button class='btn' style="flex:1;padding:8px" data-idx='${idx}' data-action='buy'>Acheter</button>`;
      }

      const it = document.createElement('div'); it.className='item';
      it.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px">
          ${imgHtml}
          
          <div>
            <div style="font-weight:700">${o.title}</div>
            <div class="muted" style="font-size:12px">${o.price} FCFA • ${o.owner} ${isOwner ? '(Vous)':''}</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px">
          ${actionBtns}
        </div>`;
      it.style.display = 'block'; // override flex for custom layout
      list.appendChild(it);
    }
  })
}
document.getElementById('marketSearch').addEventListener('input', renderMarket);
document.getElementById('marketCategoryFilter').addEventListener('change', renderMarket);

document.getElementById('marketList').addEventListener('click', e=>{
  const btn = e.target.closest('button'); if(!btn) return; const idx = Number(btn.dataset.idx); const action = btn.dataset.action; let offers = storage.get('market',[]);
  
  if(action === 'delete'){
    if(confirm('Voulez-vous vraiment supprimer cette annonce ?')){
      offers.splice(idx, 1);
      storage.set('market', offers);
      renderMarket();
    }
    return;
  }

  const o = offers[idx];
  if(action==='contact'){ 
    openModal(`<h3>Contacter le vendeur</h3><p><strong>${o.owner}</strong> propose ce produit.</p><div style="background:var(--bg);padding:16px;border-radius:12px;text-align:center;margin-top:16px;font-size:20px;font-weight:bold;color:var(--primary)">${o.contact}</div><p style="text-align:center;margin-top:8px" class="muted">Appelez pour négocier ou réserver.</p><button class="btn" style="width:100%;margin-top:16px" onclick="startChat('${o.owner}')">💬 Discuter dans l'app</button>`);
  }
  if(action==='view'){
    const media = o.image ? `<img src="${o.image}" style="width:100%;height:250px;object-fit:cover;border-radius:12px;margin-bottom:16px;box-shadow:var(--shadow)">` : `<div style="width:100%;height:150px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;border-radius:12px;margin-bottom:16px;font-size:40px">📦</div>`;
    
    openModal(`
      
      <h3 style="font-size:22px;margin-bottom:4px">${o.title}</h3>
      <div style="font-size:24px;font-weight:800;color:var(--primary);margin-bottom:12px">${o.price} FCFA</div>
      <div style="background:var(--bg);padding:16px;border-radius:12px;margin-bottom:24px">
        <div style="font-weight:600;margin-bottom:4px">Vendeur : ${o.owner}</div>
        <div class="muted">Catégorie : ${o.category}</div>
        <div style="margin-top:12px;font-size:18px;font-weight:bold">📞 ${o.contact}</div>
      </div>
      <div style="display:flex;gap:12px">
        <button class="btn ghost" style="flex:1;padding:12px" onclick="startChat('${o.owner}')">💬 Message</button>
        <button class="btn" style="flex:1;padding:12px" onclick="window.location.href='tel:${o.contact}'">📞 Appeler</button>
      </div>
      <button class="btn ghost" style="width:100%;margin-top:12px;border:0" onclick="document.getElementById('closeModal').click()">Fermer</button>
    `);
  }
  if(action==='buy'){ 
    if(confirm(`Confirmer l'intérêt pour ${o.title} ?`)){ 
      openModal(`<h3>Commande initiée !</h3><p>Votre intérêt pour <strong>${o.title}</strong> a été noté.</p><p>Veuillez contacter <strong>${o.owner}</strong> au <strong>${o.contact}</strong> pour le paiement et la livraison.</p>`);
    } 
  }
});

// Toggle Form
const formEl = document.getElementById('offerForm');
document.getElementById('newOfferBtn').addEventListener('click', ()=>{
  formEl.style.display = formEl.style.display==='none' ? 'block' : 'none';
});
document.getElementById('cancelOffer').addEventListener('click', ()=> formEl.style.display='none');

document.getElementById('submitOffer').addEventListener('click', ()=>{
  const title = document.getElementById('offerTitle').value;
  const price = document.getElementById('offerPrice').value;
  const cat = document.getElementById('offerCategory').value;
  const contact = document.getElementById('offerContact').value;
  const imageInput = document.getElementById('offerImage');
  const owner = (storage.get('currentUser') || {}).name || 'Moi';

  if(!title || !price || !contact){ alert('Veuillez remplir les champs'); return }
  
  // Simulate network request
  toggleLoader(true);
  setTimeout(() => {
    const offers = storage.get('market',[]); 
    offers.unshift({title, price:Number(price), owner, contact, category:cat}); 
    storage.set('market',offers); 
    
    renderMarket();
    formEl.style.display='none';
    toggleLoader(false);
    // Clear inputs
    document.getElementById('offerTitle').value=''; document.getElementById('offerPrice').value=''; document.getElementById('offerContact').value='';
    alert('Annonce publiée avec succès !');
  }, 1000);
  
  const saveOffer = (imgData) => {
    setTimeout(() => {
      const offers = storage.get('market',[]); 
      offers.unshift({title, price:Number(price), owner, contact, category:cat, image:imgData}); 
      storage.set('market',offers); 
      
      renderMarket();
      formEl.style.display='none';
      toggleLoader(false);
      // Clear inputs
      document.getElementById('offerTitle').value=''; document.getElementById('offerPrice').value=''; document.getElementById('offerContact').value=''; document.getElementById('offerImage').value='';
      alert('Annonce publiée avec succès !');
    }, 1000);
  };

  if(imageInput.files && imageInput.files[0]){
    const reader = new FileReader();
    reader.onload = function(e){ saveOffer(e.target.result); };
    reader.readAsDataURL(imageInput.files[0]);
  } else {
    saveOffer(null);
  }
});

// ====== CONSEILS ======
function renderArticles(){
  const articles = storage.get('articles_v3',[
    {id:'1', type:'elevage', title:'Chaleur & Poulets', video:'https://www.youtube.com/embed/tgbNymZ7vqY', excerpt:'Techniques pour réduire le stress thermique.'},
    {id:'2', type:'agri', title:'Rotation des cultures', image:'https://placehold.co/300x200/16a34a/ffffff?text=Rotation', excerpt:'Pourquoi alterner vos cultures chaque saison.'},
    {id:'3', type:'elevage', title:'Vaccins Dindons', image:'https://placehold.co/300x200/f97316/ffffff?text=Vaccins', excerpt:'Calendrier recommandé de vaccinations.'},
    {id:'4', type:'agri', title:'Engrais Organiques', image:'https://placehold.co/300x200/16a34a/ffffff?text=Engrais', excerpt:'Fabriquer son propre compost.'},
    {id:'5', type:'formation', title:'Gestion Financière', image:'https://placehold.co/300x200/2563eb/ffffff?text=Gestion', excerpt:'Tenir un cahier de dépenses simple.'},
    {id:'6', type:'formation', title:'Marketing Agricole', image:'https://placehold.co/300x200/2563eb/ffffff?text=Vente', excerpt:'Comment mieux vendre ses produits.'}
  ]);
  
  // Ensure IDs exist (migration)
  articles.forEach((a,i) => { if(!a.id) a.id = 'art_'+Date.now()+'_'+i; });
  
  storage.set('articles_v3',articles);
  
  const agriList = document.getElementById('agriList'); agriList.innerHTML='';
  const elevageList = document.getElementById('elevageList'); elevageList.innerHTML='';
  const formationList = document.getElementById('formationList'); formationList.innerHTML='';
  const allConseilsList = document.getElementById('allConseilsList'); if(allConseilsList) allConseilsList.innerHTML='';
  const conseilsCategories = document.getElementById('conseilsCategories');

  const qAgri = (document.getElementById('searchAgri').value || '').toLowerCase();
  const typeAgri = document.getElementById('filterTypeAgri').value;
  const qElevage = (document.getElementById('searchElevage').value || '').toLowerCase();
  const typeElevage = document.getElementById('filterTypeElevage').value;
  const qForm = (document.getElementById('searchFormation').value || '').toLowerCase();
  const typeForm = document.getElementById('filterTypeFormation').value;
  const qAll = (document.getElementById('searchAllConseils') ? document.getElementById('searchAllConseils').value : '').toLowerCase();

  if(conseilsCategories && allConseilsList) {
    if(qAll.length > 0) {
      conseilsCategories.style.display = 'none';
      allConseilsList.style.display = 'grid';
    } else {
      conseilsCategories.style.display = 'flex';
      allConseilsList.style.display = 'none';
    }
  }

  articles.forEach((a,idx)=>{
    let mediaHtml = '';
    const isVideo = !!a.video;
    if(a.video){
      mediaHtml = `<iframe src="${a.video}" style="width:100%;aspect-ratio:16/9;border-radius:8px;margin-bottom:8px;border:0" allowfullscreen></iframe>`;
    } else {
      mediaHtml = `<img src="${a.image}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px" alt="${a.title}">`;
    }
    const html = `
      
      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;flex:1">${a.title}</div>
        <div style="font-size:12px;color:var(--text-muted);white-space:nowrap;display:flex;align-items:center;gap:4px"><i class="fa-solid fa-heart" style="color:#ef4444"></i> ${a.likes||0}</div>
      </div>
      <button class="btn" data-idx="" data-action="read" style="width:100%;margin-top:auto;padding:8px">Lire</button>
    `;
    const div = document.createElement('div'); 
    div.className = 'card'; 
    div.style.padding = '10px'; div.style.alignItems = 'stretch'; div.style.textAlign = 'left';
    div.innerHTML = html;

    if(a.type === 'agri'){
      const matchText = a.title.toLowerCase().includes(qAgri) || a.excerpt.toLowerCase().includes(qAgri);
      const matchType = typeAgri === 'all' || (typeAgri === 'video' && isVideo) || (typeAgri === 'article' && !isVideo);
      if(matchText && matchType) agriList.appendChild(div);
    } else if(a.type === 'elevage') {
      const matchText = a.title.toLowerCase().includes(qElevage) || a.excerpt.toLowerCase().includes(qElevage);
      const matchType = typeElevage === 'all' || (typeElevage === 'video' && isVideo) || (typeElevage === 'article' && !isVideo);
      if(matchText && matchType) elevageList.appendChild(div);
    } else if(a.type === 'formation') {
      const matchText = a.title.toLowerCase().includes(qForm) || a.excerpt.toLowerCase().includes(qForm);
      const matchType = typeForm === 'all' || (typeForm === 'video' && isVideo) || (typeForm === 'article' && !isVideo);
      if(matchText && matchType) formationList.appendChild(div);
    }

    if(qAll.length > 0 && allConseilsList) {
      const matchText = a.title.toLowerCase().includes(qAll) || a.excerpt.toLowerCase().includes(qAll);
      if(matchText) allConseilsList.appendChild(div.cloneNode(true));
    }
  })
}

document.getElementById('searchAgri').addEventListener('input', renderArticles);
document.getElementById('filterTypeAgri').addEventListener('change', renderArticles);
document.getElementById('searchElevage').addEventListener('input', renderArticles);
document.getElementById('filterTypeElevage').addEventListener('change', renderArticles);
document.getElementById('searchFormation').addEventListener('input', renderArticles);
document.getElementById('filterTypeFormation').addEventListener('change', renderArticles);
if(document.getElementById('searchAllConseils')) document.getElementById('searchAllConseils').addEventListener('input', renderArticles);

// Navigation Conseils
document.getElementById('btnConseilAgri').addEventListener('click', ()=> showView('conseils-agri'));
document.getElementById('btnConseilElevage').addEventListener('click', ()=> showView('conseils-elevage'));
document.getElementById('btnConseilFormation').addEventListener('click', ()=> showView('conseils-formation'));
document.getElementById('backToConseilsFromAgri').addEventListener('click', ()=> showView('conseils'));
document.getElementById('backToConseilsFromElevage').addEventListener('click', ()=> showView('conseils'));
document.getElementById('backToConseilsFromFormation').addEventListener('click', ()=> showView('conseils'));

// Listeners for Article buttons (delegation)
['agriList','elevageList','formationList', 'allConseilsList'].forEach(id => {
  const el = document.getElementById(id);
  if(el) el.addEventListener('click', handleArticleClick);
});

// ====== VIDEOS (TikTok Style) ======
const videoFeed = document.getElementById('videoFeed');

function generateRandomVideos(count){
  const titles = ['Danse des récoltes', 'Chant du berger', 'Humour au champ', 'Défi tracteur', 'Astuce du jour', 'Mon beau taureau', 'Récolte abondante', 'Pluie bénie'];
  const authors = ['Moussa', 'Amadou', 'Fatou', 'Jean', 'Sali', 'Bintou', 'Oumar', 'Seydou'];
  // Vidéos exemples (Source: Mixkit - Libre de droits)
  const sources = [
    'https://assets.mixkit.co/videos/preview/mixkit-chicken-eating-food-178-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-rooster-crowing-in-the-morning-175-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-cows-grazing-in-a-field-161-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-farmer-walking-through-corn-field-4072-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-wheat-field-in-the-sun-4074-large.mp4'
  ];
  const videos = [];
  
  for(let i=0; i<count; i++){
    const t = titles[Math.floor(Math.random()*titles.length)];
    const a = authors[Math.floor(Math.random()*authors.length)];
    const src = sources[Math.floor(Math.random()*sources.length)];
    
    videos.push({
      id: 'v' + Date.now() + i,
      title: t,
      author: a,
      likes: Math.floor(Math.random() * 500),
      src: src
    });
  }
  return videos;
}

// Observer pour lancer la vidéo uniquement quand elle est visible
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const vid = entry.target.querySelector('video');
    if(!vid) return;
    if(entry.isIntersecting) {
      vid.currentTime = 0;
      vid.play().catch(e=>{}); // Auto-play policy
    } else {
      vid.pause();
    }
  });
}, { threshold: 0.6 });

window.openVideoComments = function(videoId){
  const allComments = storage.get('comments', {});
  const videoComments = allComments[videoId] || [];
  
  let commentsHtml = videoComments.map(c => `
    <div class="comment-item">
      ${c.avatar ? `<img src="${c.avatar}" class="comment-avatar">` : `<div class="comment-avatar"><i class="fa-solid fa-user"></i></div>`}
      <div class="comment-body">
        <div class="comment-header">
          <strong>${c.user}</strong>
          <span>${c.date}</span>
        </div>
        <div style="font-size:11px;color:var(--primary);cursor:pointer;margin-bottom:4px" onclick="replyToUser('${c.user}')">↩️ Répondre</div>
        <div class="comment-text">${c.text}</div>
      </div>
    </div>
  `).join('');

  if(videoComments.length === 0) commentsHtml = '<div class="muted" style="text-align:center;padding:10px">Soyez le premier à commenter !</div>';

  const html = `
    <h3 style="margin-bottom:16px;text-align:center">Commentaires</h3>
    <div id="commentsList" class="comment-list" style="max-height:50vh;overflow-y:auto;padding:0 4px">${commentsHtml}</div>
    <div class="comment-form" style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px">
      <textarea id="newCommentText" class="comment-input" rows="1" placeholder="Ajouter un commentaire..."></textarea>
      <button class="btn" onclick="postComment('${videoId}')" style="padding:10px 16px">Envoyer</button>
    </div>
    <button class="btn ghost" style="width:100%;margin-top:12px" onclick="document.getElementById('closeModal').click()">Fermer</button>
  `;
  
  openModal(html);
}

function createVideoCard(v){
    const isVideo = v.isVideo !== false; // Par défaut true pour les anciennes vidéos
    
    let mediaHtml = '';
    if(isVideo){
        mediaHtml = `<video src="${v.src}" class="tiktok-bg" loop muted playsinline></video>`;
    } else {
        mediaHtml = `<img src="${v.src}" class="tiktok-bg" style="object-fit:cover">`;
    }
    
    const progressHtml = isVideo ? `<div class="video-progress"><div class="video-progress-fill"></div></div>` : '';

    const html = `
      ${mediaHtml}
      <div class="tiktok-content">
        <h3 style="font-size:20px;margin-bottom:8px;text-shadow:0 2px 4px rgba(0,0,0,0.8)">${v.title}</h3>
        <div style="font-size:14px;opacity:0.9;text-shadow:0 1px 2px rgba(0,0,0,0.8)">@${v.author}</div>
      </div>
      <div class="tiktok-actions">
            <button class="tiktok-btn"><div style="font-size:28px"><i class="fa-solid fa-heart"></i></div><span>${v.likes}</span></button>
            <button class="tiktok-btn" onclick="openVideoComments('${v.id}')"><div style="font-size:28px"><i class="fa-solid fa-comment"></i></div><span>Com.</span></button>
            <button class="tiktok-btn"><div style="font-size:28px"><i class="fa-solid fa-share-nodes"></i></div><span>Partager</span></button>
      </div>
      ${progressHtml}
    `;
    const div = document.createElement('div');
    div.className = 'tiktok-card';
    div.innerHTML = html;
    
    if(isVideo){
        // Click pour pause/play
        div.addEventListener('click', (e) => {
           if(e.target.closest('button')) return;
           const vid = div.querySelector('video');
           if(vid.paused) vid.play(); else vid.pause();
        });

        const vid = div.querySelector('video');
        const bar = div.querySelector('.video-progress-fill');
        vid.addEventListener('timeupdate', () => {
          const pct = (vid.currentTime / vid.duration) * 100;
          if(!isNaN(pct)) bar.style.width = `${pct}%`;
        });

        videoObserver.observe(div);
    }
    return div;
}

function appendVideos(videos){
  videos.forEach(v => {
    const card = createVideoCard(v);
    videoFeed.appendChild(card);
  });
}

// ====== ADD VIDEO LOGIC ======
const videoFormEl = document.getElementById('videoForm');
document.getElementById('btnNewVideo').addEventListener('click', ()=>{
  videoFormEl.style.display = videoFormEl.style.display==='none' ? 'block' : 'none';
});
document.getElementById('cancelVideo').addEventListener('click', ()=> videoFormEl.style.display='none');

document.getElementById('submitVideo').addEventListener('click', ()=>{
  const title = document.getElementById('videoTitle').value;
  const fileInput = document.getElementById('videoFile');
  const author = (storage.get('currentUser') || {}).name || 'Moi';

  if(!title || !fileInput.files[0]){ alert('Veuillez ajouter un titre et un fichier'); return }

  toggleLoader(true);
  
  const reader = new FileReader();
  reader.onload = function(e){
    const src = e.target.result;
    const isVideo = fileInput.files[0].type.startsWith('video');
    
    const newVideo = {
        id: 'uv_' + Date.now(),
        title: title,
        author: author,
        likes: 0,
        src: src,
        isVideo: isVideo
    };

    const userVideos = storage.get('user_videos', []);
    userVideos.unshift(newVideo);
    storage.set('user_videos', userVideos);

    // Ajouter au début du flux
    const card = createVideoCard(newVideo);
    videoFeed.insertBefore(card, videoFeed.firstChild);

    videoFormEl.style.display='none';
    toggleLoader(false);
    
    // Reset
    document.getElementById('videoTitle').value=''; 
    document.getElementById('videoFile').value='';
    
    alert('Publication réussie !');
  };
  reader.readAsDataURL(fileInput.files[0]);
});

// Initial load
const userVideos = storage.get('user_videos', []);
appendVideos(userVideos);
appendVideos(generateRandomVideos(5));

// Infinite scroll
videoFeed.addEventListener('scroll', () => {
  // Load more when reaching bottom (buffer of 100px)
  if(videoFeed.scrollTop + videoFeed.clientHeight >= videoFeed.scrollHeight - 100) {
    appendVideos(generateRandomVideos(3));
  }
});

window.downloadArticlePDF = function(title){
  toggleLoader(true);
  setTimeout(()=>{
    toggleLoader(false);
    alert(`Le support de formation ".pdf" a été téléchargé sur votre téléphone.`);
  }, 1500);
}

function handleArticleClick(e){
  const btn = e.target.closest('button'); if(!btn) return; const idx = Number(btn.dataset.idx); const articles = storage.get('articles_v3',[]);
  const a = articles[idx];
  
  let mediaHtml = '';
  if(a.video) {
    mediaHtml = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:16px;margin-bottom:24px;box-shadow:var(--shadow)"><iframe src="${a.video}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>`;
  } else {
    mediaHtml = `<img src="${a.image}" class="article-hero" alt="${a.title}">`;
  }

  // Génération de contenu riche simulé selon le type
  let richContent = '';
  if(a.content) {
    // Contenu utilisateur
    richContent = `<div style="white-space: pre-line;line-height:1.8">${a.content}</div>`;
  } else if(a.type === 'agri') {
    richContent = `
      <h4>🌱 Introduction</h4>
      <p>La réussite de cette culture dépend d'une bonne préparation et d'un suivi rigoureux. Voici les méthodes recommandées par les experts locaux pour maximiser vos rendements.</p>
      <h4>🚜 Préparation du sol</h4>
      <p>Avant de commencer, assurez-vous que le sol est bien drainé. Un labour profond de 20cm est conseillé pour aérer la terre et permettre aux racines de bien s'installer.</p>
      <ul>
        <li>Nettoyez la parcelle de toutes les mauvaises herbes.</li>
        <li>Apportez de la fumure organique (compost) 2 semaines avant le semis.</li>
        <li>Tracez des sillons réguliers pour faciliter l'entretien.</li>
      </ul>
      <h4>💧 Entretien & Arrosage</h4>
      <p>L'eau est cruciale, surtout pendant la floraison. Arrosez tôt le matin ou tard le soir pour éviter l'évaporation excessive. Surveillez également les attaques d'insectes.</p>
      <h4>✅ Récolte et Stockage</h4>
      <p>Récoltez lorsque les grains sont bien secs ou que les feuilles jaunissent. Un bon séchage est indispensable pour éviter les moisissures lors du stockage.</p>
    `;
  } else if (a.type === 'elevage') {
    richContent = `
      <h4>🐔 Les bases de l'élevage</h4>
      <p>Pour garantir la santé de vos animaux et la rentabilité de votre ferme, l'hygiène et l'alimentation sont les deux piliers fondamentaux.</p>
      <h4>🏠 Habitat et Confort</h4>
      <p>Le poulailler ou l'enclos doit être :</p>
      <ul>
        <li>Bien ventilé mais à l'abri des courants d'air forts et de la pluie.</li>
        <li>Nettoyé régulièrement (changer la litière chaque semaine).</li>
        <li>Sécurisé contre les prédateurs (chiens, serpents).</li>
      </ul>
      <h4>💊 Santé & Vaccins</h4>
      <p>Respectez scrupuleusement le calendrier de vaccination. Isolez immédiatement tout animal qui semble malade pour éviter la contagion au reste du troupeau.</p>
    `;
  } else {
    richContent = `
      <h4>🎓 Objectifs de la formation</h4>
      <p>Ce module vous permet d'acquérir les compétences nécessaires pour mieux gérer votre exploitation agricole comme une véritable entreprise.</p>
      <h4>📊 Points clés à retenir</h4>
      <ul>
        <li>Analyse des coûts de production (intrants, main d'œuvre).</li>
        <li>Stratégies de vente : choisir le bon moment pour vendre au marché.</li>
        <li>Tenue d'un cahier de compte simplifié pour suivre les dépenses.</li>
      </ul>
      <p>Mettez en pratique ces conseils dès demain pour voir une différence dans vos revenus à la fin de la saison.</p>
    `;
  }
  
  let downloadBtn = '';
  if(a.type === 'formation') downloadBtn = `<button class="btn ghost" style="width:100%;margin-top:24px;color:#2563eb;border-color:#2563eb;padding:16px" onclick="downloadArticlePDF('${a.title.replace(/'/g, "\'")}')">📥 Télécharger le support PDF</button>`;

  const authorName = a.author || 'Expert AgriFasoko';
  const authorRole = a.author ? 'Membre de la communauté' : 'Ingénieur Agronome';

  // Likes Logic
  const likedList = storage.get('liked_articles', []);
  const hasLiked = likedList.includes(a.id);
  const likesCount = a.likes || 0;

  // Comments Logic
  const allComments = storage.get('comments', {});
  const articleComments = allComments[a.id] || [];
  
  let commentsHtml = articleComments.map(c => `
    <div class="comment-item">
      ${c.avatar ? `<img src="${c.avatar}" class="comment-avatar">` : `<div class="comment-avatar">👤</div>`}
      <div class="comment-body">
        <div class="comment-header">
          <strong>${c.user}</strong>
          <span>${c.date}</span>
        </div>
        <div style="font-size:11px;color:var(--primary);cursor:pointer;margin-bottom:4px" onclick="replyToUser('${c.user}')">↩️ Répondre</div>
        <div class="comment-text">${c.text}</div>
      </div>
    </div>
  `).join('');

  if(articleComments.length === 0) commentsHtml = '<div class="muted" style="text-align:center;padding:10px">Soyez le premier à commenter !</div>';

  const html = `
    <div class="article-content">
      <div class="article-meta">
        <span class="badge">${a.type.toUpperCase()}</span>
        <span>• Publié le 12 Oct • 5 min de lecture</span>
        <button class="btn ghost" onclick="toggleLike('${a.id}', this)" ${hasLiked ? 'disabled' : ''} style="margin-left:auto;padding:6px 12px;font-size:13px;border-radius:20px;border:1px solid var(--border)">
            ${hasLiked ? '<i class="fa-solid fa-heart" style="color:#ef4444"></i>' : '<i class="fa-regular fa-heart"></i>'} <span id="likeCountDisplay">${likesCount}</span>
        </button>
      </div>
      <h2>${a.title}</h2>
      
      <p style="font-size:17px;font-weight:500;color:var(--text-muted);margin-bottom:24px;border-left:4px solid var(--primary);padding-left:16px;font-style:italic">${a.excerpt}</p>
      
      
      <hr style="margin:40px 0;border:0;border-top:1px solid var(--border)"/>
      <div style="display:flex;gap:16px;align-items:center;background:var(--bg);padding:20px;border-radius:16px;border:1px solid var(--border)">
        <div style="width:48px;height:48px;background:#cbd5e1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px">👨‍🌾</div>
        <div>
          <div style="font-weight:bold;color:var(--text)"></div>
          <div class="muted"></div>
        </div>
      </div>
      
      <div class="comments-section">
        <h3 style="font-size:18px;margin-bottom:16px">Commentaires (${articleComments.length})</h3>
        <div id="commentsList" class="comment-list"></div>
        <div class="comment-form">
          <textarea id="newCommentText" class="comment-input" rows="1" placeholder="Votre question ou avis..."></textarea>
          <button class="btn" onclick="postComment('${a.id}')" style="padding:10px 16px">Envoyer</button>
        </div>
      </div>

      <button class="btn" style="width:100%;margin-top:24px;padding:16px" onclick="document.getElementById('closeModal').click()">Fermer l'article</button>
    </div>
  `;

  openModal(html);
}

window.replyToUser = function(user){
  const txt = document.getElementById('newCommentText');
  txt.value = '@' + user + ' ';
  txt.focus();
}

window.toggleLike = function(id, btn){
  const likedList = storage.get('liked_articles', []);
  if(likedList.includes(id)) return;

  const articles = storage.get('articles_v3', []);
  const idx = articles.findIndex(a => a.id === id);
  
  if(idx !== -1){
    if(!articles[idx].likes) articles[idx].likes = 0;
    articles[idx].likes++;
    storage.set('articles_v3', articles);
    
    likedList.push(id);
    storage.set('liked_articles', likedList);
    
    btn.innerHTML = `<i class="fa-solid fa-heart" style="color:#ef4444"></i> ${articles[idx].likes}`;
    btn.disabled = true;
    
    // Update list view in background
    renderArticles();
  }
}

window.postComment = function(articleId){
  const text = document.getElementById('newCommentText').value;
  if(!text.trim()) return;
  
  const profile = storage.get('currentUser', {name:'Utilisateur'});
  const newComment = {
    user: profile.name || 'Anonyme',
    avatar: profile.image || null,
    text: text,
    date: new Date().toLocaleDateString()
  };

  // Notification Logic
  const match = text.match(/^@([^\s]+)/);
  if(match){
    const targetName = match[1];
    if(targetName !== profile.name){
       const notifs = storage.get('notifications', []);
       notifs.unshift({
         id: Date.now(),
         targetUser: targetName,
         fromUser: profile.name,
         type: 'reply',
         articleId: articleId,
         text: text,
         date: new Date().toLocaleDateString(),
         read: false
       });
       storage.set('notifications', notifs);
    }
  }
  
  const allComments = storage.get('comments', {});
  if(!allComments[articleId]) allComments[articleId] = [];
  allComments[articleId].push(newComment);
  storage.set('comments', allComments);
  
  const list = document.getElementById('commentsList');
  if(list.innerHTML.includes('Soyez le premier')) list.innerHTML = '';
  
  const div = document.createElement('div');
  div.className = 'comment-item';
  div.innerHTML = `${newComment.avatar ? `<img src="${newComment.avatar}" class="comment-avatar">` : `<div class="comment-avatar"><i class="fa-solid fa-user"></i></div>`}<div class="comment-body"><div class="comment-header"><strong>${newComment.user}</strong><span>A l'instant</span></div><div class="comment-text">${newComment.text}</div></div>`;
  list.appendChild(div);
  document.getElementById('newCommentText').value = '';
}

// ====== ADD CONSEIL LOGIC ======
const conseilFormEl = document.getElementById('conseilForm');
document.getElementById('btnNewConseil').addEventListener('click', ()=>{
  conseilFormEl.style.display = conseilFormEl.style.display==='none' ? 'block' : 'none';
});
document.getElementById('cancelConseil').addEventListener('click', ()=> conseilFormEl.style.display='none');

document.getElementById('submitConseil').addEventListener('click', ()=>{
  const title = document.getElementById('conseilTitle').value;
  const type = document.getElementById('conseilType').value;
  const excerpt = document.getElementById('conseilExcerpt').value;
  const content = document.getElementById('conseilContent').value;
  const author = (storage.get('currentUser') || {}).name || 'Membre';

  if(!title || !excerpt || !content){ alert('Veuillez remplir les champs obligatoires'); return }

  toggleLoader(true);
  setTimeout(() => {
    const articles = storage.get('articles_v3',[]);
    // Ajout du nouvel article
    articles.unshift({
      id: 'art_' + Date.now(),
      type, title, excerpt, content, author,
      likes: 0, image: type === 'agri' ? 'https://placehold.co/300x200/16a34a/ffffff?text=Conseil+Agri' : 'https://placehold.co/300x200/f97316/ffffff?text=Conseil+Elevage',
      date: new Date().toLocaleDateString()
    });
    storage.set('articles_v3', articles);
    
    renderArticles();
    conseilFormEl.style.display='none';
    toggleLoader(false);
    
    // Reset
    document.getElementById('conseilTitle').value=''; 
    document.getElementById('conseilExcerpt').value=''; 
    document.getElementById('conseilContent').value='';
    
    alert('Votre conseil a été publié avec succès !');
  }, 1000);
});

// ====== NOTIFICATIONS LOGIC ======
function renderNotifications(){
  const user = storage.get('currentUser', {});
  if(!user || !user.name) return;
  
  const allNotifs = storage.get('notifications', []);
  const myNotifs = allNotifs.filter(n => n.targetUser === user.name);
  const unreadCount = myNotifs.filter(n => !n.read).length;
  
  // Update Badge
  const badge = document.getElementById('notifBadge');
  if(unreadCount > 0){ badge.style.display='block'; badge.textContent = unreadCount; }
  else { badge.style.display='none'; }
  
  // Render List
  const list = document.getElementById('notifList');
  if(!list) return; // if not on view
  list.innerHTML = '';
  
  if(myNotifs.length === 0){
    list.innerHTML = '<div class="muted" style="text-align:center;margin-top:40px">Aucune notification pour le moment.</div>';
    return;
  }

  myNotifs.forEach(n => {
    const div = document.createElement('div');
    div.className = `notif-item ${n.read ? '' : 'unread'}`;
    div.innerHTML = `
          <div class="notif-icon"><i class="fa-solid fa-comment-dots"></i></div>
      <div style="flex:1">
        <div style="font-size:14px"><strong>${n.fromUser}</strong> a répondu à votre commentaire.</div>
        <div class="muted" style="font-size:12px;margin-top:4px">"${n.text.substring(0, 50)}..."</div>
        <div class="muted" style="font-size:11px;margin-top:4px">${n.date}</div>
      </div>
    `;
    div.addEventListener('click', ()=>{
      // Mark as read
      n.read = true;
      storage.set('notifications', allNotifs);
      renderNotifications();
      
      const articles = storage.get('articles_v3', []);
      const idx = articles.findIndex(a => a.id === n.articleId);
      if(idx !== -1){
         // Mock event
         handleArticleClick({ target: { closest: () => ({ dataset: { idx: idx } }) } });
      }
    });
    list.appendChild(div);
  });
}

document.getElementById('btnNotifications').addEventListener('click', ()=>{
  showView('notifications');
  renderNotifications();
});

// ====== MESSAGING LOGIC ======
let currentChatUser = null;

window.startChat = function(targetUser){
  const currentUser = storage.get('currentUser', {});
  if(!currentUser.name) { alert('Veuillez vous connecter'); return; }
  if(targetUser === currentUser.name) return;

  currentChatUser = targetUser;
  document.getElementById('chatTargetName').textContent = targetUser;
  const modal = document.getElementById('modal');
  if(modal.classList.contains('active')) document.getElementById('closeModal').click();
  
  showView('chat');
  renderChat();
}

document.getElementById('backFromChat').addEventListener('click', ()=> showView('inbox'));
document.getElementById('btnInbox').addEventListener('click', ()=> { showView('inbox'); renderInbox(); });

function renderChat(){
  if(!currentChatUser) return;
  const currentUser = storage.get('currentUser', {});
  const allMessages = storage.get('messages', []);
  
  const conversation = allMessages.filter(m => 
    (m.from === currentUser.name && m.to === currentChatUser) || 
    (m.from === currentChatUser && m.to === currentUser.name)
  );

  const container = document.getElementById('chatBubbles');
  container.innerHTML = '';
  
  conversation.forEach(m => {
    const div = document.createElement('div');
    const isMe = m.from === currentUser.name;
    div.className = `chat-bubble ${isMe ? 'me' : 'other'}`;
    div.textContent = m.text;
    container.appendChild(div);
  });
  
  container.scrollTop = container.scrollHeight;
  
  // Mark read
  let changed = false;
  allMessages.forEach(m => {
    if(m.to === currentUser.name && m.from === currentChatUser && !m.read){ m.read = true; changed = true; }
  });
  if(changed) { storage.set('messages', allMessages); updateMsgBadge(); }
}

document.getElementById('btnSendChat').addEventListener('click', ()=>{
  const txt = document.getElementById('chatInput').value;
  if(!txt.trim()) return;
  
  const currentUser = storage.get('currentUser', {});
  const allMessages = storage.get('messages', []);
  
  allMessages.push({ id: Date.now(), from: currentUser.name, to: currentChatUser, text: txt, date: new Date().toISOString(), read: false });
  
  storage.set('messages', allMessages);
  document.getElementById('chatInput').value = '';
  renderChat();
});

function renderInbox(){
  const currentUser = storage.get('currentUser', {});
  if(!currentUser.name) return;
  
  const allMessages = storage.get('messages', []);
  const list = document.getElementById('inboxList');
  list.innerHTML = '';
  
  const contacts = new Set();
  allMessages.forEach(m => {
    if(m.from === currentUser.name) contacts.add(m.to);
    if(m.to === currentUser.name) contacts.add(m.from);
  });
  
  if(contacts.size === 0){ list.innerHTML = '<div class="muted" style="text-align:center;margin-top:20px">Aucune conversation.</div>'; return; }
  
  contacts.forEach(contact => {
    const msgs = allMessages.filter(m => (m.from === currentUser.name && m.to === contact) || (m.from === contact && m.to === currentUser.name));
    const last = msgs[msgs.length-1];
    const unread = msgs.filter(m => m.to === currentUser.name && !m.read).length;
    
    const div = document.createElement('div'); div.className = 'chat-preview';
    div.innerHTML = `<div class="chat-avatar" style="width:40px;height:40px;background:#cbd5e1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px">👤</div><div style="flex:1"><div style="display:flex;justify-content:space-between"><strong style="font-size:15px"></strong><span class="muted" style="font-size:11px">${new Date(last.date).toLocaleDateString()}</span></div><div class="muted" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px">${last.from === currentUser.name ? 'Vous: ' : ''}${last.text}</div></div>${unread > 0 ? `<div class="badge" style="background:var(--primary);color:white"></div>` : ''}`;
    div.addEventListener('click', ()=> startChat(contact));
    list.appendChild(div);
  });
}

function updateMsgBadge(){
  const currentUser = storage.get('currentUser', {});
  if(!currentUser.name) return;
  const allMessages = storage.get('messages', []);
  const count = allMessages.filter(m => m.to === currentUser.name && !m.read).length;
  const badge = document.getElementById('msgBadge');
  if(count > 0){ badge.style.display='block'; badge.textContent = count; } else badge.style.display='none';
}

// ====== AUTH LOGIC ======
function checkAuth(){
  const user = storage.get('currentUser', null);
  if(!user) showView('auth');
  else {
    // Si on est sur auth ou au démarrage (aucune vue active), on va à home
    if(document.querySelector('#auth.active') || !document.querySelector('.view.active')) showView('home');
    loadProfile();
    renderNotifications();
    updateMsgBadge();
  }
}

document.getElementById('showSignup').addEventListener('click', (e)=>{ e.preventDefault(); document.getElementById('loginForm').style.display='none'; document.getElementById('signupForm').style.display='block'; });
document.getElementById('showLogin').addEventListener('click', (e)=>{ e.preventDefault(); document.getElementById('signupForm').style.display='none'; document.getElementById('loginForm').style.display='block'; });

document.getElementById('btnSignup').addEventListener('click', ()=>{
  const name = document.getElementById('signupName').value;
  const phone = document.getElementById('signupPhone').value;
  const location = document.getElementById('signupLocation').value;
  const type = document.getElementById('signupType').value;
  const pass = document.getElementById('signupPass').value;

  if(!name || !phone || !pass || !location){ alert('Veuillez tout remplir'); return; }

  const users = storage.get('users', []);
  if(users.find(u=>u.phone === phone)){ alert('Ce numéro existe déjà'); return; }

  const newUser = { name, phone, type, pass, bio:'', location, lang:'fr', theme:'light', image:'', joined: new Date().toLocaleDateString() };
  users.push(newUser);
  storage.set('users', users);
  storage.set('currentUser', newUser);
  
  alert('Compte créé ! Bienvenue ' + name);
  checkAuth();
});

document.getElementById('btnLogin').addEventListener('click', ()=>{
  const phone = document.getElementById('loginPhone').value;
  const pass = document.getElementById('loginPass').value;
  
  const users = storage.get('users', []);
  const user = users.find(u => u.phone === phone && u.pass === pass);
  
  if(user){
    storage.set('currentUser', user);
    checkAuth();
  } else {
    alert('Numéro ou mot de passe incorrect');
  }
});

document.getElementById('btnLogout').addEventListener('click', ()=>{
  if(confirm('Voulez-vous vraiment vous déconnecter ?')){
    storage.set('currentUser', null);
    document.getElementById('loginPhone').value = '';
    document.getElementById('loginPass').value = '';
    showView('auth');
  }
});

// ====== PROFILE ======
const translations = {
  fr: {
    app_desc: "Application d’assistance pour cultivateurs et éleveurs — Mali",
    nav_market: "Marché", nav_tips: "Conseils", nav_profile: "Profil", nav_videos: "Vidéos",
    notif_title: "Notifications",
    inbox_title: "Messagerie",
    home_market_sub: "Acheter / Vendre", home_tips_sub: "Articles & vidéos", home_profile_sub: "Vos données", home_videos_sub: "Divertissement",
    market_title: "Marché Agricole", tips_title: "Conseils & Formation", profile_title: "Profil",
    btn_return: "Retour", btn_sell: "Vendre", btn_update: "Mettre à jour",
    tips_agri_title: "Espace Cultivateur", tips_agri_sub: "Techniques, sols, semences...",
    tips_elev_title: "Espace Éleveur", tips_elev_sub: "Santé, nutrition, vaccins...",
    tips_form_title: "Espace Formation", tips_form_sub: "Gestion, comptabilité, marketing...",
    lbl_name: "Nom complet", lbl_activity: "Activité", lbl_location: "Localisation", lbl_phone: "Téléphone", lbl_bio: "Bio / Description", lbl_lang: "Langue / Kan", lbl_theme: "Thème",
    filter_all: "Tout", filter_video: "Vidéo", filter_article: "Article",
    share_title: "Faire connaître l'app", btn_share: "Partager sur WhatsApp",
    videos_title: "Vidéos"
  },
  bm: {
    app_desc: "Sènèkèlaw ni Baganmara law dèmè nan — Mali",
    nav_market: "Sugu", nav_tips: "Ladili", nav_profile: "Yèrè-don", nav_videos: "Videyo",
    notif_title: "Kunnafoniw",
    inbox_title: "Batakiw",
    home_market_sub: "San / Feere", home_tips_sub: "Gafe & Videyo", home_profile_sub: "I ka ko", home_videos_sub: "Dɔnkilida",
    market_title: "Sènè Sugu", tips_title: "Ladili & Kalan", profile_title: "Yèrè-don (Profil)",
    btn_return: "Seguin kɔ", btn_sell: "Feere", btn_update: "A don i n'a la",
    tips_agri_title: "Sènèkèlaw", tips_agri_sub: "Sènèkè cogo, dugukolo...",
    tips_elev_title: "Baganmara law", tips_elev_sub: "Kènèya, balo, piki...",
    tips_form_title: "Kalan Yɔrɔ", tips_form_sub: "Jatigè, wari-ko, feereli...",
    lbl_name: "Tɔgɔ", lbl_activity: "Baara", lbl_location: "Yɔrɔ", lbl_phone: "Telefon", lbl_bio: "Ñèfɔli", lbl_lang: "Kan", lbl_theme: "Yeeli",
    filter_all: "Bèe", filter_video: "Videyo", filter_article: "Gafe",
    share_title: "App lase tɔw ma", btn_share: "Ci WhatsApp la",
    videos_title: "Videyo"
  },
  en: {
    app_desc: "Assistance app for farmers and breeders — Mali",
    nav_market: "Market", nav_tips: "Tips", nav_profile: "Profile", nav_videos: "Videos",
    notif_title: "Notifications",
    inbox_title: "Messages",
    home_market_sub: "Buy / Sell", home_tips_sub: "Articles & videos", home_profile_sub: "Your data", home_videos_sub: "Entertainment",
    market_title: "Agricultural Market", tips_title: "Tips & Training", profile_title: "Profile",
    btn_return: "Back", btn_sell: "Sell", btn_update: "Update",
    tips_agri_title: "Farmer Space", tips_agri_sub: "Techniques, soils, seeds...",
    tips_elev_title: "Breeder Space", tips_elev_sub: "Health, nutrition, vaccines...",
    tips_form_title: "Training Space", tips_form_sub: "Management, accounting, marketing...",
    lbl_name: "Full Name", lbl_activity: "Activity", lbl_location: "Location", lbl_phone: "Phone", lbl_bio: "Bio / Description", lbl_lang: "Language", lbl_theme: "Theme",
    filter_all: "All", filter_video: "Video", filter_article: "Article",
    share_title: "Share the app", btn_share: "Share on WhatsApp",
    videos_title: "Videos"
  }
};

function applyLanguage(lang){
  const t = translations[lang] || translations['fr'];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if(t[key]) el.textContent = t[key];
  });
}

function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
}

// Appliquer le thème immédiatement au changement
document.getElementById('profileTheme').addEventListener('change', (e)=>{
  applyTheme(e.target.value);
});

function loadProfile(){ 
  // Détection langue du téléphone (défaut si nouveau profil)
  const sysLang = navigator.language || navigator.userLanguage || 'fr';
  const defaultLang = sysLang.toLowerCase().startsWith('bm') ? 'bm' : 'fr';
  const p = storage.get('currentUser',{name:'',location:'',phone:'', type:'Cultivateur', bio:'', lang:defaultLang, theme:'light', image:'', joined:'Oct 2023'}); 
  document.getElementById('profileName').value=p.name; 
  document.getElementById('profileLocation').value=p.location; 
  document.getElementById('profilePhone').value=p.phone;
  document.getElementById('profileType').value=p.type || 'Cultivateur';
  document.getElementById('profileBio').value=p.bio || '';
  document.getElementById('profileLang').value=p.lang || 'fr';
  document.getElementById('profileTheme').value=p.theme || 'light';
  if(p.image) document.getElementById('profileImage').src = p.image;
  applyLanguage(p.lang || 'fr');
  applyTheme(p.theme || 'light');

  // Update UI Header
  document.getElementById('displayProfileName').textContent = p.name || 'Utilisateur';
  document.getElementById('displayProfileRole').textContent = p.type || 'Membre';

  // Stats
  // 1. Annonces
  const offers = storage.get('market', []);
  const countOffers = offers.filter(o => o.owner === p.name).length;
  document.getElementById('statOffersCount').textContent = countOffers;

  // 2. Favoris (Articles aimés)
  const liked = storage.get('liked_articles', []);
  document.getElementById('statLikesCount').textContent = liked.length;

  // 3. Commentaires
  const allComments = storage.get('comments', {});
  let commentCount = 0;
  Object.values(allComments).forEach(arr => { arr.forEach(c => { if(c.user === p.name) commentCount++; }); });
  document.getElementById('statCommentsCount').textContent = commentCount;

  // 4. Membre depuis
  document.getElementById('statMemberSince').textContent = p.joined || 'Oct 2023';
}

document.getElementById('saveProfile').addEventListener('click', ()=>{ 
  const current = storage.get('currentUser', {});
  const p={ ...current, name:document.getElementById('profileName').value, location:document.getElementById('profileLocation').value, phone:document.getElementById('profilePhone').value, type:document.getElementById('profileType').value, bio:document.getElementById('profileBio').value, lang:document.getElementById('profileLang').value, theme:document.getElementById('profileTheme').value }; 
  
  // Update current session
  storage.set('currentUser',p); 
  
  // Update in users array
  const users = storage.get('users', []);
  const idx = users.findIndex(u => u.phone === current.phone);
  if(idx !== -1) users[idx] = p;
  storage.set('users', users);

  loadProfile(); alert('Profil mis à jour'); 
});

// ====== PROFILE IMAGE ======
document.getElementById('changePhotoBtn').addEventListener('click', () => document.getElementById('profilePhotoInput').click());
document.getElementById('profilePhotoInput').addEventListener('change', function() {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const p = storage.get('currentUser', {});
      p.image = e.target.result;
      storage.set('currentUser', p);
      
      const users = storage.get('users', []);
      const idx = users.findIndex(u => u.phone === p.phone);
      if(idx !== -1) { users[idx] = p; storage.set('users', users); }

      document.getElementById('profileImage').src = e.target.result;
    };
    reader.readAsDataURL(this.files[0]);
  }
});

// ====== SHARE ======
document.getElementById('shareAppBtn').addEventListener('click', async () => {
  const text = "AgriFasoko : L'application pour les cultivateurs et éleveurs du Mali !";
  const url = window.location.href;
  
  if (navigator.share) {
    try { await navigator.share({ title: 'AgriFasoko', text: text, url: url }); } catch(e){}
  } else {
    window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), '_blank');
  }
});

// ====== Init render ======
renderMarket(); renderArticles(); checkAuth(); renderVideos();

// Friendly tip: save before closing (simulated)
window.addEventListener('beforeunload', ()=>{ /* data already in localStorage */ });

// Small UX: deep linking via hash
function checkHash(){ const id = location.hash.replace('#',''); if(id) showView(id); }
window.addEventListener('hashchange', checkHash); checkHash();
