import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

interface VersionInfo {
  version: string;
  commit: string;
  branch: string;
  buildTime: string;
  environment: string;
}

function getVersionInfo(): VersionInfo {
  // Try to read embedded version info from the Docker image
  try {
    const versionFile = join(process.cwd(), 'version.json');
    const content = readFileSync(versionFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    // Fallback to environment variables or defaults
    return {
      version: process.env.npm_package_version || '0.1.0',
      commit: process.env.GIT_COMMIT || 'unknown',
      branch: process.env.GIT_BRANCH || 'unknown',
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

export async function GET() {
  const version = getVersionInfo();
  
  return NextResponse.json({
    ...version,
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
  }, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}
