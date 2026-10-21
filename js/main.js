/* ==========================================================================
   JITESH GIRI — POET & WRITER JAVASCRIPT ENGINE
   Inspiration: madhurvirli.com & samayraina.co
   Zero audio bloat, clean ticket reservations, poetry reader & smooth UI
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     1. Local Writings Data Fallback
     -------------------------------------------------------------------------- */
  const defaultWritings = [
    {
      id: "dhool-aur-khamoshi",
      category: "Poetry",
      title: "Dhool Aur Khamoshi",
      date: "October 2026",
      excerpt: "Hum hawa ke wo columns hain jo yaadon ki frequency par vibrate hote hain. Seene ke andhere mein purane shehar ki aawazein qaid hain...",
      content: "Dhool Aur Khamoshi\n\nHum hawa ke wo columns hain jo yaadon ki frequency par vibrate hote hain.\nSeene ke andhere mein purani imaarat ki acoustics chhupi hai, jaise khali corridors mein fluorescent battiyon ki dheemi si sarsarahat.\n\nHum aawazon mein baat karte hain — hansi ke wo pal jo drywall aur pardon ki narmi mein foran gayab ho jaate hain.\nHum dhoondhte hain ek aisa kona jahan koi shor na ho, ek bilkul saaf slate, jahan sirf apne saanson ki aawaz sunai de.\n\nLekin kaanon mein shehar ki dhool jam jaati hai, jaise ek purana filter, jo teekhe lafzon ko dheere-dheere gol kar deta hai... aur peeche chhod jaata hai sirf ek halka sa, warm aur meetha sukoon."
    },
    {
      id: "dilli-ki-raat",
      category: "Nazm",
      title: "Dilli Ki Raat, 3:15 AM",
      date: "September 2026",
      excerpt: "Kiraye ke kamre ki khidki se jo sadak dikhti hai, wahan ab koi auto nahi rukta. Sirf peeli street lights hain aur ek adhoori diary...",
      content: "Dilli Ki Raat, 3:15 AM\n\nKiraye ke kamre ki khidki se jo sadak dikhti hai,\nwahan ab koi auto nahi rukta.\n\nSirf peeli street lights hain, flyover ke neeche sote hue kutte,\naur ek adhoori diary jisme teen mahine se ek hi sher atka hua hai.\n\nLog kehte hain ki shayar dukh bechta hai,\npar sach toh yeh hai ki hum bas bheed mein akele pad gaye the.\nChai thandi ho chuki hai, kalam ki siyahi sookhne lagi hai,\npar jab tak agla lafz na mile, neend aane ka koi sawal hi nahi."
    },
    {
      id: "sannate-ki-geometry",
      category: "Essay",
      title: "Sannate Ki Geometry",
      date: "August 2026",
      excerpt: "Khamoshi aawaz ki gair-maujoodgi nahi hai; yeh toh lafzon ke beech ki deewar hai. Agar pause na ho, toh shayari bas shor ban jaati hai...",
      content: "Sannate Ki Geometry\n\nKhamoshi aawaz ki gair-maujoodgi nahi hai; yeh toh lafzon ke beech ka wajood hai.\n\nStage par jab ek shayar do line bolne ke baad do second ke liye rukta hai, wahi do second mein audience ka dil dhadakta hai. Agar wo pause na ho, agar wo thehraav na ho, toh shayari bas ek tez shor ki train ban kar nikal jaati hai — kaan tak pahunchti hai, par rooh ko chhoo nahi paati.\n\nHum shehar mein shor se bachne ke liye headphones pehante hain, par dil ke andar ka shor kaise rokein? Shayad isiliye hum likhte hain — taaki jo cheez andar cheekh rahi hai, use kaagaz par thehraav mil sake."
    },
    {
      id: "chaar-misre",
      category: "Shayari",
      title: "Chaar Misre (Short Couplets)",
      date: "July 2026",
      excerpt: "Shehar badla toh pata chala ki makan badle the, log toh wahi the jo muskurakar nikal jaate hain...",
      content: "Chaar Misre\n\nShehar badla toh pata chala ki makan badle the,\nLog toh wahi the jo muskurakar nikal jaate hain.\n\nKabhi fursat mile toh aana hamare shehar mein,\nYahan baatein kam, aur log khamoshi zyada samajhte hain.\n\nKalam uthayi thi dard ko dafan karne ke liye,\nPata nahi kab yeh dard hi meri pehchan ban gaya."
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
        showToast('Email copy ho gaya! Inbox mein aao.');
      }).catch(() => {
        showToast('beatbyjit@gmail.com');
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. Mobile Navigation Toggle
     -------------------------------------------------------------------------- */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. Ticket Booking Modal
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
    showToast(`Badhaai ho ${buyerName}! Ticket confirm ho gaya 🎟️`);
  };

  window.handleTourNotify = function(e) {
    e.preventDefault();
    e.target.reset();
    showToast('Shukriya! Naye dates aate hi sabse pehle update aayega.');
  };

  /* --------------------------------------------------------------------------
     6. The Written Word: Reader & Category Filters
     -------------------------------------------------------------------------- */
  const writingGrid = document.getElementById('writing-grid');
  const readerModal = document.getElementById('reader-modal');
  const readerTitle = document.getElementById('reader-title');
  const readerCategory = document.getElementById('reader-category');
  const readerBody = document.getElementById('reader-body');
  const readerClose = document.getElementById('reader-close');
  const writingChips = document.querySelectorAll('.writing-filters .filter-chip');

  let loadedWritings = defaultWritings;

  function renderWritings(list, filter = 'all') {
    if (!writingGrid) return;
    writingGrid.innerHTML = '';

    const filtered = filter === 'all' ? list : list.filter(w => w.category === filter);

    filtered.forEach(piece => {
      const card = document.createElement('article');
      card.className = 'writing-card';
      card.innerHTML = `
        <div>
          <div class="writing-card-header">
            <span class="writing-tag">${piece.category}</span>
            <span class="writing-date">${piece.date}</span>
          </div>
          <h3 class="writing-title">${piece.title}</h3>
          <p class="writing-excerpt">${piece.excerpt}</p>
        </div>
        <div class="writing-read-more">
          <span>Poora padhein</span>
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

  /* --------------------------------------------------------------------------
     7. Booking Form Handler
     -------------------------------------------------------------------------- */
  window.handleFormSubmit = function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit');
    const name = document.getElementById('form-name').value;

    if (btnSubmit) {
      btnSubmit.innerHTML = `<span>Bheja ja raha hai...</span>`;
      btnSubmit.disabled = true;
    }

    setTimeout(() => {
      showToast(`Shukriya ${name}! Message mil gaya, jaldi baat karte hain.`);
      document.getElementById('booking-form').reset();
      if (btnSubmit) {
        btnSubmit.innerHTML = `<span>Message Bhejo</span><span class="arrow">→</span>`;
        btnSubmit.disabled = false;
      }
    }, 700);
  };

});
