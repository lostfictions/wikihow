declare module "canvas" {
  import { Readable } from "stream";

  export function createCanvas(
    width: number,
    height: number
  ): HTMLCanvasElement & {
    createPNGStream(): Readable;
  };
  export function loadImage(path: string): Promise<ImageBitmap>;
  export function registerFont(
    path: string,
    props: { family: string; weight?: string | number; style?: string }
  ): void;
  export const Image: {
    new (width?: number, height?: number): HTMLImageElement;
  };
}
