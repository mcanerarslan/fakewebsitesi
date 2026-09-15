   document.addEventListener('DOMContentLoaded', () => {
            const analytics = {
                push(event, details) {
                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({ event, ...details });
                },
                clickLocation(link) {
                    return link.dataset.trackingLocation
                        || link.getAttribute('aria-label')
                        || link.textContent.trim().replace(/\s+/g, ' ')
                        || window.location.pathname;
                }
            };

            // One delegated listener covers existing and subsequently added CTA links.
            // It only runs for a user action; no event is sent on page load.
            document.addEventListener('click', (event) => {
                const link = event.target.closest('a[href]');
                if (!link) return;

                const href = link.href;
                const click_location = analytics.clickLocation(link);
                if (href.startsWith('tel:')) {
                    analytics.push('phone_click', { click_location });
                } else if (/^(https?:)?\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) {
                    analytics.push('whatsapp_click', { click_location });
                }
            });

            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const UI = {
                nav: document.getElementById('navbar'),
                menuBtn: document.getElementById('menuBtn'),
                mobileMenu: document.getElementById('mobileMenu'),
                closeMenu: document.getElementById('closeMenu'),
                overlay: document.getElementById('overlay'),
                form: document.getElementById('quoteForm'),
                links: document.querySelectorAll('.nav-links a, .mobile-push-menu a')
            };

            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    UI.nav.classList.add('sticky');
                } else {
                    UI.nav.classList.remove('sticky');
                }
            }, { passive: true });

            const toggleMenu = () => {
                UI.mobileMenu.classList.toggle('active');
                UI.menuBtn.setAttribute('aria-expanded', String(UI.mobileMenu.classList.contains('active')));
                UI.overlay.classList.toggle('active');
                document.body.style.overflow = UI.mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
            };

            UI.menuBtn.addEventListener('click', toggleMenu);
            UI.closeMenu.addEventListener('click', toggleMenu);
            UI.overlay.addEventListener('click', toggleMenu);

            UI.links.forEach(link => {
                link.addEventListener('click', () => {
                    UI.mobileMenu.classList.remove('active');
                    UI.menuBtn.setAttribute('aria-expanded', 'false');
                    UI.overlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                });
            });

            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('show');
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.reveal, .card, .t-card, .faq-item, .bolge-kart, .galeri-item').forEach(el => {
                el.classList.add('reveal');
                revealObserver.observe(el);
            });

            const reviewsGrid = document.getElementById('googleReviewsGrid');
            if (reviewsGrid) {
                const reviewsStatus = document.getElementById('googleReviewsStatus');
                const ratingSummary = document.getElementById('googleRatingSummary');
                const ratingValue = document.getElementById('googleRatingValue');
                const ratingStars = document.getElementById('googleRatingStars');
                const ratingCount = document.getElementById('googleRatingCount');
                const reviewsLink = document.getElementById('googleReviewsLink');
                const reviewsEyebrow = document.getElementById('reviewsEyebrow');
                const reviewsConfig = window.GOOGLE_REVIEWS_CONFIG || {};

                const buildStars = (rating) => {
                    const container = document.createDocumentFragment();
                    const roundedRating = Math.round(Number(rating) || 0);
                    for (let index = 1; index <= 5; index += 1) {
                        const star = document.createElement('i');
                        star.className = `fas fa-star${index > roundedRating ? ' is-empty' : ''}`;
                        container.appendChild(star);
                    }
                    return container;
                };

                const showReviewsError = () => {
                    if (reviewsGrid.children.length) {
                        reviewsStatus.hidden = true;
                        return;
                    }
                    reviewsStatus.classList.add('is-error');
                    reviewsStatus.innerHTML = '<i class="fab fa-google" aria-hidden="true"></i><span>Yorumlar şu anda görüntülenemiyor. Güncel yorumları Google üzerinden inceleyebilirsiniz.</span>';
                };

                const renderReview = (review) => {
                    const card = document.createElement('article');
                    const stars = document.createElement('div');
                    const text = document.createElement('p');
                    const user = document.createElement('div');
                    const info = document.createElement('div');
                    const name = document.createElement('h3');
                    const author = review.authorAttribution || {};

                    card.className = 't-card reveal show';
                    stars.className = 'stars';
                    stars.setAttribute('role', 'img');
                    stars.setAttribute('aria-label', `${review.rating || 0} / 5 yıldız`);
                    stars.appendChild(buildStars(review.rating));

                    text.className = 't-text';
                    text.textContent = review.text ? `“${review.text}”` : 'Kullanıcı bu işletmeye yıldız puanı verdi.';

                    user.className = 't-user';
                    if (author.photoURI) {
                        const photo = document.createElement('img');
                        photo.src = author.photoURI;
                        photo.alt = '';
                        photo.loading = 'lazy';
                        photo.width = 48;
                        photo.height = 48;
                        user.appendChild(photo);
                    } else {
                        const avatar = document.createElement('span');
                        avatar.className = 't-avatar-fallback';
                        avatar.textContent = (author.displayName || 'G').trim().charAt(0).toLocaleUpperCase('tr-TR');
                        avatar.setAttribute('aria-hidden', 'true');
                        user.appendChild(avatar);
                    }

                    info.className = 't-info';
                    if (author.uri) {
                        const authorLink = document.createElement('a');
                        authorLink.href = author.uri;
                        authorLink.target = '_blank';
                        authorLink.rel = 'noopener noreferrer';
                        authorLink.textContent = author.displayName || 'Google kullanıcısı';
                        name.appendChild(authorLink);
                    } else {
                        name.textContent = author.displayName || 'Google kullanıcısı';
                    }

                    const date = document.createElement('span');
                    date.textContent = review.relativePublishTimeDescription || (review.publishTime ? new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(review.publishTime) : 'Google yorumu');
                    info.append(name, date);
                    user.appendChild(info);
                    card.append(stars, text, user);
                    return card;
                };

                const loadGoogleMaps = (apiKey) => new Promise((resolve, reject) => {
                    if (window.google?.maps?.importLibrary) {
                        resolve();
                        return;
                    }

                    const callbackName = `initGoogleReviews_${Date.now()}`;
                    const script = document.createElement('script');
                    window[callbackName] = () => {
                        delete window[callbackName];
                        resolve();
                    };
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places&language=tr&region=TR&callback=${callbackName}`;
                    script.async = true;
                    script.onerror = () => {
                        delete window[callbackName];
                        reject(new Error('Google Maps JavaScript API yüklenemedi.'));
                    };
                    document.head.appendChild(script);
                });

                const loadGoogleReviews = async () => {
                    reviewsLink.href = reviewsConfig.fallbackUrl || reviewsLink.href;
                    if (!reviewsConfig.apiKey || !reviewsConfig.placeId) {
                        console.info('Google yorumları için google-reviews-config.js dosyasındaki apiKey ve placeId alanlarını doldurun.');
                        showReviewsError();
                        return;
                    }

                    try {
                        reviewsStatus.hidden = false;
                        await loadGoogleMaps(reviewsConfig.apiKey);
                        const { Place } = await google.maps.importLibrary('places');
                        const place = new Place({ id: reviewsConfig.placeId });
                        await place.fetchFields({ fields: ['displayName', 'rating', 'userRatingCount', 'reviews', 'googleMapsURI'] });

                        if (place.googleMapsURI) reviewsLink.href = place.googleMapsURI;
                        if (place.rating) {
                            ratingValue.textContent = Number(place.rating).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                            ratingStars.replaceChildren(buildStars(place.rating));
                            ratingCount.textContent = `${Number(place.userRatingCount || 0).toLocaleString('tr-TR')} Google yorumu`;
                            ratingSummary.hidden = false;
                        }

                        const reviews = (place.reviews || []).filter(review => review.rating && (review.text || review.authorAttribution));
                        if (!reviews.length) throw new Error('Bu işletme için gösterilebilir yorum bulunamadı.');

                        reviewsGrid.replaceChildren(...reviews.map(renderReview));
                        reviewsEyebrow.textContent = 'GOOGLE YORUMLARI';
                        reviewsStatus.hidden = true;
                    } catch (error) {
                        console.error('Google yorumları yüklenemedi:', error);
                        showReviewsError();
                    }
                };

                // Load once, only when the reviews section is near the viewport.
                if ('IntersectionObserver' in window) {
                    const reviewsObserver = new IntersectionObserver((entries) => {
                        if (entries.some(entry => entry.isIntersecting)) {
                            reviewsObserver.disconnect();
                            loadGoogleReviews();
                        }
                    }, { rootMargin: '400px' });
                    reviewsObserver.observe(reviewsGrid);
                } else {
                    loadGoogleReviews();
                }
            }

            const faqItems = document.querySelectorAll('details.faq-item');
            if (faqItems.length) {
                const mobileFaq = window.matchMedia('(max-width: 640px)');

                const syncFaqMode = () => {
                    faqItems.forEach((item, index) => {
                        if (mobileFaq.matches) {
                            item.open = index === 0;
                        } else {
                            item.open = true;
                        }
                    });
                };

                faqItems.forEach(item => {
                    item.addEventListener('toggle', () => {
                        if (!mobileFaq.matches || !item.open) return;
                        faqItems.forEach(other => {
                            if (other !== item) other.open = false;
                        });
                    });
                });

                syncFaqMode();
                mobileFaq.addEventListener('change', syncFaqMode);
            }

            if (UI.form) {
                const submitButton = UI.form.querySelector('button[type="submit"]');
                const formFields = UI.form.querySelectorAll('input, textarea');
                let formRedirecting = false;
                submitButton.disabled = false;
                formFields.forEach(field => {
                    field.addEventListener('input', () => field.setCustomValidity(''));
                });
                UI.form.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const fields = UI.form.elements;
                    const fullName = fields.namedItem('fullName');
                    const phone = fields.namedItem('phone');
                    fullName.setCustomValidity(fullName.value.trim().length >= 2 ? '' : 'Lütfen adınızı ve soyadınızı yazın.');
                    const phoneValue = phone.value.trim();
                    const digits = phoneValue.replace(/\D/g, '');
                    const validPhone = /^[+\d\s().-]+$/.test(phoneValue) && digits.length >= 10 && digits.length <= 15;
                    phone.setCustomValidity(validPhone ? '' : 'Lütfen alan koduyla birlikte geçerli bir telefon numarası yazın.');
                    if (!UI.form.reportValidity()) return;
                    if (formRedirecting) return;
                    formRedirecting = true;
                    submitButton.disabled = true;

                    const lines = ['Merhaba, nakliye için teklif almak istiyorum.'];
                    const labels = [
                        ['fullName', 'Ad Soyad'], ['phone', 'Telefon'],
                        ['fromLocation', 'Nereden'], ['toLocation', 'Nereye'],
                        ['movingDate', 'Taşınma tarihi'], ['homeSize', 'Daire / Eşya bilgisi'],
                        ['notes', 'Notlar']
                    ];
                    labels.forEach(([name, label]) => {
                        const value = fields.namedItem(name).value.trim();
                        if (value) lines.push(`${label}: ${value}`);
                    });
                    // Same-tab navigation avoids popup blockers; submission happens in WhatsApp.
                    // Keep the fields intact so returning to the page does not discard the request.
                    analytics.push('quote_form_whatsapp', {
                        form_name: 'Teklif formu',
                        form_location: window.location.pathname
                    });
                    window.location.assign('https://wa.me/905079735373?text=' + encodeURIComponent(lines.join('\n')));
                });
            }

            const galleryItems = document.querySelectorAll('.galeri-item');
            if (galleryItems.length) {
                const lightbox = document.createElement('div');
                lightbox.className = 'gallery-lightbox';
                lightbox.setAttribute('aria-hidden', 'true');
                lightbox.innerHTML = `
                    <div class="gallery-lightbox-content" role="dialog" aria-modal="true" aria-label="Galeri görseli">
                        <button class="gallery-lightbox-close" type="button" aria-label="Görseli kapat">&times;</button>
                        <button class="gallery-lightbox-arrow gallery-lightbox-prev" type="button" aria-label="Önceki görsel"><i class="fas fa-chevron-left"></i></button>
                        <img src="" alt="">
                        <button class="gallery-lightbox-arrow gallery-lightbox-next" type="button" aria-label="Sonraki görsel"><i class="fas fa-chevron-right"></i></button>
                    </div>
                `;
                document.body.appendChild(lightbox);

                const lightboxImg = lightbox.querySelector('img');
                const closeBtn = lightbox.querySelector('.gallery-lightbox-close');
                const prevBtn = lightbox.querySelector('.gallery-lightbox-prev');
                const nextBtn = lightbox.querySelector('.gallery-lightbox-next');
                let activeGalleryIndex = 0;

                const showGalleryItem = (index) => {
                    activeGalleryIndex = (index + galleryItems.length) % galleryItems.length;
                    const item = galleryItems[activeGalleryIndex];
                    const img = item.querySelector('img');
                    lightboxImg.src = img.src;
                    lightboxImg.alt = img.alt;
                };

                const openLightbox = (index) => {
                    showGalleryItem(index);
                    lightbox.classList.add('active');
                    lightbox.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                    closeBtn.focus();
                };

                const goToPreviousImage = () => showGalleryItem(activeGalleryIndex - 1);
                const goToNextImage = () => showGalleryItem(activeGalleryIndex + 1);

                const closeLightbox = () => {
                    lightbox.classList.remove('active');
                    lightbox.setAttribute('aria-hidden', 'true');
                    lightboxImg.src = '';
                    document.body.style.overflow = UI.mobileMenu.classList.contains('active') ? 'hidden' : 'auto';
                };

                galleryItems.forEach((item, index) => {
                    item.addEventListener('click', () => openLightbox(index));
                    item.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openLightbox(index);
                        }
                    });
                });

                closeBtn.addEventListener('click', closeLightbox);
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goToPreviousImage();
                });
                nextBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goToNextImage();
                });
                lightbox.addEventListener('click', (e) => {
                    if (e.target === lightbox) closeLightbox();
                });
                document.addEventListener('keydown', (e) => {
                    if (!lightbox.classList.contains('active')) return;
                    if (e.key === 'Escape') closeLightbox();
                    if (e.key === 'ArrowLeft') {
                        e.preventDefault();
                        goToPreviousImage();
                    }
                    if (e.key === 'ArrowRight') {
                        e.preventDefault();
                        goToNextImage();
                    }
                });
            }
        });
