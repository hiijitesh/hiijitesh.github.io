/* ==========================================================================
   JITESH GIRI — POETRY & TICKETS ENGINE
   Natural, brotherly, unpretentious tone ('bhai', 'tu', 'tum', raw & warm)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     1. Local Writings Data Fallback
     -------------------------------------------------------------------------- */
  const defaultWritings = [
    {
      id: "mere-soch-pare-bhi",
      category: "Poetry",
      title: "Mere Soch Pare Bhi, Kuch Hona Hain",
      date: "October 2026",
      excerpt: "Ek samay tha jahan sab kuch naa paane ka bhay tha, ek aaj waqt hain jaha sab kuch hoke bhi jindgi lagti kamwaqt hain...",
      content: "Mere Soch Pare Bhi, Kuch Hona Hain\n\nEk samay tha jahan,\nSab kuch naa paane ka bhay tha\n\nEk aaj waqt hain, jaha sab kuch hoke bhi\nJindgi, lagti kamwaqt hain!!!\n\nKuch paya, toh kuch khoya hu\nKuch paya, toh kuch khoya hu\nDil jab jab na laga, tab tab roya hu.\n\nSapne dekhe bade udaan ke hain,\nPar main toh yunhi soya hu.\nDil jab jab na laga, tab tab roya hu.\n\nPata hota agar, kuch paane ko, kuch khona hain!\nMere soch pare bhi, kuch hona hain.\n\nSambhaal ke rakhata uss pal ko, jo khaas the\nJab pata hota isko bhi, ek din khona hain.\nMere soch pare bhi, kuch hona hain."
    },
    {
      id: "kuch-khayaal-aise-hain",
      category: "Nazm",
      title: "Kuch Khayaal Aise Hain",
      date: "October 2026",
      excerpt: "Kuch khayal aise hain jo meet nahi patein, kuch shaam aisi hain jo dhal nahi patein. Log toh charo taraf hain lekin fir sab me hum ghool meel nahi patein...",
      content: "Kuch Khayaal Aise Hain\n\nKuch khayal aise hain jo meet nahi patein\nKuch shaam aisi hain jo dhal nahi patein\n\nLog toh charo taraf hain\nLekin fir sab me hum ghool meel nahi patein\n\nBahar bheed ka nazaraa hain toh\nUnder jhanka toh sukha kinaara hain\n\nKuch khayal aise hain jo meet nahi patein\nKuch shaam aisi hain jo dhal nahi patein\n\nKabhi aarzoo hoti hain apno ki,\nFir lagta sab thik ho jayegaa\nPar ye toh waqat he batayega, \nLagta hain ye zindgi yuhi, \nTanha kat jayega\n\nSapne toh hazaar hain, \nBahut he besoomar hain \nSapno ko pana hain ya apno ko, \nYe soch ke dil av bhi bekaraar hain\n\nAnshu toh dil me aatein hain, \nAnkho ki aukaat kya hain\nSochata hu ro lu jee bhar ke,\nPar itna v ye aashaan kahan hain\n\nKuch khayal aise hain jo meet nahi patein\nKuch shaam aisi hain jo dhal nahi patein"
    },
    {
      id: "kahani-me-kuch-khaas-nahi",
      category: "Shayari",
      title: "Kahani Me Kuch Khaas Nahi",
      date: "October 2026",
      excerpt: "kahani me ab kuch khaas nahi, ab woh pahale wali baat nahi. phone pe hoti baat sahi, par hoti koi ab mulakaat nahi...",
      content: "Kahani Me Kuch Khaas Nahi\n\nkahani me ab kuch khaas nahi\nab woh pahale wali baat nahi\nphone pe hoti baat sahi\npar hoti koi ab mulakaat nahi\n\nab pahale wale jazbaat nahi\nJeevan me ab koi raas nahi\npta chalta din raat nahi\nkahani me ab kuch khaas nahi"
    },
    {
      id: "tum-woh-ehsaas-ho",
      category: "Nazm",
      title: "Tum Woh Ehsaas Ho",
      date: "October 2026",
      excerpt: "Tum woh ehsaas ho jo pal pal mere saath ho. Kabhi sochta hu ek din kaise katega tum bin, magar sach toh ye hain ki ek pal bhi sadiyo sa lagega...",
      content: "Tum Woh Ehsaas Ho\n\nTum woh ehsaas ho \njo pal pal mere saath ho\n\nkabhi sochta hu ek din \nkaise katega tum bin, \nmagar sach toh ye hain ki \nek pal bhi sadiyo sa lagea\n7 janam sa ek ek din\n\ntum woh aadat ban gayi ho\njisko main gum me khushi me\njeev jantu sab me dhudhata hun\n\nguzaara nahi hota mera \ntum bin ek pal, kyuki \nsahaaraa ho tum mere pal pal ka\n\nlikhana chahatu bahut kuch tumhare baare me\nmagar keh du kya tumhe dundha nahi main Chand sitaaro me\nek chhoti si aarzu hain, tum hamesha raho meri baaho me\n\nkalaa ki kami hain, nahi toh likh du tumpe\nwoh nazam, shayri aur kitaab\nmagar tumhe dekh ke sab bhool jata hu\nkuchh iss tarah pyaar hua hain aap se janbab"
    }
  ];

  /* --------------------------------------------------------------------------
     2. Toast Notification Helper
     -------------------------------------------------------------------------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;

  window.showToast = function(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  };

  /* --------------------------------------------------------------------------
     3. Email Quick Copy
     -------------------------------------------------------------------------- */
  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = 'beatbyjit@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast('Email copy ho gaya bhai, ab message bhej bhi do.');
      }).catch(() => {
        showToast('beatbyjit@gmail.com');
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. Ticket Booking Modal
     -------------------------------------------------------------------------- */
  const ticketModal = document.getElementById('ticket-modal');
  const ticketClose = document.getElementById('ticket-close');
  const tModalTitle = document.getElementById('t-modal-title');
  const tModalVenue = document.getElementById('t-modal-venue');
  const tModalDate = document.getElementById('t-modal-date');
  const tModalPrice = document.getElementById('t-modal-price');

  window.openTicketModal = function(city, date, venue, title, price) {
    if (tModalTitle) tModalTitle.textContent = title;
    if (tModalVenue) tModalVenue.textContent = `${venue} • ${city}`;
    if (tModalDate) tModalDate.textContent = date;
    if (tModalPrice) tModalPrice.textContent = price;
    if (ticketModal) ticketModal.classList.add('active');
  };

  if (ticketClose) {
    ticketClose.addEventListener('click', () => {
      ticketModal.classList.remove('active');
    });
  }

  window.handleTicketBooking = function(e) {
    e.preventDefault();
    const buyerName = document.getElementById('t-buyer-name').value;
    ticketModal.classList.remove('active');
    e.target.reset();
    showToast(`Done bhai! ${buyerName}, ticket confirm ho gaya. Milte hain show pe 🎟️`);
  };

  window.handleTourNotify = function(e) {
    e.preventDefault();
    e.target.reset();
    showToast('Done bhai! Jaise hi dates final honge pehle message kar dunga.');
  };

  /* --------------------------------------------------------------------------
     5. Poetry Reader & Filter
     -------------------------------------------------------------------------- */
  const writingGrid = document.getElementById('poetry-grid');
  const readerModal = document.getElementById('reader-modal');
  const readerTitle = document.getElementById('reader-heading');
  const readerCategory = document.getElementById('reader-cat');
  const readerBody = document.getElementById('reader-text');
  const readerClose = document.getElementById('reader-close');
  const writingChips = document.querySelectorAll('.poetry-filters .p-filter');

  let loadedWritings = defaultWritings;

  function renderWritings(list, filter = 'all') {
    if (!writingGrid) return;
    writingGrid.innerHTML = '';

    const filtered = filter === 'all' ? list : list.filter(w => w.category === filter);

    filtered.forEach(piece => {
      const card = document.createElement('article');
      card.className = 'poetry-card';
      card.innerHTML = `
        <div>
          <div class="p-card-header">
            <span class="p-category">${piece.category}</span>
            <span class="p-date">${piece.date}</span>
          </div>
          <h3 class="p-title">${piece.title}</h3>
          <p class="p-excerpt">${piece.excerpt}</p>
        </div>
        <div class="p-read-btn">
          <span>Poora padho</span>
          <span class="arrow">→</span>
        </div>
      `;

      card.addEventListener('click', () => {
        readerCategory.textContent = piece.category;
        readerTitle.textContent = piece.title;
        readerBody.textContent = piece.content;
        readerModal.classList.add('active');
      });

      writingGrid.appendChild(card);
    });
  }

  fetch('data/writings.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        loadedWritings = data;
      }
      renderWritings(loadedWritings);
    })
    .catch(() => {
      renderWritings(defaultWritings);
    });

  writingChips.forEach(chip => {
    chip.addEventListener('click', () => {
      writingChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const wfilter = chip.getAttribute('data-wfilter');
      renderWritings(loadedWritings, wfilter);
    });
  });

  if (readerClose) {
    readerClose.addEventListener('click', () => {
      readerModal.classList.remove('active');
    });
  }

  // Close modals on backdrop click or ESC key
  [ticketModal, readerModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (ticketModal) ticketModal.classList.remove('active');
      if (readerModal) readerModal.classList.remove('active');
    }
  });

});
