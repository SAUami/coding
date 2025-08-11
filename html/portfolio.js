// Active menu highlight on scroll
window.addEventListener('scroll', () => {
    let scrollPos = window.scrollY + 60;
    document.querySelectorAll('section, header').forEach(section => {
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
            let id = section.getAttribute('id');
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            document.querySelector(`nav a[href="#${id}"]`)?.classList.add('active');
        }
    });
});

// Fade-in animation when section is visible
const sections = document.querySelectorAll('section');
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => {
    observer.observe(section);
});

console.log("Welcome to Saurabh Sharma's Portfolio!");
