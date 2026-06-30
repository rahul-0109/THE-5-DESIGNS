const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf-8');
const projectHtml = fs.readFileSync('project.html', 'utf-8');

// Extract head (from <head> to </head>)
const headMatch = indexHtml.match(/<head>([\s\S]*?)<\/head>/);
const newHead = headMatch ? headMatch[1] : '';

// Extract nav (from <nav class="on-dark"> to </nav>)
const navMatch = indexHtml.match(/<nav class="on-dark">([\s\S]*?)<\/nav>/);
const newNav = navMatch ? navMatch[0] : '';

// Extract cursor and noise
const cursorNoise = `
    <div class="noise-overlay"></div>
    <div class="cursor-dot"></div>
    <div class="cursor-halo"></div>
`;

// Extract scripts (GSAP, Lenis, Custom Logic)
const scriptsAndFooter = `
    <!-- Footer -->
    <section id="slide-11" style="background-color: var(--color-obsidian); color: #F5F5F0; padding: 4rem 10% 2rem 10%; align-items: flex-start; justify-content: flex-start; height: auto;">
        <div style="width: 100%; display: flex; justify-content: space-between; border-bottom: 1px solid rgba(245, 245, 240, 0.1); padding-bottom: 4rem; margin-bottom: 2rem;">
            <div>
                <h2 style="font-size: 3rem; margin-bottom: 1rem;"><span class="brand-five">5</span></h2>
                <p style="color: rgba(245, 245, 240, 0.6); font-size: 0.9rem; max-width: 300px; line-height: 1.6;">A studio built on a simple belief: true luxury lies in the experience.</p>
            </div>
            <div style="display: flex; gap: 4rem;">
                <div>
                    <h4 style="font-family: var(--font-body); font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 1.5rem;">Connect</h4>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 1rem;">
                        <li><a href="#" aria-label="Instagram" class="nav-link" style="color: rgba(245, 245, 240, 0.6); font-size: 0.9rem; letter-spacing: 0.05em; text-transform: none;">Instagram</a></li>
                        <li><a href="#" aria-label="Whatsapp" class="nav-link" style="color: rgba(245, 245, 240, 0.6); font-size: 0.9rem; letter-spacing: 0.05em; text-transform: none;">WhatsApp</a></li>
                        <li><a href="mailto:info@the5designs.com" class="nav-link" style="color: rgba(245, 245, 240, 0.6); font-size: 0.9rem; letter-spacing: 0.05em; text-transform: none;">info@the5designs.com</a></li>
                    </ul>
                </div>
                <div>
                    <h4 style="font-family: var(--font-body); font-size: 0.8rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-accent); margin-bottom: 1.5rem;">Studio</h4>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 1rem;">
                        <li><a href="/terms.html" class="nav-link" style="color: rgba(245, 245, 240, 0.6); font-size: 0.9rem; letter-spacing: 0.05em; text-transform: none;">Terms & Conditions</a></li>
                        <li style="color: rgba(245, 245, 240, 0.6); font-size: 0.9rem; line-height: 1.6;">Banjara Hills, Road No 12<br>Hyderabad, India</li>
                    </ul>
                </div>
            </div>
        </div>
        <div style="width: 100%; text-align: center;">
            <p style="color: rgba(245, 245, 240, 0.4); font-size: 0.8rem; letter-spacing: 0.1em;">© 2026 THE 5 DESIGNS. ALL RIGHTS RESERVED.</p>
        </div>
    </section>

    <!-- WhatsApp Floating Button -->
    <a href="#" class="whatsapp-float" aria-label="Contact on WhatsApp">
        <svg viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.391.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/></svg>
    </a>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
    <script src="https://unpkg.com/lenis@1.1.9/dist/lenis.min.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Lenis Smooth Scroll
            const lenis = new Lenis({
                duration: 1.2,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smooth: true,
            });
            function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
            requestAnimationFrame(raf);
            
            // GSAP ScrollTrigger Integration
            gsap.ticker.add((time) => { lenis.raf(time * 1000) });
            gsap.ticker.lagSmoothing(0, 0);

            // Custom Cursor
            const cursorDot = document.querySelector('.cursor-dot');
            const cursorHalo = document.querySelector('.cursor-halo');
            let mouseX = 0, mouseY = 0, haloX = 0, haloY = 0;
            
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
                if(cursorDot) cursorDot.style.transform = \`translate(\${mouseX - 3}px, \${mouseY - 3}px)\`;
            });
            
            function animateHalo() {
                haloX += (mouseX - haloX) * 0.15;
                haloY += (mouseY - haloY) * 0.15;
                if(cursorHalo) cursorHalo.style.transform = \`translate(\${haloX - 20}px, \${haloY - 20}px)\`;
                requestAnimationFrame(animateHalo);
            }
            animateHalo();
            
            // Hover states
            document.querySelectorAll('a, button, input, .video-card, .founder-image').forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
            });

            // SCROLL REVEAL ENGINE
            document.querySelectorAll('section').forEach((section) => {
                const elements = section.querySelectorAll('h2, p, .space-image-wrapper, .space-content');
                if(elements.length === 0) return;
                gsap.to(elements, {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    },
                    y: 0,
                    opacity: 1,
                    duration: 1.2,
                    stagger: 0.1,
                    ease: "power3.out"
                });
            });

            // Navigation State
            const nav = document.querySelector('nav');
            ScrollTrigger.create({
                trigger: ".project-hero",
                start: "top top",
                onLeave: () => { if(nav) { nav.classList.remove('on-dark'); nav.classList.add('scrolled'); } },
                onEnterBack: () => { if(nav) { nav.classList.add('on-dark'); nav.classList.remove('scrolled'); } }
            });
            
            fetchSiteConfig();
        });
        
        async function fetchSiteConfig() {
            try {
                const response = await fetch('/api/settings');
                const resData = await response.json();
                if (response.ok && resData.success && resData.data) {
                    const data = resData.data;
                    Object.keys(data).forEach(key => {
                        if (key === 'whatsapp_number') {
                            const waLink = 'https://wa.me/' + data[key].replace(/[^0-9]/g, '');
                            document.querySelectorAll('.whatsapp-float, [aria-label="Whatsapp"], [aria-label="Contact on WhatsApp"]').forEach(a => a.href = waLink);
                        }
                    });
                }
            } catch (e) { 
                console.warn("CMS Dynamic Sync offline."); 
            }
        }
    </script>
`;

