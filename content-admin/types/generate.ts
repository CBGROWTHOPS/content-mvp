import type { StrategySelection } from "./strategy";

export interface GenerateRequest {
  brandId: string;
  strategySelection: StrategySelection;
}

export interface MarketingOutput {
  primaryText: string;
  headline: string;
  secondaryLine?: string;
  cta: string;
  caption: string;
  variations?: string[];
}

export interface ImageDirection {
  sceneDescription: string;
  cameraAngle: string;
  framing: string;
  interiorRequirements: string[];
  exteriorContext: string;
  textureNotes: string;
  lightingNotes: string;
}

export interface VideoDirection {
  scene1: string;
  scene2: string;
  timing: string;
  textOverlayRules: string;
  motionGuidance: string;
  colorGrade: string;
}

export interface CreativeBrief {
  imageDirection: ImageDirection;
  videoDirection: VideoDirection;
  editorGuardrails: string[];
}

export interface GenerateResponse {
  marketingOutput: MarketingOutput;
  creativeBrief: CreativeBrief;
}
