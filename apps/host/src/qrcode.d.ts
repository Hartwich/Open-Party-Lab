declare module "qrcode" {
  export interface QRCodeRenderOptions {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
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

  export function toDataURL(text: string, options?: QRCodeRenderOptions): Promise<string>;
}
