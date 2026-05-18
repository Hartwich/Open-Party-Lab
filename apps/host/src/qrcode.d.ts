declare module "qrcode" {
  export interface QRCodeRenderOptions {
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeRenderOptions
  ): Promise<void>;
}
