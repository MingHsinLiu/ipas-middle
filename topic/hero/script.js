document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const cards = document.querySelectorAll('.cert-card');
    cards.forEach((card, index) => {
        // Add staggered transition delay based on DOM order
        card.style.transitionDelay = `${index * 150}ms`;
        observer.observe(card);
    });
});
