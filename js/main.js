document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       1. Global Beat Player Logic
       ========================================================================== */
    const globalAudio = new Audio();
    let currentBeatRow = null;
    
    // UI Elements
    const playerBar = document.getElementById('global-player-bar');
    const barPlayPauseBtn = document.getElementById('bar-play-pause');
    const barPlayIcon = document.getElementById('bar-play-icon');
    const barPauseIcon = document.getElementById('bar-pause-icon');
    const progressBar = document.getElementById('player-progress');
    const timeCurrent = document.getElementById('time-current');
    const timeTotal = document.getElementById('time-total');
    const volumeSlider = document.getElementById('volume-slider');
    
    const barTitle = document.getElementById('bar-title');
    const barSubtitle = document.getElementById('bar-subtitle');
    const barArtwork = document.getElementById('bar-artwork');

    const beatRows = document.querySelectorAll('.beat-row');

    function formatTime(secs) {
        if (isNaN(secs)) return '0:00';
        const minutes = Math.floor(secs / 60);
        const seconds = Math.floor(secs % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function updateBeatRowUI(row, isPlaying) {
        const playBtn = row.querySelector('.beat-play-btn');
        if (isPlaying) {
            row.classList.add('active', 'playing');
            playBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="4" width="4" height="16" rx="1"></rect>
                    <rect x="16" y="4" width="4" height="16" rx="1"></rect>
                </svg>`;
        } else {
            row.classList.remove('playing');
            playBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>`;
        }
    }

    function selectBeat(row) {
        // Reset old row
        if (currentBeatRow && currentBeatRow !== row) {
            updateBeatRowUI(currentBeatRow, false);
            currentBeatRow.classList.remove('active');
        }

        currentBeatRow = row;
        const src = row.getAttribute('data-src');
        const title = row.getAttribute('data-title');
        const genre = row.getAttribute('data-genre');
        const art = row.getAttribute('data-art') || title.charAt(0);

        // Load new source
        globalAudio.src = src;
        globalAudio.load();
        
        // Update Sticky Player Bar Info
        barTitle.textContent = title;
        barSubtitle.textContent = genre;
        barArtwork.textContent = art;
        
        // Show player bar
        playerBar.classList.add('visible');
    }

    function togglePlay() {
        if (!globalAudio.src) return;

        if (globalAudio.paused) {
            // Pause mix-master compare player if running
            pauseComparisonPlayer();
            
            globalAudio.play()
                .then(() => {
                    updateBeatRowUI(currentBeatRow, true);
                    barPlayIcon.style.display = 'none';
                    barPauseIcon.style.display = 'block';
                })
                .catch(err => console.error("Error playing audio:", err));
        } else {
            globalAudio.pause();
            updateBeatRowUI(currentBeatRow, false);
            barPlayIcon.style.display = 'block';
            barPauseIcon.style.display = 'none';
        }
    }

    // Row click listeners
    beatRows.forEach(row => {
        const playBtn = row.querySelector('.beat-play-btn');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentBeatRow === row) {
                togglePlay();
            } else {
                selectBeat(row);
                togglePlay();
            }
        });
        
        // Let row click play as well
        row.addEventListener('click', () => {
            if (currentBeatRow === row) {
                togglePlay();
            } else {
                selectBeat(row);
                togglePlay();
            }
        });
    });

    // Bar controls
    barPlayPauseBtn.addEventListener('click', togglePlay);

    // Audio Event Listeners
    globalAudio.addEventListener('timeupdate', () => {
        if (globalAudio.duration) {
            const percent = (globalAudio.currentTime / globalAudio.duration) * 100;
            progressBar.value = percent;
            timeCurrent.textContent = formatTime(globalAudio.currentTime);
        }
    });

    globalAudio.addEventListener('loadedmetadata', () => {
        timeTotal.textContent = formatTime(globalAudio.duration);
    });

    globalAudio.addEventListener('ended', () => {
        updateBeatRowUI(currentBeatRow, false);
        barPlayIcon.style.display = 'block';
        barPauseIcon.style.display = 'none';
        progressBar.value = 0;
        timeCurrent.textContent = '0:00';
    });

    // Progress Bar Scrubbing
    progressBar.addEventListener('input', () => {
        if (globalAudio.duration) {
            const time = (progressBar.value / 100) * globalAudio.duration;
            globalAudio.currentTime = time;
        }
    });

    // Volume Control
    volumeSlider.addEventListener('input', () => {
        globalAudio.volume = volumeSlider.value;
    });


    /* ==========================================================================
       2. Seamless Mix & Master Comparison Player
       ========================================================================== */
    const audioRaw = new Audio('audio/mix_raw.wav');
    const audioMastered = new Audio('audio/mix_mastered.wav');
    
    // Set looping on both
    audioRaw.loop = true;
    audioMastered.loop = true;
    
    // Set initial volume
    audioRaw.volume = 0.8;
    audioMastered.volume = 0.8;

    let isComparisonPlaying = false;
    let isMasteredSelected = false; // start with raw

    const comparePlayBtn = document.getElementById('compare-play-btn');
    const comparePlayIcon = document.getElementById('compare-play-icon');
    const comparePauseIcon = document.getElementById('compare-pause-icon');
    const compareContainer = document.querySelector('.compare-container');
    const toggleRawBtn = document.getElementById('toggle-raw');
    const toggleMasteredBtn = document.getElementById('toggle-mastered');

    function syncMuteState() {
        if (isMasteredSelected) {
            audioRaw.muted = true;
            audioMastered.muted = false;
            compareContainer.classList.add('mastered');
            toggleRawBtn.classList.remove('active');
            toggleMasteredBtn.classList.add('active');
        } else {
            audioRaw.muted = false;
            audioMastered.muted = true;
            compareContainer.classList.remove('mastered');
            toggleRawBtn.classList.add('active');
            toggleMasteredBtn.classList.remove('active');
        }
    }

    function playComparisonPlayer() {
        // Pause beat player if running
        if (currentBeatRow && !globalAudio.paused) {
            togglePlay();
        }

        // Align playback positions
        const currentTime = Math.max(audioRaw.currentTime, audioMastered.currentTime);
        audioRaw.currentTime = currentTime;
        audioMastered.currentTime = currentTime;
        
        syncMuteState();

        Promise.all([audioRaw.play(), audioMastered.play()])
            .then(() => {
                isComparisonPlaying = true;
                comparePlayBtn.classList.add('playing');
                comparePlayIcon.style.display = 'none';
                comparePauseIcon.style.display = 'block';
                
                // Continuous alignment syncing loop
                startSyncTimer();
            })
            .catch(err => console.error("Error playing comparison audio:", err));
    }

    function pauseComparisonPlayer() {
        audioRaw.pause();
        audioMastered.pause();
        isComparisonPlaying = false;
        comparePlayBtn.classList.remove('playing');
        comparePlayIcon.style.display = 'block';
        comparePauseIcon.style.display = 'none';
        stopSyncTimer();
    }

    function toggleComparisonPlay() {
        if (isComparisonPlaying) {
            pauseComparisonPlayer();
        } else {
            playComparisonPlayer();
        }
    }

    let syncInterval = null;
    function startSyncTimer() {
        stopSyncTimer();
        syncInterval = setInterval(() => {
            if (isComparisonPlaying) {
                // Ensure synchronization within ~50ms
                if (Math.abs(audioRaw.currentTime - audioMastered.currentTime) > 0.05) {
                    audioMastered.currentTime = audioRaw.currentTime;
                }
            }
        }, 1000);
    }

    function stopSyncTimer() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
    }

    comparePlayBtn.addEventListener('click', toggleComparisonPlay);

    // Switch buttons
    toggleRawBtn.addEventListener('click', () => {
        isMasteredSelected = false;
        syncMuteState();
        // Force alignment sync immediately on switch
        if (isComparisonPlaying) {
            audioMastered.currentTime = audioRaw.currentTime;
        }
    });

    toggleMasteredBtn.addEventListener('click', () => {
        isMasteredSelected = true;
        syncMuteState();
        // Force alignment sync immediately on switch
        if (isComparisonPlaying) {
            audioRaw.currentTime = audioMastered.currentTime;
        }
    });

    // Initialize mute states
    syncMuteState();


    /* ==========================================================================
       3. Photography Gallery & Lightbox
       ========================================================================== */
    const filterButtons = document.querySelectorAll('.filter-btn');
    const photoItems = document.querySelectorAll('.photo-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxTitle = lightbox.querySelector('.lightbox-title');
    const lightboxCategory = lightbox.querySelector('.lightbox-category');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const lightboxPrev = lightbox.querySelector('.lightbox-prev');
    const lightboxNext = lightbox.querySelector('.lightbox-next');

    let currentPhotoList = [];
    let currentPhotoIndex = -1;

    // Filters
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-filter');
            
            photoItems.forEach(item => {
                const itemCat = item.getAttribute('data-category');
                if (category === 'all' || itemCat === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Gather currently visible photos in the grid
    function getVisiblePhotos() {
        return Array.from(photoItems).filter(item => item.style.display !== 'none');
    }

    function openLightbox(item) {
        currentPhotoList = getVisiblePhotos();
        currentPhotoIndex = currentPhotoList.indexOf(item);
        
        const imgSrc = item.querySelector('img').src;
        const title = item.getAttribute('data-title');
        const category = item.getAttribute('data-category');

        lightboxImg.src = imgSrc;
        lightboxTitle.textContent = title;
        lightboxCategory.textContent = category;

        lightbox.classList.add('visible');
        document.body.style.overflow = 'hidden'; // stop scroll
    }

    function closeLightbox() {
        lightbox.classList.remove('visible');
        document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
        if (currentPhotoList.length === 0) return;
        
        currentPhotoIndex += direction;
        
        // Wrap around logic
        if (currentPhotoIndex < 0) {
            currentPhotoIndex = currentPhotoList.length - 1;
        } else if (currentPhotoIndex >= currentPhotoList.length) {
            currentPhotoIndex = 0;
        }

        const nextItem = currentPhotoList[currentPhotoIndex];
        
        const imgSrc = nextItem.querySelector('img').src;
        const title = nextItem.getAttribute('data-title');
        const category = nextItem.getAttribute('data-category');

        lightboxImg.src = imgSrc;
        lightboxTitle.textContent = title;
        lightboxCategory.textContent = category;
    }

    photoItems.forEach(item => {
        item.addEventListener('click', () => openLightbox(item));
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    lightboxNext.addEventListener('click', () => navigateLightbox(1));

    // Close on click outside
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('visible')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
    });


    /* ==========================================================================
       4. Writing Reader Modal
       ========================================================================== */
    const readerModal = document.getElementById('reader-modal');
    const readerCategory = readerModal.querySelector('.reader-category');
    const readerTitle = readerModal.querySelector('.reader-title');
    const readerBody = readerModal.querySelector('.reader-body');
    const readerClose = readerModal.querySelector('.reader-close');
    const readMoreBtns = document.querySelectorAll('.writing-read-more');

    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.writing-card');
            const category = card.querySelector('.writing-category').textContent;
            const title = card.querySelector('h3').textContent;
            const fullText = card.getAttribute('data-fulltext');

            readerCategory.textContent = category;
            readerTitle.textContent = title;
            readerBody.textContent = fullText;

            readerModal.classList.add('visible');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeReader() {
        readerModal.classList.remove('visible');
        document.body.style.overflow = '';
    }

    readerClose.addEventListener('click', closeReader);
    readerModal.addEventListener('click', (e) => {
        if (e.target === readerModal) {
            closeReader();
        }
    });


    /* ==========================================================================
       5. Scroll Fade-in Animations (Intersection Observer)
       ========================================================================== */
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                fadeObserver.unobserve(entry.target); // run once
            }
        });
    }, observerOptions);

    // Apply basic fade classes to main blocks
    const animatedElements = document.querySelectorAll('.stack-card, .beat-row, .mix-showcase-box, .photo-item, .writing-card, .booking-form');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        fadeObserver.observe(el);
    });

    // Style helper for observer triggers
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = '.animate-in { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(styleSheet);


    /* ==========================================================================
       6. Navbar Highlight on Scroll
       ========================================================================== */
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(sec => {
            const secTop = sec.offsetTop;
            const secHeight = sec.clientHeight;
            if (scrollPos >= secTop && scrollPos < secTop + secHeight) {
                current = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

});
