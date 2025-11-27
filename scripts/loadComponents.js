// Load Navigation and Footer Components
document.addEventListener('DOMContentLoaded', () => {
    loadNav();
    loadFooter();
});

function loadNav() {
    const navContainer = document.getElementById('nav-container');
    if (navContainer) {
        fetch('components/nav.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load navigation');
                }
                return response.text();
            })
            .then(html => {
                navContainer.innerHTML = html;
                // Reinitialize mobile menu functionality after loading nav
                initMobileMenu();
                // Highlight current page in navigation
                highlightCurrentPage();
            })
            .catch(error => {
                console.error('Error loading navigation:', error);
            });
    }
}

function loadFooter() {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('components/footer.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load footer');
                }
                return response.text();
            })
            .then(html => {
                footerContainer.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading footer:', error);
                // Fallback footer if component fails to load
                footerContainer.innerHTML = `
                    <footer class="footer">
                        <div class="container">
                            <div class="footer-bottom">
                                <p>&copy; 2024 The Crucible House. All rights reserved.</p>
                            </div>
                        </div>
                    </footer>
                `;
            });
}

function initMobileMenu() {
    // Mobile Navigation Toggle - needs to run after nav is loaded
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        // Remove existing listeners to avoid duplicates
        const newHamburger = hamburger.cloneNode(true);
        hamburger.parentNode.replaceChild(newHamburger, hamburger);
        
        const newNavMenu = navMenu.cloneNode(true);
        navMenu.parentNode.replaceChild(newNavMenu, navMenu);

        // Add event listeners
        newHamburger.addEventListener('click', () => {
            newHamburger.classList.toggle('active');
            newNavMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                newHamburger.classList.remove('active');
                newNavMenu.classList.remove('active');
            });
        });
    }
}

function highlightCurrentPage() {
    // Highlight current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

