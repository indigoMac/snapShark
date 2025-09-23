declare module 'imagetracerjs' {
  interface ImageTracerOptions {
    corsenabled?: boolean;
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorration?: number;
    colorquantcycles?: number;
    scale?: number;
    simplifytolerance?: number;
    roundcoords?: number;
    lcpr?: number;
    qcpr?: number;
    desc?: boolean;
    viewbox?: boolean;
    blurradius?: number;
    blurdelta?: number;
  }

  function imagedataToSVG(
    imageData: ImageData,
    options?: ImageTracerOptions
  ): string;
  function imageToSVG(
    image: HTMLImageElement,
    options?: ImageTracerOptions
  ): string;

  const ImageTracer: {
    imagedataToSVG: typeof imagedataToSVG;
    imageToSVG: typeof imageToSVG;
  };

  export = ImageTracer;
}
