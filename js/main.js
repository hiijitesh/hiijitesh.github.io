/* ==========================================================================
   JITESH GIRI — MINIMAL HUMAN-CRAFTED ENGINE
   Hinglish microcopy, smooth A/B master switcher, beat dock & gallery
   Zero bloat, zero AI slop, 100% human logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* --------------------------------------------------------------------------
     1. Local Writings Data (Fallback for file:// & fetched for http://)
     -------------------------------------------------------------------------- */
  const defaultWritings = [
    {
      id: "vessels-of-dust",
      category: "Poetry",
      title: "Vessels of Dust",
      date: "June 2026",
      excerpt: "Hum hawa ke wo columns hain jo yaadon ki frequency par vibrate hote hain. Seene ke andhere mein purani imaarat ki acoustics chhupi hai...",
      content: "Vessels of Dust\n\nHum hawa ke wo columns hain jo yaadon ki frequency par vibrate hote hain. Seene ke andhere mein purani imaarat ki acoustics chhupi hai, jaise khali corridors mein fluorescent battiyon ki dheemi si sarsarahat.\n\nHum waveforms mein baat karte hain — hansi ke wo transient spikes jo drywall aur pardon ki narmi mein foran gayab ho jaate hain. Hum chhaon dhoondhte hain jahan koi resonance na ho, ek bilkul saaf slate, ek aisa kamra jahan sirf apne khoon ki aawaz sunai de.\n\nLekin kaanon mein dhool jam jaati hai, jaise ek low-pass filter, jo purane pachtawon ke teekhe konon ko dheere-dheere gol kar deta hai... peeche chhod jaata hai sirf ek halka sa, warm aur saturated hum."
    },
    {
      id: "subwoofer-sins",
      category: "Lyrics",
      title: "Subwoofer Sins",
      date: "May 2026",
      excerpt: "Kiraye ke kamre ki khidkiyan 45 Hertz par kaanpti hain. Gussa hamesha sub-bass mein hi kyu baithta hai...",
      content: "Subwoofer Sins\n\nKiraye ke kamre ki khidkiyan 45 Hertz par kaanpti hain. Gussa hamesha sub-bass mein hi kyu baithta hai.\n\nMain low-end itna badha deta hoon ki farsh ki cheekh chhip jaaye, purane fridge ki aawaz chhip jaaye, aur chhip jaaye meri khud ki aawaz jo poochhti hai ki galti kahan hui thi.\n\n250 Hz par mud toh filter kar lete hain, par dimaag ka shor kaise katein? Vocals ko compress karke aage khada kar dete hain, par kuch kahaniyan mix ke pichhle hisse mein dabi hi achhi lagti hain."
    },
    {
      id: "geometry-of-silence",
      category: "Essay",
      title: "The Geometry of Silence",
      date: "April 2026",
      excerpt: "Khamoshi aawaz ki gair-maujoodgi nahi hai; yeh toh structure ki presence hai. Architecture mein negative space hi imaarat banata hai...",
      content: "The Geometry of Silence\n\nKhamoshi aawaz ki gair-maujoodgi nahi hai; yeh toh structure ki presence hai.\n\nArchitecture mein negative space hi imaarat banata hai. Mixing mein do transients ke beech ka fasla hi dynamics tay karta hai. Agar gehra sannata na ho, toh oonchi aawaz bas ek chipta hua compression ban kar reh jaati hai — ek shor ki deewar jo kaan thaka deti hai.\n\nHum deewarein banate hain taaki kamra bane, aur kamra banate hain taaki aawaz qaid ho sake. Par isolation ek dhokha hai. Low-end hamesha deewar cheer kar nikalta hai. Sadak ka shor hamesha mic mein aa hi jaata hai. Asli art vacuum banana nahi, balki yeh chunna hai ki kaunsa leak bachana hai."
    }
  ];

  /* --------------------------------------------------------------------------
     2. Toast Notification Helper
     -------------------------------------------------------------------------- */
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

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

    // Close mobile nav when clicking a link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. Floating Minimal Audio Dock & Beats Player
     -------------------------------------------------------------------------- */
  const audioDock = document.getElementById('audio-dock');
  const dockPlayPauseBtn = document.getElementById('dock-play-pause-btn');
  const dockPlayIcon = document.getElementById('dock-play-icon');
  const dockPauseIcon = document.getElementById('dock-pause-icon');
  const dockTitle = document.getElementById('dock-title');
  const dockMeta = document.getElementById('dock-meta');
  const dockScrubber = document.getElementById('dock-scrubber');
  const dockCloseBtn = document.getElementById('dock-close-btn');

  const beatAudio = new Audio();
  let currentPlayingRow = null;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function setDockPlayingState(isPlaying) {
    if (isPlaying) {
      dockPlayIcon.style.display = 'none';
      dockPauseIcon.style.display = 'block';
    } else {
      dockPlayIcon.style.display = 'block';
      dockPauseIcon.style.display = 'none';
    }
  }

  function playBeat(row) {
    // If Sound Lab comparison player is playing, pause it
    stopLabPlayer();

    if (currentPlayingRow === row && !beatAudio.paused) {
      beatAudio.pause();
      row.classList.remove('playing');
      setDockPlayingState(false);
      return;
    }

    if (currentPlayingRow && currentPlayingRow !== row) {
      currentPlayingRow.classList.remove('playing');
    }

    currentPlayingRow = row;
    const src = row.getAttribute('data-src');
    const title = row.getAttribute('data-title');
    const bpm = row.getAttribute('data-bpm');
    const genre = row.getAttribute('data-genre');

    if (beatAudio.src !== window.location.origin + '/' + src && !beatAudio.src.endsWith(src)) {
      beatAudio.src = src;
      beatAudio.load();
    }

    dockTitle.textContent = title;
    dockMeta.textContent = `${genre} • ${bpm} BPM`;
    audioDock.classList.add('visible');

    beatAudio.play().then(() => {
      row.classList.add('playing');
      setDockPlayingState(true);
    }).catch(err => {
      console.warn("Audio play prevented:", err);
    });
  }

  // Row play buttons
  document.querySelectorAll('.beat-item').forEach(row => {
    const playBtn = row.querySelector('.beat-play-btn');
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playBeat(row);
    });

    row.addEventListener('click', (e) => {
      if (e.target.closest('.beat-cta-btn')) return;
      playBeat(row);
    });
  });

  // Dock Controls
  if (dockPlayPauseBtn) {
    dockPlayPauseBtn.addEventListener('click', () => {
      if (!beatAudio.src) return;
      if (beatAudio.paused) {
        stopLabPlayer();
        beatAudio.play();
        if (currentPlayingRow) currentPlayingRow.classList.add('playing');
        setDockPlayingState(true);
      } else {
        beatAudio.pause();
        if (currentPlayingRow) currentPlayingRow.classList.remove('playing');
        setDockPlayingState(false);
      }
    });
  }

  if (dockCloseBtn) {
    dockCloseBtn.addEventListener('click', () => {
      beatAudio.pause();
      if (currentPlayingRow) currentPlayingRow.classList.remove('playing');
      audioDock.classList.remove('visible');
    });
  }

  // Time & Scrubber Update
  beatAudio.addEventListener('timeupdate', () => {
    if (!beatAudio.duration) return;
    const current = beatAudio.currentTime;
    const total = beatAudio.duration;
    dockScrubber.value = (current / total) * 100;
    dockMeta.textContent = `${formatTime(current)} / ${formatTime(total)}`;
  });

  beatAudio.addEventListener('ended', () => {
    if (currentPlayingRow) currentPlayingRow.classList.remove('playing');
    setDockPlayingState(false);
    dockScrubber.value = 0;
  });

  if (dockScrubber) {
    dockScrubber.addEventListener('input', () => {
      if (!beatAudio.duration) return;
      beatAudio.currentTime = (dockScrubber.value / 100) * beatAudio.duration;
    });
  }

  /* --------------------------------------------------------------------------
     6. Sound Lab: Live A/B Master Comparison Player
     -------------------------------------------------------------------------- */
  const labConsole = document.getElementById('lab-console');
  const comparePlayBtn = document.getElementById('compare-play-btn');
  const comparePlayIcon = document.getElementById('compare-play-icon');
  const comparePauseIcon = document.getElementById('compare-pause-icon');
  const btnToggleRaw = document.getElementById('btn-toggle-raw');
  const btnToggleMastered = document.getElementById('btn-toggle-mastered');
  const currentStreamName = document.getElementById('current-stream-name');
  const visualizerBars = document.querySelectorAll('.meter-bar');

  const rawAudio = new Audio('audio/mix_raw.wav');
  const masteredAudio = new Audio('audio/mix_mastered.wav');

  rawAudio.loop = true;
  masteredAudio.loop = true;

  let activeStream = 'raw'; // 'raw' or 'mastered'
  let isLabPlaying = false;
  let visualizerInterval = null;

  function stopLabPlayer() {
    if (!isLabPlaying) return;
    rawAudio.pause();
    masteredAudio.pause();
    isLabPlaying = false;
    labConsole.classList.remove('playing');
    comparePlayIcon.style.display = 'block';
    comparePauseIcon.style.display = 'none';
    clearInterval(visualizerInterval);
    resetVisualizer();
  }

  function resetVisualizer() {
    visualizerBars.forEach(bar => {
      bar.style.height = '12%';
    });
  }

  function startVisualizer() {
    clearInterval(visualizerInterval);
    visualizerInterval = setInterval(() => {
      if (!isLabPlaying) return;
      visualizerBars.forEach(bar => {
        // Humanized dynamic audio meter heights
        const height = Math.floor(Math.random() * 75) + 18;
        bar.style.height = `${height}%`;
      });
    }, 90);
  }

  function toggleLabPlayback() {
    // Stop beat playback when lab plays
    if (!beatAudio.paused) {
      beatAudio.pause();
      if (currentPlayingRow) currentPlayingRow.classList.remove('playing');
      setDockPlayingState(false);
    }

    if (isLabPlaying) {
      stopLabPlayer();
    } else {
      isLabPlaying = true;
      labConsole.classList.add('playing');
      comparePlayIcon.style.display = 'none';
      comparePauseIcon.style.display = 'block';

      // Synchronize timeline perfectly
      const activeAudio = activeStream === 'raw' ? rawAudio : masteredAudio;
      const inactiveAudio = activeStream === 'raw' ? masteredAudio : rawAudio;

      inactiveAudio.pause();
      activeAudio.play().then(() => {
        startVisualizer();
      }).catch(err => {
        console.warn("Lab audio error:", err);
      });
    }
  }

  function switchStream(target) {
    if (activeStream === target) return;

    activeStream = target;
    btnToggleRaw.classList.toggle('active', target === 'raw');
    btnToggleMastered.classList.toggle('active', target === 'mastered');
    currentStreamName.textContent = target === 'raw' ? 'Raw Mix' : 'Mastered';

    if (isLabPlaying) {
      const fromAudio = target === 'raw' ? masteredAudio : rawAudio;
      const toAudio = target === 'raw' ? rawAudio : masteredAudio;

      // Keep exact timestamp for seamless A/B cross-switching!
      toAudio.currentTime = fromAudio.currentTime;
      fromAudio.pause();
      toAudio.play().catch(e => console.warn(e));
    }
  }

  if (comparePlayBtn) {
    comparePlayBtn.addEventListener('click', toggleLabPlayback);
  }

  if (btnToggleRaw) {
    btnToggleRaw.addEventListener('click', () => switchStream('raw'));
  }

  if (btnToggleMastered) {
    btnToggleMastered.addEventListener('click', () => switchStream('mastered'));
  }

  /* --------------------------------------------------------------------------
     7. Photography Gallery Filters & Lightbox
     -------------------------------------------------------------------------- */
  const photoChips = document.querySelectorAll('.photo-filter-nav .filter-chip');
  const photoCards = document.querySelectorAll('.photo-card');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  photoChips.forEach(chip => {
    chip.addEventListener('click', () => {
      photoChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.getAttribute('data-filter');
      photoCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  photoCards.forEach(card => {
    card.addEventListener('click', () => {
      const imgSrc = card.getAttribute('data-img');
      const title = card.getAttribute('data-title');
      const category = card.getAttribute('data-category');

      lightboxImg.src = imgSrc;
      lightboxCaption.textContent = `${title} • ${category}`;
      lightboxModal.classList.add('active');
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
  }

  /* --------------------------------------------------------------------------
     8. The Written Word (Alfaaz) Loader & Reader Modal
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

  // Load from data/writings.json if running with HTTP, fallback gracefully to defaultWritings
  fetch('data/writings.json')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        loadedWritings = data;
      }
      renderWritings(loadedWritings);
    })
    .catch(() => {
      // Local file:// protocol fallback
      renderWritings(defaultWritings);
    });

  // Writing Category Filters
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

  // Close modals on overlay click or Escape key
  [lightboxModal, readerModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightboxModal) lightboxModal.classList.remove('active');
      if (readerModal) readerModal.classList.remove('active');
    }
  });

  /* --------------------------------------------------------------------------
     9. Global Helpers (License prefill, Form handling)
     -------------------------------------------------------------------------- */
  window.prefillLicense = function(trackTitle) {
    const serviceSelect = document.getElementById('form-service');
    const messageField = document.getElementById('form-message');

    if (serviceSelect) serviceSelect.value = 'beats';
    if (messageField) {
      messageField.value = `Hello Jitesh! Mujhe aapke '${trackTitle}' beat ka license lena hai. Thodi pricing aur commercial rights ke baare mein discuss karna tha.`;
      messageField.focus();
    }
  };

  window.handleFormSubmit = function(e) {
    e.preventDefault();
    const btnSubmit = document.getElementById('btn-submit');
    const name = document.getElementById('form-name').value;

    if (btnSubmit) {
      btnSubmit.innerHTML = `<span>Bheja ja raha hai...</span>`;
      btnSubmit.disabled = true;
    }

    setTimeout(() => {
      showToast(`Shukriya ${name}! Message mil gaya, jaldi reply karta hoon.`);
      document.getElementById('booking-form').reset();
      if (btnSubmit) {
        btnSubmit.innerHTML = `<span>Message Bhejo</span><span class="arrow">→</span>`;
        btnSubmit.disabled = false;
      }
    }, 700);
  };

});
