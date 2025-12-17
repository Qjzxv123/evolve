// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;

// Check for saved theme preference or default to 'dark'
const currentTheme = localStorage.getItem('theme') || 'dark';
htmlElement.setAttribute('data-theme', currentTheme);

// Theme toggle click handler
if (themeToggle) {
    themeToggle.addEventListener('click', function() {
        const theme = htmlElement.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// CTA Button click handlers
const ctaButtons = document.querySelectorAll('.cta-button');
ctaButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Scroll to contact section or perform action
        const contactSection = document.querySelector('footer');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Enhanced scroll animations with multiple effects
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

// Different animation styles
const animations = {
    fadeInUp: 'fadeInUp 0.8s ease-out forwards',
    fadeInLeft: 'fadeInLeft 0.8s ease-out forwards',
    fadeInRight: 'fadeInRight 0.8s ease-out forwards',
    scaleIn: 'scaleIn 0.6s ease-out forwards',
    slideUp: 'slideUp 0.7s ease-out forwards'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Add stagger delay based on index
            const delay = index * 0.1;
            entry.target.style.animationDelay = `${delay}s`;
            
            // Apply animation based on element class
            if (entry.target.classList.contains('stat-card')) {
                entry.target.style.animation = animations.scaleIn;
            } else if (entry.target.classList.contains('feature')) {
                entry.target.style.animation = animations.fadeInUp;
            } else if (entry.target.classList.contains('tech-item') || entry.target.classList.contains('tech-category')) {
                entry.target.style.animation = animations.fadeInUp;
            } else if (entry.target.classList.contains('project-card')) {
                entry.target.style.animation = animations.slideUp;
            } else if (entry.target.classList.contains('tier-card')) {
                entry.target.style.animation = animations.scaleIn;
            } else {
                entry.target.style.animation = animations.fadeInUp;
            }
            
            entry.target.classList.add('animated');
            // Unobserve after animation to prevent re-triggering
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements that should animate on scroll
document.querySelectorAll('.service-card, .tier-card, .stat-card, .feature, .tech-item, .tech-category, .project-card, .tech-description, .projects-note, .cta-section').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// Add enhanced animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(40px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes fadeInLeft {
        from {
            opacity: 0;
            transform: translateX(-40px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes fadeInRight {
        from {
            opacity: 0;
            transform: translateX(40px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.8);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animated {
        opacity: 1 !important;
    }
`;
document.head.appendChild(style);

// Parallax effect for hero section
let lastScrollY = window.pageYOffset;
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-animation');
    if (hero) {
        const scrollY = window.pageYOffset;
        const speed = 0.5;
        hero.style.transform = `translateY(${scrollY * speed}px)`;
    }
    
    // Navbar active link update on scroll
    const sections = document.querySelectorAll('section, footer');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current) || 
            (current === '' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('active');
        }
    });
    
    lastScrollY = scrollY;
});

// External link handling for projects
document.querySelectorAll('.project-link').forEach(link => {
    link.addEventListener('click', function(e) {
        if (this.href.includes('github.com')) {
            // Open GitHub in new tab
            window.open(this.href, '_blank');
        }
    });
});

console.log('Evolve website loaded successfully!');
