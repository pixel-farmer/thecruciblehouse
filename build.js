const fs = require('fs');
const path = require('path');

// Read component files
const navHTML = fs.readFileSync(path.join(__dirname, 'components', 'nav.html'), 'utf8');
const footerHTML = fs.readFileSync(path.join(__dirname, 'components', 'footer.html'), 'utf8');

// Get all HTML files in the root directory
const htmlFiles = fs.readdirSync(__dirname).filter(file => 
    file.endsWith('.html') && 
    file !== 'index.html' && 
    !file.startsWith('node_modules')
);

// Also include index.html
htmlFiles.unshift('index.html');

// Process each HTML file
htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace nav container with actual nav HTML
        content = content.replace(
            /<div id="nav-container"><\/div>/g,
            navHTML
        );
        
        // Replace footer container with actual footer HTML
        content = content.replace(
            /<div id="footer-container"><\/div>/g,
            footerHTML
        );
        
        // Remove the loadComponents script since components are now inlined
        content = content.replace(
            /<script src="scripts\/loadComponents\.js"><\/script>\s*/g,
            ''
        );
        
        // Write the updated content back to the file
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Built: ${file}`);
    } catch (error) {
        console.error(`✗ Error processing ${file}:`, error.message);
    }
});

console.log('\n✓ Build complete! All components have been inlined.');

