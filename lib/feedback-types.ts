export type Segment = {
  id: string;
  name: string;
  description: string;
};

export type FeedbackEntry = {
  id: string;
  segmentId: string;
  text: string;
  source: string;
  createdAt: string;
  tags?: string[];
};

export type JTBDFeedback = {
  job: string;
  situation: string;
  motivation: string;
  desiredOutcome: string;
  frictions: string;
  quote: string;
  confidence?: string;
  basedOn?: string[];
};