// Now extract the unique project.html content
// specifically .project-hero and .project-details CSS
const projectStylesMatch = projectHtml.match(/(\/\* Project Hero \*\/[\s\S]*?)\/\* Footer \*\//);
let projectStyles = projectStylesMatch ? projectStylesMatch[1] : '';

// And the body content (Hero and Details)
const bodyMatch = projectHtml.match(/(<!-- Dynamic Hero -->[\s\S]*?<!-- Dynamic Spaces Gallery -->[\s\S]*?)<\/section>/);
let bodyContent = bodyMatch ? (bodyMatch[1] + '</section>') : '';

// Ensure elements start with opacity 0 and y 30px for GSAP
projectStyles += `
        /* Add GSAP initial states */
        .space-title, .space-desc, .space-image-wrapper {
            opacity: 0;
            transform: translateY(30px);
        }
        .project-hero {
            background-color: var(--color-obsidian);
        }
        .project-meta-tag {
            color: var(--color-accent);
            letter-spacing: 0.4em;
            font-size: 0.8rem;
            text-transform: uppercase;
            margin-bottom: 1rem;
        }
`;

// Remove the inline style from index <head> that makes section height 100vh everywhere
// Since project uses specific heights or auto heights for its gallery
const cleanHead = newHead.replace(/section\s*{\s*width:\s*100%;\s*height:\s*100vh;/g, 'section { width: 100%; min-height: 100vh;');

const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${cleanHead}
    <style>
${projectStyles}
    </style>
</head>
<body>
${cursorNoise}
${newNav}
${bodyContent}
${scriptsAndFooter}
</body>
</html>
`;

fs.writeFileSync('project_new.html', finalHtml, 'utf-8');
console.log('Successfully generated project_new.html');
