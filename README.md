# Garden Designer

Garden Designer is an interactive 3D garden layout project built with Three.js. It lets users place and arrange garden objects such as benches, trees, lamps, fences, flowers, mushrooms, roses, and grass on a configurable terrain.

## Features

- Interactive 3D garden scene
- Place, rotate, and remove garden objects
- Adjustable plot width and depth
- Adjustable terrain height
- Day and night lighting modes
- Random grass placement
- Local OBJ models and texture assets

## Project Structure

```text
GardenDesigner/
├── index.html              # Main HTML page and user interface
├── main.js                 # Main application logic
├── setup.js                # Three.js scene, camera, renderer, and lighting setup
├── components/             # Garden assets, terrain, lighting, materials, and placement logic
├── build/                  # Local Three.js modules and controls
├── models/                 # 3D OBJ model files
├── image/                  # Texture and normal map assets
├── attribution.txt         # Asset attribution information
└── README.md
```

## Requirements

- Visual Studio Code
- Live Server extension for Visual Studio Code

This project uses ES modules and local model/texture files, so it must be served through a local server. Opening `index.html` directly in the browser may cause module or asset loading errors.

## How to Run

1. Open the `GardenDesigner` folder in Visual Studio Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right click `index.html`.
4. Select **Open with Live Server**.
5. The project will open in your browser, usually at a local address such as:

```text
http://127.0.0.1:5500/index.html
```

## Controls

- Select an item button to choose what to place.
- Click on the garden terrain to place the selected item.
- Use **Rotate** to rotate the next placed object.
- Use **Cursor** to switch to remove mode.
- Use **Random grass** to scatter grass around the garden.
- Use **Clear** to remove placed objects.
- Adjust the sliders to change the plot size, terrain height, and sun strength.
- Switch between **Day** and **Night** lighting modes.

## Troubleshooting

If models or textures do not load:

- Make sure the project is running through Live Server.
- Make sure the browser URL starts with `http://127.0.0.1` or `http://localhost`, not `file://`.
- Check that the `models/`, `image/`, `build/`, and `components/` folders are still in the project root.

## Credits

See `attribution.txt` for asset attribution details.
