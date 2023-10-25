![Pitchbender logo](https://raw.githubusercontent.com/jehna/pitchbender/master/logo.png)

# Pitchbender
> Visual pitch shifter

Pitchbender is a visual, note based audio editing webapp. You can "autotune"
your audio by shifting notes around.

![Screenshot of Pitchbender](https://raw.githubusercontent.com/jehna/pitchbender/master/screenshot.png)

## Try it out yourself!

Pitchbender is freely available at:

https://jehna.github.io/pitchbender/

## Developing

To start the local development server, run:

```shell
yarn
yarn start
```

This will install required dependencies and starts the local development server
at http://localhost:1234. Visit the URL in your browser to start using the app.

### Building

To build the project for production, run:

```shell
yarn build
```

This builds the project to `dist/` folder.

### Deploying

This project is automagically deoployed to Github Pages on every `main` branch
push via Github Actions.

## Features

This project is a PoC learning project with the following features:
* Note based audio editing
* Audio is automatically split to draggable boxes based on pitch
* Pitch can be changed by selecting the box and pressing arrow keys, which
  shifts the box by a semitone
  * Pressing shift will nudge the box by tenth of a semitone

## Contributing

If you'd like to contribute, please fork the repository and use a feature
branch. Pull requests are warmly welcome.

## Licensing

The code in this project is licensed under MIT license.

## Logo

The logo was created using DALL·E 3 image generation AI with the following
prompt:

```
a logo for a professional tool called "pitchbender" that helps music professionals tune and pitch shift tracks visually
```