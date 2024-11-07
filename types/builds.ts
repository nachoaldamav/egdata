export interface SingleBuild {
  _id: string;
  appName: string;
  labelName: string;
  buildVersion: string;
  hash: string;
  metadata?: Metadata;
  downloadSizeBytes: number;
  installedSizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

interface Metadata {
  installationPoolId: string;
}

export interface BuildFiles {
  files: File[];
  page: number;
  limit: number;
  total: number;
}

export interface File {
  _id: string;
  manifestHash: string;
  appName: string;
  buildVersion: string;
  appLabel: string;
  fileName: string;
  symlinkTarget: string;
  fileHash: string;
  fileMetaFlags: number;
  installTags: string[];
  fileSize: number;
  mimeType: string;
  depth: number;
}

export interface BuildInstallOptions {
  [key: string]: {
    files: number;
    size: number;
  };
}

export interface Build {
  _id: string;
  appName: string;
  labelName: string;
  buildVersion: string;
  hash: string;
  createdAt: string;
  updatedAt: string;
  technologies?: Technology[];
}

export interface Technology {
  section: string;
  technology: string;
}
