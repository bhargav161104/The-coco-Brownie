document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('ph-list');
                icon.classList.add('ph-x');
            } else {
                icon.classList.remove('ph-x');
                icon.classList.add('ph-list');
            }
        });
    }

    // 2. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. Scroll Reveal Animation for Sections
    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(sec => observer.observe(sec));

    // 4. Update Cart Badge globally
    updateCartBadge();
});

// Cart Logic (LocalStorage based)
const getCart = () => {
    const cart = localStorage.getItem('coco_cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCart = (cart) => {
    localStorage.setItem('coco_cart', JSON.stringify(cart));
    updateCartBadge();
};

const addToCart = (product, quantity = 1) => {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id === product.id);

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }

    saveCart(cart);
    showToast(`Added ${product.name} to cart!`);
};

const updateCartBadge = () => {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
};

// Toast Notification System
const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'glass-card toast-notification';
    toast.innerHTML = `<i class="ph ph-check-circle" style="color: #25D366; font-size: 1.2rem;"></i> ${message}`;

    // Inline styling for toast (can move to CSS later)
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%) translateY(50px)',
        padding: '12px 24px',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        opacity: '0',
        transition: 'all 0.3s ease',
        color: 'var(--accent-color)'
    });

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    // Remove after 3s
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(50px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Expose methods globally
window.cartHelpers = {
    getCart, saveCart, addToCart, updateCartBadge, showToast
};
