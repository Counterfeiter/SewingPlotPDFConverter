var fs = require('fs');
var PDFImage = require("pdf-image").PDFImage;
var Jimp = require('jimp');

function makeIteratorThatFillsWithColor(color) {
  return function (x, y, offset) {
    this.bitmap.data.writeUInt32BE(color, offset, true);
  }
};

async function drawreactangle(image, x_start, y_start, w, h, width, color) {
  const fillCrimson = makeIteratorThatFillsWithColor(color);
  console.log(x_start, y_start, w, h, width);
  //check borders
  if(x_start < image.bitmap.width && y_start < image.bitmap.height)
  {
    w_clip = ( w + x_start < image.bitmap.width ) ? w : image.bitmap.width - x_start - 1;
    h_clip = ( h + y_start < image.bitmap.height ) ? h : image.bitmap.height - y_start - 1;
    w_width_clip = ( w + x_start < image.bitmap.width ) ? w + width : image.bitmap.width - x_start - width - 1;
    h_width_clip = ( h + y_start + width < image.bitmap.height ) ? h + width : image.bitmap.height - y_start - width - 1;

    await image.scan(x_start            , y_start             , w_clip          , width         , fillCrimson);
    if(h_clip === h) //if no clipping
      await image.scan(x_start          , y_start + h_clip    , w_width_clip    , width         , fillCrimson);
    await image.scan(x_start            , y_start             , width           , h_clip        , fillCrimson);
    if(w_clip === w)
      await image.scan(x_start + w_clip , y_start             , width           , h_width_clip  , fillCrimson);
  }
};

async function drawpapergrid(image, w, h, size, color) {
  for(var j = 0; j < size[1]; j++)
  {
    for(var i = 0; i < size[0]; i++)
    {
      var x = w * i;
      var y = h * j;
      if(x < image.bitmap.width && y < image.bitmap.height)
      {

        await drawreactangle(image, x, y, w, h, 1, color);
      }
    }
  }
};

function checkNeighbour(row, col, strn, size) {
  if(strn === 'TOP')
  {
    if(row - 1 >= 0) {
      return 1;
    }
    else {
      return 0;
    }
  }
  else if(strn == 'BOTTOM') {
    if(row + 1 < size[1]) {
      return 1;
    }
    else {
      return 0;
    }
  }
  else if(strn == 'LEFT') {
    if(col - 1 >= 0) {
      return 1;
    }
    else {
      return 0;
    }
  }
  else if(strn == 'RIGHT') {
    if(col + 1 < size[0]) {
      return 1;
    }
    else {
      return 0;
    }
  }

  console.log("ERROR: " + strn);
  return -1;
}

async function main() {
  //read config file
  let config = JSON.parse(fs.readFileSync(process.argv[2] + '/' + process.argv[3] + '.json'));

  var pdfImage = new PDFImage(process.argv[2] + '/' + process.argv[3] + '.pdf', {
  convertOptions: {
      "-quality" : "75",
      "-density": process.argv[4] ? process.argv[4] : "75"
  }
  });
  images = [];
  var grid_w = 0, grid_h = 0;
  for(var i = 0; i < config.page_layout.length; i++)
  {
    await pdfImage.convertPage(config.page_layout[i]).then(async function (imagePath) {

      console.log("Convert page: " + config.page_layout[i].toString());
      var image = await Jimp.read(imagePath);
      if(grid_h == 0 && grid_w == 0) {
        grid_w = image.bitmap.width;
        grid_h = image.bitmap.height;
      }
      else {
        if(grid_w != image.bitmap.width || grid_h != image.bitmap.height) {
          console.log("WARNING: Page size differs! Could result in undefined behaviour!");
          console.log([grid_w, grid_h, image.bitmap.width, image.bitmap.height]);
        }
      }
      //store image in memory (list)
      images.push(image);
      //delete created file from disk
      fs.unlinkSync(imagePath);
    });
  }


  //cut the page margin
  var x = 0;
  var y = 0;
  for(var i = 0; i < config.page_layout.length; i++)
  {

    var row = Math.floor(i / config.size[0]);
    var col = Math.floor(i % config.size[0]);

    var w = images[i].bitmap.width;
    var h = images[i].bitmap.height;

    console.log(row, col, w, h)
    var crop_x = Math.round(checkNeighbour(row, col, 'LEFT', config.size) * w * (config.page_margin[0] / 100.0));
    var crop_y = Math.round(checkNeighbour(row, col, 'TOP', config.size) * h * (config.page_margin[1] / 100.0));
    var crop_w = Math.round(((checkNeighbour(row, col, 'RIGHT', config.size) == 0) ? w : w * ((100.0 - config.page_margin[2]) / 100.0)) - crop_x);
    var crop_h = Math.round(((checkNeighbour(row, col, 'BOTTOM', config.size) == 0) ? h : h * ((100.0 - config.page_margin[3]) / 100.0)) - crop_y);
    console.log(crop_x, crop_y, crop_w, crop_h);
    await images[i].crop(crop_x, crop_y, crop_w, crop_h);
  }


  //calc size og the new image
  var dim_x = 0, dim_y = 0;
  for(var i = 0; i < config.size[0]; i++)
  {
    dim_x += images[i].bitmap.width;
  }
  for(var i = 0; i < config.size[1]; i++)
  {
    dim_y += images[i * config.size[0]].bitmap.height;
  }

  console.log(dim_x, dim_y);

  //create a large image from single images
  x=0;
  y=0;
  var mainImage = new Jimp(dim_x, dim_y, async function (err, image) {
    for(var j = 0; j < Math.round(config.page_layout.length / config.size[1]); j++)
    {
      var i;
      for(i = j; i < config.page_layout.length; i+=config.size[0])
      {
        await image.composite( images[i], x, y );
        y += images[i].bitmap.height;
      }
      x += images[j].bitmap.width;
      y = 0;
    }
    //save image without paper grid
    image.write(process.argv[3] + '.png');

    //save a second image with paper grid
    if(config.draw_papergrid == true)
    {
      await drawpapergrid(image, grid_w, grid_h, config.size, 0xED143DFF);
      image.write(process.argv[3] + '_papergrid.png');
    }
  });
}


main();
