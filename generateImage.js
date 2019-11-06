fs = require('fs');
var PDFImage = require("pdf-image").PDFImage;
var Jimp = require('jimp');

process.on('unhandledRejection', function(reason, p){
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});

function checkNeighbour(row, col, strn) {
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
    if(row + 1 < config.size[1]) {
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
    if(col + 1 < config.size[0]) {
      return 1;
    }
    else {
      return 0;
    }
  }

  console.log("ERROR: " + strn);
  return -1;
}

//read config file
let config = JSON.parse(fs.readFileSync(process.argv[2] + '/' + process.argv[3] + '.json'));

var pdfImage = new PDFImage(process.argv[2] + '/' + process.argv[3] + '.pdf', {
convertOptions: {
    "-quality": process.argv[4] ? process.argv[4] : "75"
}
});
pdfImage.convertFile().then(async function (imagePaths) {

  images = [];
  for (let key in imagePaths) {
    console.log(key);
    images.push(await Jimp.read(imagePaths[key]));
  }




    // var w = image0.bitmap.width;
    // var h = image0.bitmap.height;
    // console.log(w, h);
    //
    // image0.crop(10, 10, w - 100, h - 100);

  var x = 0;
  var y = 0;

  for(var i = 0; i < config.page_layout.length; i++)
  {

    var row = Math.floor(i / config.size[0]);
    var col = Math.floor(i % config.size[0]);

    var w = images[config.page_layout[i]].bitmap.width;
    var h = images[config.page_layout[i]].bitmap.height;

    console.log(row, col, w, h)
    var crop_x = Math.round(checkNeighbour(row, col, 'LEFT') * w * (config.page_margin[0] / 100.0));
    var crop_y = Math.round(checkNeighbour(row, col, 'TOP') * h * (config.page_margin[1] / 100.0));
    var crop_w = Math.round(((checkNeighbour(row, col, 'RIGHT') == 0) ? w : w * ((100.0 - config.page_margin[2]) / 100.0)) - crop_x);
    var crop_h = Math.round(((checkNeighbour(row, col, 'BOTTOM') == 0) ? h : h * ((100.0 - config.page_margin[3]) / 100.0)) - crop_y);
    console.log(crop_x, crop_y, crop_w, crop_h);
    await images[config.page_layout[i]].crop(crop_x, crop_y, crop_w, crop_h);
  }


    var dim_x = 0, dim_y = 0;
    for(var i = 0; i < config.size[0]; i++)
    {
      dim_x += images[config.page_layout[i]].bitmap.width;
    }
    for(var i = 0; i < config.size[1]; i++)
    {
      dim_y += images[config.page_layout[i * config.size[0]]].bitmap.height;
    }

    console.log(dim_x, dim_y);
    var x=0, y=0;
    var mainImage = new Jimp(dim_x, dim_y, async function (err, image) {
      for(var j = 0; j < Math.round(config.page_layout.length / config.size[1]); j++)
      {
        var i;
        for(i = j; i < config.page_layout.length; i+=config.size[0])
        {
          console.log(i);
          await image.composite( images[config.page_layout[i]], x, y );
          y += images[config.page_layout[i]].bitmap.height;
        }
        x += images[config.page_layout[j]].bitmap.width;
        y = 0;
      }
      image.write('crop1.png');
    });
});
