# Mapify - Custom Map Generator

Mapify is a web-based tool that allows users to create and customize maps with multiple locations, then embed them on their own websites using a simple iframe.

## Features

- Add multiple locations by name or coordinates
- Customize map appearance (width, height, zoom level)
- Toggle scroll zoom functionality
- Add custom popup text for each location
- Generate embeddable iframe code
- Responsive design that works on all devices

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mapify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the development server with nodemon, which automatically restarts the server when you make changes.

### Production Mode

```bash
npm start
```

By default, the application will be available at `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Add locations by clicking the "+ Add Location" button
3. Configure your map settings (width, height, zoom level, etc.)
4. Click "Generate Map" to create your map
5. Copy the provided iframe code and paste it into your website

## Project Structure

```
mapify/
├── public/               # Static files
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   └── images/           # Image assets
├── views/               # EJS templates
│   ├── index.ejs         # Main application page
│   └── embed.ejs         # Embedded map page
├── routes/              # Express routes
├── models/              # Database models
├── config/              # Configuration files
├── app.js               # Main application file
└── package.json         # Project dependencies and scripts
```

## Dependencies

- Express.js - Web framework
- EJS - Templating engine
- Leaflet.js - Interactive maps
- LowDB - Simple JSON database
- Nanoid - Generate unique IDs

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
