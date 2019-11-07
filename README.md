# Project Title

Sewing Plot PDF Converter

Proof of concept - sewing plotter pdf file to image converter

## Goal

Save hundreds of A4 paper sheets/time and pausch your files with help of a (DLP) projector.

## Getting Started

Download nodejs script and example json config file.

### Prerequisites

Install ImageMagick and check if converter execute is known by your host system.

```
sudo apt-get install imagemagick ghostscript poppler-utils
```

### Installing

Install node (12.x tested) and node modules

pdf to image

```
npm install pdf-image
```

and jimp for image manuipulation

```
npm install jimp
```

## config.json

Each pdf file requires a config file. Three thinks must be defined:

* page margin for left, top right and bottom independetly
* page count in x and y direction
* matrix with page numbers starting with index 0

## Running a test

Put the sewing plotter pdf file in the same directory like the json file. Both must have the same file name.

Command line options req.: [path] [filename] [dpi]


```
nodejs generateImage.js /home/user/myplottery Chino_kids 150
```

## Authors

* **Sebastian Förster** - *Initial work* - [Counterfeiter](https://github.com/Counterfeiter)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## TODO

* check command line parameters and config file
* convert only used pdf size not all
* build nice front end and discard json config file
