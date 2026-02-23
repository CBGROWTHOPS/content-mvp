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

export interface CreativeDirectorBrief {
  creativeDirection: {
    concept: string;
    audienceFeeling: string;
    visualMetaphor: string;
    pacingReference: string;
    editingReference: string;
    doAndDontList: string[];
  };
  artDirection: {
    locationStyle: string;
    materials: string[];
    colorPalette: string[];
    textureNotes: string;
    furnitureNotes: string;
    windowDetails: string;
    timeOfDay: string;
    weatherCues: string;
  };
  cameraDirection: {
    lensFeel: string;
    framingRules: string[];
    movementRules: string[];
    compositionRules: string[];
    mustBeVisible: string[];
  };
  lightingDirection: {
    exposureTargets: string;
    glareBehavior: string;
    diffusionBehavior: string;
    shadowBehavior: string;
  };
  typographySystem: {
    fontType: string;
    hierarchy: string;
    placementGrid: string;
    animationRules: string;
    maxWordsPerFrame: number;
  };
  soundDirection: {
    musicMood: string;
    sfxList: string[];
    mixNotes: string;
    voiceoverStyle: string;
  };
  deliverables: {
    cuts: string[];
    hookVariants: number;
    ctaEndFrame: string;
  };
}

export interface ReelBlueprintShot {
  shotId: string;
  timeStart: number;
  timeEnd: number;
  shotType: "wide" | "medium" | "close";
  cameraMovement: "static" | "slow_push" | "handheld" | "pan" | "other";
  sceneDescription: string;
  propsSetDressingNotes?: string;
  lightingNotes?: string;
  talentNotes?: string;
  onScreenText?: {
    text: string;
    position?: string;
    animationRules?: string;
  };
  brollRequirements?: string;
  assetRequirements?: string[];
}

export interface ReelBlueprint {
  format: string;
  durationSeconds: number;
  fps: number;
  music?: string;
  soundDesign?: string;
  colorGrade?: string;
  typography?: string;
  deliverables?: string[];
  shots: ReelBlueprintShot[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface GenerateResponse {
  generationId?: string;
  marketingOutput: MarketingOutput;
  /** Present for Template level; omitted for Director/Cinematic */
  creativeBrief?: CreativeBrief | null;
  creativeDirectorBrief?: CreativeDirectorBrief | null;
  reelBlueprint?: ReelBlueprint | null;
  tokenUsage?: TokenUsage;
}
