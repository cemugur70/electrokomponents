/**
 * ElectroKomponents - Ana JavaScript
 */

document.addEventListener('DOMContentLoaded', function () {

    // ===========================================
    // SCROLL TO TOP
    // ===========================================
    const scrollToTopBtn = document.getElementById('scrollToTop');

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===========================================
    // ALERT CLOSE
    // ===========================================
    document.querySelectorAll('.alert-close').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.alert').remove();
        });
    });

    // ===========================================
    // CART DRAWER
    // ===========================================
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartDrawerOverlay');
    const openCartBtn = document.getElementById('openCartDrawer');
    const closeCartBtn = document.getElementById('closeCartDrawer');

    function openCartDrawer() {
        cartDrawer.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadCartItems();
    }

    function closeCartDrawer() {
        cartDrawer.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (openCartBtn) openCartBtn.addEventListener('click', openCartDrawer);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

    // ===========================================
    // LOAD CART ITEMS
    // ===========================================
    async function loadCartItems() {
        try {
            const response = await fetch('/api/sepet');
            const data = await response.json();

            if (data.success) {
                updateCartUI(data.data);
            }
        } catch (error) {
            console.error('Sepet yüklenirken hata:', error);
        }
    }

    function updateCartUI(cartData) {
        const cartContent = document.getElementById('cartDrawerContent');
        const cartBadge = document.getElementById('cartBadge');
        const cartTotal = document.getElementById('cartDrawerTotal');
        const cartMiniTotal = document.getElementById('cartMiniTotal');

        if (cartBadge) cartBadge.textContent = cartData.adet;

        const formattedTotal = cartData.araToplam.toFixed(2).replace('.', ',') + ' ₺';
        if (cartTotal) cartTotal.textContent = formattedTotal;
        if (cartMiniTotal) cartMiniTotal.textContent = formattedTotal;

        if (cartContent) {
            if (cartData.items.length === 0) {
                cartContent.innerHTML = `
                    <div class="cart-empty">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Sepetiniz boş</p>
                        <a href="/urunler" class="btn btn-primary btn-sm">Alışverişe Başla</a>
                    </div>
                `;
            } else {
                cartContent.innerHTML = cartData.items.map(item => {
                    const urun = item.urun || item;
                    const resim = urun.resimler && urun.resimler.length > 0
                        ? urun.resimler[0].resim_url
                        : '/images/no-image.png';

                    return `
                        <div class="cart-item" data-product-id="${urun.id}">
                            <img src="${resim}" alt="${urun.ad}">
                            <div class="cart-item-info">
                                <h4>${urun.ad.substring(0, 50)}${urun.ad.length > 50 ? '...' : ''}</h4>
                                <p class="cart-item-pn">${urun.parca_no}</p>
                                <div class="cart-item-qty">
                                    <button class="qty-btn minus" onclick="updateCartItem(${urun.id}, ${item.adet - 1})">-</button>
                                    <span>${item.adet}</span>
                                    <button class="qty-btn plus" onclick="updateCartItem(${urun.id}, ${item.adet + 1})">+</button>
                                </div>
                            </div>
                            <div class="cart-item-price">
                                <span>${(parseFloat(urun.fiyat) * item.adet).toFixed(2).replace('.', ',')} ₺</span>
                                <button class="cart-item-remove" onclick="removeCartItem(${urun.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    }

    // Load cart on page load
    loadCartItems();

    // ===========================================
    // ADD TO CART
    // ===========================================
    document.addEventListener('click', async function (e) {
        if (e.target.closest('.btn-add-cart')) {
            const btn = e.target.closest('.btn-add-cart');
            const productId = btn.dataset.productId;
            const card = btn.closest('.product-card');
            const qtyInput = card.querySelector('.qty-input');
            const adet = qtyInput ? parseInt(qtyInput.value) : 1;

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const response = await fetch('/api/sepet/ekle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urun_id: productId, adet })
                });

                const data = await response.json();

                if (data.success) {
                    btn.innerHTML = '<i class="fas fa-check"></i> Eklendi';
                    loadCartItems();
                    setTimeout(() => {
                        btn.innerHTML = '<i class="fas fa-shopping-cart"></i><span>Sepete Ekle</span>';
                        btn.disabled = false;
                    }, 1500);
                } else {
                    alert(data.message);
                    btn.innerHTML = '<i class="fas fa-shopping-cart"></i><span>Sepete Ekle</span>';
                    btn.disabled = false;
                }
            } catch (error) {
                console.error('Sepete ekleme hatası:', error);
                btn.innerHTML = '<i class="fas fa-shopping-cart"></i><span>Sepete Ekle</span>';
                btn.disabled = false;
            }
        }
    });

    // ===========================================
    // QUANTITY SELECTOR
    // ===========================================
    document.addEventListener('click', function (e) {
        if (e.target.closest('.qty-btn')) {
            const btn = e.target.closest('.qty-btn');
            const selector = btn.closest('.quantity-selector');
            const input = selector.querySelector('.qty-input');
            const min = parseInt(input.dataset.min) || 1;
            let value = parseInt(input.value);

            if (btn.classList.contains('minus') && value > min) {
                input.value = value - 1;
            } else if (btn.classList.contains('plus')) {
                input.value = value + 1;
            }
        }
    });

    // ===========================================
    // SEARCH AUTOCOMPLETE
    // ===========================================
    const searchInput = document.getElementById('searchInput');
    const searchAutocomplete = document.getElementById('searchAutocomplete');
    const searchBtn = document.getElementById('searchBtn');
    let searchTimeout;

    if (searchInput && searchAutocomplete) {
        searchInput.addEventListener('input', function () {
            const query = this.value.trim();

            clearTimeout(searchTimeout);

            if (query.length < 2) {
                searchAutocomplete.classList.remove('active');
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/urunler/ara/autocomplete?q=${encodeURIComponent(query)}`);
                    const data = await response.json();

                    if (data.success && data.data.length > 0) {
                        searchAutocomplete.innerHTML = data.data.map(urun => {
                            const resim = urun.resimler && urun.resimler.length > 0
                                ? urun.resimler[0].resim_url
                                : '/images/no-image.png';

                            return `
                                <a href="/urun/${urun.slug}" class="search-autocomplete-item">
                                    <img src="${resim}" alt="${urun.ad}">
                                    <div class="search-autocomplete-item-info">
                                        <div class="search-autocomplete-item-name">${urun.ad.substring(0, 50)}</div>
                                        <div class="search-autocomplete-item-pn">${urun.parca_no}</div>
                                    </div>
                                    <div class="search-autocomplete-item-price">${parseFloat(urun.fiyat).toFixed(2).replace('.', ',')} ₺</div>
                                </a>
                            `;
                        }).join('');

                        searchAutocomplete.classList.add('active');
                    } else {
                        searchAutocomplete.classList.remove('active');
                    }
                } catch (error) {
                    console.error('Arama hatası:', error);
                }
            }, 300);
        });

        // Close autocomplete on click outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search-box')) {
                searchAutocomplete.classList.remove('active');
            }
        });

        // Search button click
        if (searchBtn) {
            searchBtn.addEventListener('click', function () {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    window.location.href = `/ara?q=${encodeURIComponent(query)}`;
                }
            });
        }

        // Enter key search
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query.length >= 2) {
                    window.location.href = `/ara?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // ===========================================
    // FAVORITE TOGGLE
    // ===========================================
    document.addEventListener('click', async function (e) {
        if (e.target.closest('.product-favorite')) {
            const btn = e.target.closest('.product-favorite');
            const productId = btn.dataset.productId;

            try {
                const response = await fetch('/api/favoriler/toggle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urun_id: productId })
                });

                const data = await response.json();

                if (data.success) {
                    if (data.isFavorite) {
                        btn.classList.add('active');
                        btn.innerHTML = '<i class="fas fa-heart"></i>';
                    } else {
                        btn.classList.remove('active');
                        btn.innerHTML = '<i class="far fa-heart"></i>';
                    }
                } else if (response.status === 401) {
                    window.location.href = '/auth/giris';
                }
            } catch (error) {
                console.error('Favori hatası:', error);
            }
        }
    });

    // ===========================================
    // NEWSLETTER FORM
    // ===========================================
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = this.querySelector('input[type="email"]').value;
            const btn = this.querySelector('button');

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // Simüle - gerçek API endpoint eklenmeli
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-check"></i> Abone Oldunuz!';
                this.querySelector('input').value = '';

                setTimeout(() => {
                    btn.innerHTML = 'Abone Ol <i class="fas fa-paper-plane"></i>';
                    btn.disabled = false;
                }, 2000);
            }, 1000);
        });
    }

});

// ===========================================
// GLOBAL FUNCTIONS
// ===========================================

// Update cart item
async function updateCartItem(productId, adet) {
    if (adet < 1) {
        removeCartItem(productId);
        return;
    }

    try {
        const response = await fetch('/api/sepet/guncelle', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urun_id: productId, adet })
        });

        const data = await response.json();

        if (data.success) {
            // Reload cart
            location.reload();
        }
    } catch (error) {
        console.error('Sepet güncelleme hatası:', error);
    }
}

// Remove cart item
async function removeCartItem(productId) {
    try {
        const response = await fetch(`/api/sepet/sil/${productId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            // Reload cart
            location.reload();
        }
    } catch (error) {
        console.error('Sepetten silme hatası:', error);
    }
}
