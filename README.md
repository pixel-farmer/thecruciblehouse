# The Crucible House - Art Gallery Website

A modern, elegant art gallery website showcasing artwork with a clean, sophisticated design inspired by contemporary art galleries.

## Features

- **Responsive Design**: Works beautifully on desktop, tablet, and mobile devices
- **Gallery Section**: Filterable gallery with categories (All, Recent, Series, Archive)
- **Featured Works**: Highlight your best pieces on the homepage
- **About Section**: Tell your story and share your artistic vision
- **Contact Form**: Easy way for visitors to get in touch
- **Smooth Animations**: Subtle scroll effects and transitions
- **Lightbox**: Click any artwork to view it in full-screen detail

## Getting Started

### Prerequisites

- Node.js (v14 or higher) and npm installed on your system
- Download from [nodejs.org](https://nodejs.org/)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   
   This will automatically open your browser at `http://localhost:3000`

### Available Scripts

- `npm run dev` or `npm start` - Starts a local development server with live reload (components load dynamically)
- `npm run build` - Inlines navigation and footer components into all HTML files (for static deployment)

### Quick Start (Without npm)

If you prefer not to use npm, you can simply:
1. Open `index.html` in your web browser
2. The website will work, but without live reload functionality

## Customization

### Adding Your Artwork

Replace the placeholder divs with actual images:

```html
<!-- Instead of this: -->
<div class="gallery-image-placeholder">
    <span>Artwork</span>
</div>

<!-- Use this: -->
<img src="path/to/your/artwork.jpg" alt="Artwork Title" class="gallery-image">
```

### Updating Content

- **Hero Section**: Edit the title and subtitle in the `#home` section
- **About Section**: Update the text in the `#about` section with your bio
- **Contact Info**: Change email and social media links in the `#contact` section
- **Featured Works**: Update titles and details in the `#featured` section

### Styling

The color scheme can be customized in `styles.css` using CSS variables:

```css
:root {
    --primary-color: #1a1a1a;      /* Main text/background */
    --secondary-color: #f5f5f5;    /* Light backgrounds */
    --accent-color: #d4af37;       /* Accent/gold color */
    --text-dark: #2c2c2c;          /* Dark text */
    --text-light: #666;            /* Light text */
}
```

### Adding More Artists

The structure is designed to easily accommodate additional artists:

1. Create new sections for each artist
2. Add navigation links as needed
3. Consider adding an "Artists" dropdown menu in the future

## File Structure

```
TheCrucibleHouse/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── script.js           # JavaScript functionality
├── package.json        # npm dependencies and scripts
├── .gitignore         # Git ignore file
├── node_modules/      # npm packages (auto-generated)
├── CH logo300x300.jpg  # Logo image
└── README.md           # This file
```

## Future Enhancements

- Backend integration for contact form submissions
- Database integration for artwork management
- E-commerce functionality for artwork sales
- Artist profiles page for multiple artists
- Blog/news section
- Newsletter signup functionality

## Browser Support

Works on all modern browsers:
- Chrome
- Firefox
- Safari
- Edge

## Notes

- The contact form currently shows an alert on submission. You'll need to connect it to a backend service (like Formspree, Netlify Forms, or your own server) to actually send emails.
- Social media links are placeholders - update them with your actual profiles.
- Image placeholders will need to be replaced with your actual artwork images.

## Credits

Design inspired by contemporary art galleries like Porterhouse Fine Art Editions.

